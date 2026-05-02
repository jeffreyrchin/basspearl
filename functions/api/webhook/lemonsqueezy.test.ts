import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'node:crypto';

// ── Mocks ────────────────────────────────────────────────────────────────────
const mockSet = vi.fn().mockResolvedValue(undefined);
const mockDoc = vi.fn(() => ({ set: mockSet }));
const mockCollection = vi.fn(() => ({ doc: mockDoc }));

vi.mock('firebase-admin/app', () => ({
    initializeApp: vi.fn(),
    cert: vi.fn(),
    getApps: vi.fn(() => [])
}));

vi.mock('firebase-admin/firestore', () => ({
    getFirestore: vi.fn(() => ({
        collection: mockCollection
    }))
}));

// Import the function after setting up mocks
const { onRequestPost } = await import('./lemonsqueezy');

// ── Helpers ──────────────────────────────────────────────────────────────────
const SECRET = 'test_secret';
const SERVICE_ACCOUNT = JSON.stringify({ project_id: 'test' });

function generateSignature(payloadStr: string, secret: string) {
    return crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
}

function createMockContext(payload: any, signatureOverride?: string, secretOverride?: string) {
    const payloadStr = JSON.stringify(payload);
    const signature = signatureOverride ?? generateSignature(payloadStr, SECRET);

    const headers = new Headers();
    if (signature) headers.set('x-signature', signature);
    headers.set('Content-Type', 'application/json');

    const request = new Request('http://localhost', {
        method: 'POST',
        headers,
        body: payloadStr
    });

    return {
        request,
        env: {
            LEMON_SQUEEZY_WEBHOOK_SECRET: secretOverride !== undefined ? secretOverride : SECRET,
            FIREBASE_SERVICE_ACCOUNT: SERVICE_ACCOUNT
        }
    };
}

// ── Tests ────────────────────────────────────────────────────────────────────
describe('Lemon Squeezy Webhook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Security & Validation', () => {
        it('returns 400 if secret is missing', async () => {
            const context = createMockContext({}, 'fake_signature', ''); // Empty secret
            const response = await onRequestPost(context);
            expect(response.status).toBe(400);
            expect(await response.text()).toBe('Missing signature or secret');
        });

        it('returns 400 if signature is missing', async () => {
            const context = createMockContext({});
            context.request.headers.delete('x-signature'); // Remove signature
            
            const response = await onRequestPost(context);
            expect(response.status).toBe(400);
            expect(await response.text()).toBe('Missing signature or secret');
        });

        it('returns 403 if signature is invalid', async () => {
            const payload = { meta: { event_name: 'order_created' } };
            const context = createMockContext(payload, 'wrong_signature');
            
            const response = await onRequestPost(context);
            expect(response.status).toBe(403);
            expect(await response.text()).toBe('Invalid signature');
        });
    });

    describe('Event Handling', () => {
        it('returns 200 and ignores non-order_created events', async () => {
            const payload = { meta: { event_name: 'subscription_cancelled' } };
            const context = createMockContext(payload);
            
            const response = await onRequestPost(context);
            expect(response.status).toBe(200);
            expect(await response.text()).toBe('Event ignored');
            expect(mockSet).not.toHaveBeenCalled();
        });

        it('returns 400 if uid is missing from custom_data', async () => {
            const payload = { 
                meta: { 
                    event_name: 'order_created',
                    custom_data: { some_other_data: '123' } // No uid
                } 
            };
            const context = createMockContext(payload);
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            
            const response = await onRequestPost(context);
            expect(response.status).toBe(400);
            expect(await response.text()).toBe('No user ID provided');
            expect(mockSet).not.toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });
    });

    describe('Database Updates', () => {
        it('successfully updates user document when payload is valid', async () => {
            const payload = { 
                meta: { 
                    event_name: 'order_created',
                    custom_data: { uid: 'user_xyz123' } 
                } 
            };
            const context = createMockContext(payload);
            
            const response = await onRequestPost(context);
            
            expect(response.status).toBe(200);
            expect(await response.text()).toBe('Webhook processed successfully');
            
            expect(mockCollection).toHaveBeenCalledWith('users');
            expect(mockDoc).toHaveBeenCalledWith('user_xyz123');
            expect(mockSet).toHaveBeenCalledWith({ isPro: true }, { merge: true });
        });
    });
});
