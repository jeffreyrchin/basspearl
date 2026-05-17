import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Firebase mock ──────────────────────────────────────────────────────────────
const mockSetDoc = vi.fn().mockResolvedValue(undefined);
const mockGetDoc = vi.fn();
const mockDoc = vi.fn((db, collection, id) => ({ path: `${collection}/${id}` }));

vi.mock('firebase/firestore', () => ({
    doc: mockDoc,
    getDoc: mockGetDoc,
    setDoc: mockSetDoc,
}));

vi.mock('../firebase', () => ({ db: {} }));

// ── Import the store AFTER mocks are set up ────────────────────────────────────
const { useProStore } = await import('./useProStore');

// ── Helpers ────────────────────────────────────────────────────────────────────
const store = () => useProStore.getState();

const resetStore = () => {
    useProStore.setState({ isPro: false, isProModalOpen: false, daily4kCount: 0, last4kDate: '' });
    vi.clearAllMocks();
};

describe('useProStore', () => {
    beforeEach(resetStore);

    describe('Modal State', () => {
        it('opens the pro modal', () => {
            store().openProModal();
            expect(store().isProModalOpen).toBe(true);
        });

        it('closes the pro modal', () => {
            useProStore.setState({ isProModalOpen: true });
            store().closeProModal();
            expect(store().isProModalOpen).toBe(false);
        });
    });

    describe('loadProStatus', () => {
        it('sets isPro to true and populates daily4kCount and last4kDate if cloud data exists', async () => {
            mockGetDoc.mockResolvedValueOnce({
                exists: () => true,
                data: () => ({ isPro: true, daily4kCount: 3, last4kDate: '2026-05-16' }),
            });
            await store().loadProStatus('user_123');
            expect(store().isPro).toBe(true);
            expect(store().daily4kCount).toBe(3);
            expect(store().last4kDate).toBe('2026-05-16');
            expect(mockDoc).toHaveBeenCalledWith({}, 'users', 'user_123');
        });

        it('sets isPro to false and defaults daily4kCount/last4kDate if cloud data has them missing', async () => {
            mockGetDoc.mockResolvedValueOnce({
                exists: () => true,
                data: () => ({ isPro: false }),
            });
            await store().loadProStatus('user_123');
            expect(store().isPro).toBe(false);
            expect(store().daily4kCount).toBe(0);
            expect(store().last4kDate).toBe('');
        });

        it('sets isPro to false and daily4kCount/last4kDate to default if the document does not exist', async () => {
            mockGetDoc.mockResolvedValueOnce({
                exists: () => false,
                data: () => undefined,
            });
            await store().loadProStatus('user_123');
            expect(store().isPro).toBe(false);
            expect(store().daily4kCount).toBe(0);
            expect(store().last4kDate).toBe('');
        });

        it('sets all fields to default if Firestore throws an error', async () => {
            useProStore.setState({ isPro: true, daily4kCount: 4, last4kDate: '2026-05-16' }); // set to check override
            mockGetDoc.mockRejectedValueOnce(new Error('Network offline'));
            
            // spy on console.error so it doesn't clutter the test output
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            
            await store().loadProStatus('user_123');
            expect(store().isPro).toBe(false);
            expect(store().daily4kCount).toBe(0);
            expect(store().last4kDate).toBe('');
            
            consoleSpy.mockRestore();
        });
    });

    describe('buyPro', () => {
        beforeEach(() => {
            vi.stubEnv('VITE_LEMON_SQUEEZY_CHECKOUT_URL', 'https://test.lemonsqueezy.com/checkout/buy/123');
            
            // Mock window object
            const mockWindow = {
                open: vi.fn(),
                createLemonSqueezy: vi.fn(),
                LemonSqueezy: {
                    Url: { Open: vi.fn() },
                    Setup: vi.fn()
                }
            };
            vi.stubGlobal('window', mockWindow);
        });

        afterEach(() => {
            vi.unstubAllGlobals();
            vi.unstubAllEnvs();
        });

        it('does nothing if uid is empty', async () => {
            await store().buyPro('');
            expect(window.LemonSqueezy.Url.Open).not.toHaveBeenCalled();
            expect(store().isPro).toBe(false);
        });

        it('opens Lemon Squeezy checkout if initialized', async () => {
            await store().buyPro('user_456');
            expect(window.createLemonSqueezy).toHaveBeenCalled();
            expect(window.LemonSqueezy.Url.Open).toHaveBeenCalledWith('https://test.lemonsqueezy.com/checkout/buy/123?checkout[custom][uid]=user_456');
        });

        it('falls back to window.open if Lemon Squeezy is not initialized', async () => {
            window.createLemonSqueezy = undefined as any;
            await store().buyPro('user_456');
            expect(window.open).toHaveBeenCalledWith('https://test.lemonsqueezy.com/checkout/buy/123?checkout[custom][uid]=user_456', '_blank');
        });
    });

    describe('initPaymentListener', () => {
        beforeEach(() => {
            const mockWindow = {
                createLemonSqueezy: vi.fn(),
                LemonSqueezy: {
                    Setup: vi.fn(),
                    Url: { Open: vi.fn() }
                }
            };
            vi.stubGlobal('window', mockWindow);
        });

        afterEach(() => {
            vi.unstubAllGlobals();
        });

        it('does nothing if uid is empty', () => {
            store().initPaymentListener('');
            expect(window.LemonSqueezy.Setup).not.toHaveBeenCalled();
        });

        it('sets up Lemon Squeezy event handler', () => {
            store().initPaymentListener('user_123');
            expect(window.createLemonSqueezy).toHaveBeenCalled();
            expect(window.LemonSqueezy.Setup).toHaveBeenCalledWith({
                eventHandler: expect.any(Function)
            });
        });
    });

    describe('record4kExport', () => {
        it('does nothing if uid is empty', async () => {
            await store().record4kExport('');
            expect(mockSetDoc).not.toHaveBeenCalled();
            expect(store().daily4kCount).toBe(0);
        });

        it('resets/sets count to 1 if last export was on a different day', async () => {
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            useProStore.setState({ daily4kCount: 4, last4kDate: yesterday });

            await store().record4kExport('user_123');

            const today = new Date().toISOString().split('T')[0];
            expect(store().daily4kCount).toBe(1);
            expect(store().last4kDate).toBe(today);
            expect(mockSetDoc).toHaveBeenCalledWith(
                expect.objectContaining({ path: 'users/user_123' }),
                { daily4kCount: 1, last4kDate: today },
                { merge: true }
            );
        });

        it('increments the count if last export was today', async () => {
            const today = new Date().toISOString().split('T')[0];
            useProStore.setState({ daily4kCount: 2, last4kDate: today });

            await store().record4kExport('user_123');

            expect(store().daily4kCount).toBe(3);
            expect(store().last4kDate).toBe(today);
            expect(mockSetDoc).toHaveBeenCalledWith(
                expect.objectContaining({ path: 'users/user_123' }),
                { daily4kCount: 3, last4kDate: today },
                { merge: true }
            );
        });

        it('handles Firestore error gracefully without throwing', async () => {
            mockSetDoc.mockRejectedValueOnce(new Error('Firestore failed'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await store().record4kExport('user_123');

            expect(consoleSpy).toHaveBeenCalledWith('Failed to record 4K export:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });
});
