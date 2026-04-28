// store/useProgressStore.test.ts
//
// Tests for the puzzle progress store.
// Firebase (Firestore) and localStorage are both mocked so these tests
// run instantly with no network or browser required.

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Firebase mock ──────────────────────────────────────────────────────────────
// We intercept all Firestore calls so no real database is hit.
// Each mock is a spy so we can assert it was called with the right arguments.

const mockSetDoc = vi.fn().mockResolvedValue(undefined);
const mockGetDoc = vi.fn();
const mockDoc = vi.fn((db, collection, id) => ({ path: `${collection}/${id}` }));
const mockArrayUnion = vi.fn((...args: number[]) => args); // Just return the array for inspection
const mockServerTimestamp = vi.fn(() => 'SERVER_TIMESTAMP');

vi.mock('firebase/firestore', () => ({
    doc: mockDoc,
    getDoc: mockGetDoc,
    setDoc: mockSetDoc,
    arrayUnion: mockArrayUnion,
    serverTimestamp: mockServerTimestamp,
}));

// firebase.ts re-exports `db` — mock it as a plain object
vi.mock('../firebase', () => ({ db: {} }));

// ── localStorage mock ─────────────────────────────────────────────────────────
// Vitest's jsdom provides localStorage, but since we're using `environment: 'node'`
// we provide a minimal in-memory fake.

const localStorageStore: Record<string, string> = {};
const localStorageMock = {
    getItem: (key: string) => localStorageStore[key] ?? null,
    setItem: (key: string, val: string) => { localStorageStore[key] = val; },
    removeItem: (key: string) => { delete localStorageStore[key]; },
    clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); },
};
vi.stubGlobal('localStorage', localStorageMock);

// ── Import the store AFTER mocks are set up ────────────────────────────────────
// Dynamic import ensures Vitest applies the vi.mock() hoisting correctly.
const { useProgressStore } = await import('./useProgressStore');

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Get the current store state directly (no React hooks needed). */
const store = () => useProgressStore.getState();

/** Reset all Zustand state and clear side-effects between tests. */
const resetStore = () => {
    useProgressStore.setState({ completedPuzzles: [], preGamePast: undefined, preGameFuture: undefined } as any);
    localStorageMock.clear();
    vi.clearAllMocks();
};

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('useProgressStore', () => {
    beforeEach(resetStore);

    // ── markComplete (Guest / Offline) ──────────────────────────────────────────
    describe('markComplete — guest mode (no uid)', () => {
        it('adds the puzzle index to the in-memory state', async () => {
            await store().markComplete(3, null);
            expect(store().completedPuzzles).toContain(3);
        });

        it('writes the result to localStorage', async () => {
            await store().markComplete(1, null);
            const stored = JSON.parse(localStorageMock.getItem('glitchbrain_completed_puzzles')!);
            expect(stored).toContain(1);
        });

        it('does NOT call Firestore when uid is null', async () => {
            await store().markComplete(0, null);
            expect(mockSetDoc).not.toHaveBeenCalled();
        });

        it('does not add duplicates', async () => {
            await store().markComplete(5, null);
            await store().markComplete(5, null);
            expect(store().completedPuzzles.filter(p => p === 5)).toHaveLength(1);
        });

        it('keeps the list sorted numerically', async () => {
            await store().markComplete(7, null);
            await store().markComplete(2, null);
            await store().markComplete(5, null);
            expect(store().completedPuzzles).toEqual([2, 5, 7]);
        });
    });

    // ── markComplete (Signed-in / Cloud) ───────────────────────────────────────
    describe('markComplete — signed-in mode (with uid)', () => {
        it('calls Firestore setDoc with the correct uid path', async () => {
            await store().markComplete(4, 'user_abc');
            expect(mockDoc).toHaveBeenCalledWith({}, 'users', 'user_abc');
            expect(mockSetDoc).toHaveBeenCalledOnce();
        });

        it('uses arrayUnion (ensures that the cloud array never has duplicates)', async () => {
            await store().markComplete(2, 'user_abc');
            const [, writeData] = mockSetDoc.mock.calls[0];
            expect(writeData.completedPuzzles).toEqual([2]);
        });

        it('includes a lastUpdated server timestamp in the write', async () => {
            await store().markComplete(6, 'user_abc');
            const [, writeData] = mockSetDoc.mock.calls[0];
            expect(writeData.lastUpdated).toBe('SERVER_TIMESTAMP');
        });

        it('still saves locally even if Firestore throws', async () => {
            mockSetDoc.mockRejectedValueOnce(new Error('Network error'));
            await store().markComplete(9, 'user_xyz');
            // Local state must still be updated
            expect(store().completedPuzzles).toContain(9);
            expect(localStorageMock.getItem('glitchbrain_completed_puzzles')).toContain('9');
        });
    });

    // ── loadProgress (Cloud → Local Merge) ────────────────────────────────────
    describe('loadProgress — merging cloud and local data', () => {
        it('sets completedPuzzles from a cloud snapshot', async () => {
            mockGetDoc.mockResolvedValueOnce({
                exists: () => true,
                data: () => ({ completedPuzzles: [0, 1, 2] }),
            });
            await store().loadProgress('user_abc');
            expect(store().completedPuzzles).toEqual([0, 1, 2]);
        });

        it('merges local guest progress with cloud data, with no duplicates', async () => {
            // User played levels 0 and 1 as a guest
            localStorageMock.setItem('glitchbrain_completed_puzzles', JSON.stringify([0, 1]));
            // Cloud already has levels 1 and 2
            mockGetDoc.mockResolvedValueOnce({
                exists: () => true,
                data: () => ({ completedPuzzles: [1, 2] }),
            });
            await store().loadProgress('user_abc');
            // Should be merged and deduplicated
            expect(store().completedPuzzles).toEqual([0, 1, 2]);
        });

        it('handles a new user with no cloud document gracefully', async () => {
            mockGetDoc.mockResolvedValueOnce({ exists: () => false, data: () => undefined });
            await store().loadProgress('brand_new_user');
            expect(store().completedPuzzles).toEqual([]);
        });

        it('does not throw if Firestore is unavailable', async () => {
            mockGetDoc.mockRejectedValueOnce(new Error('Offline'));
            await expect(store().loadProgress('user_abc')).resolves.not.toThrow();
        });
    });

    // ── isPuzzleComplete ────────────────────────────────────────────────────────
    describe('isPuzzleComplete', () => {
        it('returns true for a completed puzzle', async () => {
            await store().markComplete(0, null);
            expect(store().isPuzzleComplete(0)).toBe(true);
        });

        it('returns false for a puzzle not yet completed', () => {
            expect(store().isPuzzleComplete(99)).toBe(false);
        });
    });

    // ── syncLocalToCloud ────────────────────────────────────────────────────────
    describe('syncLocalToCloud', () => {
        it('syncs existing local progress to Firestore for a new user', async () => {
            localStorageMock.setItem('glitchbrain_completed_puzzles', JSON.stringify([0, 2, 4]));
            await store().syncLocalToCloud('user_abc');
            const [, writeData] = mockSetDoc.mock.calls[0];
            expect(writeData.completedPuzzles).toEqual([0, 2, 4]);
            expect(writeData.lastUpdated).toBe('SERVER_TIMESTAMP');
            expect(mockSetDoc).toHaveBeenCalledOnce();
        });

        it('does nothing if there is no local progress to sync', async () => {
            await store().syncLocalToCloud('user_abc');
            expect(mockSetDoc).not.toHaveBeenCalled();
        });
    });
});
