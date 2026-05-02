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
    useProStore.setState({ isPro: false, isProModalOpen: false });
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
        it('sets isPro to true if cloud data has isPro: true', async () => {
            mockGetDoc.mockResolvedValueOnce({
                exists: () => true,
                data: () => ({ isPro: true }),
            });
            await store().loadProStatus('user_123');
            expect(store().isPro).toBe(true);
            expect(mockDoc).toHaveBeenCalledWith({}, 'users', 'user_123');
        });

        it('sets isPro to false if cloud data has isPro: false', async () => {
            mockGetDoc.mockResolvedValueOnce({
                exists: () => true,
                data: () => ({ isPro: false }),
            });
            await store().loadProStatus('user_123');
            expect(store().isPro).toBe(false);
        });

        it('sets isPro to false if the document does not exist', async () => {
            mockGetDoc.mockResolvedValueOnce({
                exists: () => false,
                data: () => undefined,
            });
            await store().loadProStatus('user_123');
            expect(store().isPro).toBe(false);
        });

        it('sets isPro to false if Firestore throws an error', async () => {
            useProStore.setState({ isPro: true }); // set to true to ensure it gets overridden
            mockGetDoc.mockRejectedValueOnce(new Error('Network offline'));
            
            // spy on console.error so it doesn't clutter the test output
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            
            await store().loadProStatus('user_123');
            expect(store().isPro).toBe(false);
            
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
});
