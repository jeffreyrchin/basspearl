import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'node:crypto';

// ── Mocks ────────────────────────────────────────────────────────────────────
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Import the function after setting up mocks
const { onRequestPost } = await import('./lemonsqueezy');

// ── Helpers ──────────────────────────────────────────────────────────────────
const SECRET = 'test_secret';
const SERVICE_ACCOUNT = JSON.stringify({ 
    project_id: 'test_project',
    client_email: 'test@test.com',
    private_key: 'test_key' 
});

// We'll use vi.spyOn for crypto instead of vi.mock to avoid import binding issues
vi.spyOn(crypto, 'createSign').mockImplementation(() => ({
    update: vi.fn(),
    sign: vi.fn(() => 'mock_jwt_signature')
}) as any);

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
describe('Lemon Squeezy Webhook (REST API)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Default fetch mocks
        mockFetch.mockImplementation(async (url: string) => {
            if (url.includes('oauth2.googleapis.com')) {
                return {
                    ok: true,
                    json: async () => ({ access_token: 'mock_access_token' })
                };
            }
            if (url.includes('firestore.googleapis.com')) {
                return {
                    ok: true
                };
            }
            return { ok: false };
        });
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
            expect(mockFetch).not.toHaveBeenCalled();
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
            expect(mockFetch).not.toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });
    });

    describe('Database Updates', () => {
        it('successfully updates user document via fetch when payload is valid', async () => {
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
            
            // Should call token endpoint first
            expect(mockFetch).toHaveBeenNthCalledWith(1, 'https://oauth2.googleapis.com/token', expect.objectContaining({
                method: 'POST'
            }));
            
            // Should call Firestore endpoint second
            expect(mockFetch).toHaveBeenNthCalledWith(2, 'https://firestore.googleapis.com/v1/projects/test_project/databases/(default)/documents/users/user_xyz123?updateMask.fieldPaths=isPro', expect.objectContaining({
                method: 'PATCH',
                headers: {
                    'Authorization': 'Bearer mock_access_token',
                    'Content-Type': 'application/json'
                },
                body: expect.stringContaining('"booleanValue":true')
            }));
        });
        
        it('handles fetch errors gracefully', async () => {
            mockFetch.mockImplementation(async (url: string) => {
                if (url.includes('firestore.googleapis.com')) {
                    return { ok: false, text: async () => 'Permission denied' };
                }
                if (url.includes('oauth2.googleapis.com')) {
                    return { ok: true, json: async () => ({ access_token: 'token' }) };
                }
            });
            
            const payload = { meta: { event_name: 'order_created', custom_data: { uid: 'user1' } } };
            const context = createMockContext(payload);
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            
            const response = await onRequestPost(context);
            expect(response.status).toBe(500);
            expect(consoleSpy).toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });
    });
});
