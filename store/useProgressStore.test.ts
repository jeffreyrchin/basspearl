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
const mockServerTimestamp = vi.fn(() => 'SERVER_TIMESTAMP');

vi.mock('firebase/firestore', () => ({
    doc: mockDoc,
    getDoc: mockGetDoc,
    setDoc: mockSetDoc,
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
    useProgressStore.setState({ completedPuzzles: {} });
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
        it('adds the puzzle index and score to the in-memory state', async () => {
            await store().markComplete(3, 85, null);
            expect(store().completedPuzzles[3]).toBeDefined();
            expect(store().completedPuzzles[3].score).toBe(85);
        });

        it('writes the result to localStorage', async () => {
            await store().markComplete(1, 95, null);
            const stored = JSON.parse(localStorageMock.getItem('glitchbrain_completed_puzzles')!);
            expect(stored['1']).toBeDefined();
            expect(stored['1'].score).toBe(95);
        });

        it('does NOT call Firestore when uid is null', async () => {
            await store().markComplete(0, 100, null);
            expect(mockSetDoc).not.toHaveBeenCalled();
        });

        it('updates the score if the new score is higher', async () => {
            await store().markComplete(5, 70, null);
            await store().markComplete(5, 90, null);
            expect(store().completedPuzzles[5].score).toBe(90);
        });

        it('does NOT update the score if the new score is lower', async () => {
            await store().markComplete(5, 90, null);
            await store().markComplete(5, 70, null);
            expect(store().completedPuzzles[5].score).toBe(90);
        });

        it('tracks distinct scores for different puzzles completed sequentially', async () => {
            await store().markComplete(1, 100, null);
            await store().markComplete(2, 50, null);
            expect(store().completedPuzzles[1].score).toBe(100);
            expect(store().completedPuzzles[2].score).toBe(50);
        });
    });

    // ── markComplete (Signed-in / Cloud) ───────────────────────────────────────
    describe('markComplete — signed-in mode (with uid)', () => {
        it('calls Firestore setDoc with the correct uid path', async () => {
            await store().markComplete(4, 100, 'user_abc');
            expect(mockDoc).toHaveBeenCalledWith({}, 'users', 'user_abc');
            expect(mockSetDoc).toHaveBeenCalledOnce();
        });

        it('updates a specific nested field in Firestore with the new score', async () => {
            await store().markComplete(2, 98, 'user_abc');
            const [, writeData] = mockSetDoc.mock.calls[0];
            expect(writeData.completedPuzzles['2'].score).toBe(98);
        });

        it('includes a lastUpdated server timestamp in the write', async () => {
            await store().markComplete(6, 80, 'user_abc');
            const [, writeData] = mockSetDoc.mock.calls[0];
            expect(writeData.lastUpdated).toBe('SERVER_TIMESTAMP');
        });

        it('still saves locally even if Firestore throws', async () => {
            mockSetDoc.mockRejectedValueOnce(new Error('Network error'));
            await store().markComplete(9, 75, 'user_xyz');
            // Local state must still be updated
            expect(store().completedPuzzles[9].score).toBe(75);
            const stored = JSON.parse(localStorageMock.getItem('glitchbrain_completed_puzzles')!);
            expect(stored['9'].score).toBe(75);
        });
    });

    // ── loadProgress (Cloud → Local Merge) ────────────────────────────────────
    describe('loadProgress — merging cloud and local data', () => {
        it('sets completedPuzzles from a cloud snapshot', async () => {
            mockGetDoc.mockResolvedValueOnce({
                exists: () => true,
                data: () => ({
                    completedPuzzles: {
                        0: { score: 100, completedAt: '2023-01-01T00:00:00.000Z' },
                        1: { score: 90, completedAt: '2023-01-02T00:00:00.000Z' }
                    }
                }),
            });
            await store().loadProgress('user_abc');
            expect(store().completedPuzzles[0].score).toBe(100);
            expect(store().completedPuzzles[1].score).toBe(90);
        });

        it('merges local guest progress with cloud data, taking the maximum score', async () => {
            // User played levels 0 and 1 as a guest (0 got 80, 1 got 95)
            localStorageMock.setItem('glitchbrain_completed_puzzles', JSON.stringify({
                0: { score: 80, completedAt: '2023-01-03T00:00:00.000Z' },
                1: { score: 95, completedAt: '2023-01-04T00:00:00.000Z' }
            }));
            // Cloud already has levels 1 and 2 (1 got 80, 2 got 100)
            mockGetDoc.mockResolvedValueOnce({
                exists: () => true,
                data: () => ({
                    completedPuzzles: {
                        1: { score: 80, completedAt: '2023-01-01T00:00:00.000Z' },
                        2: { score: 100, completedAt: '2023-01-02T00:00:00.000Z' }
                    }
                }),
            });
            await store().loadProgress('user_abc');
            // 0 should be from local (80)
            // 1 should be max(95 from local, 80 from cloud) -> 95
            // 2 should be from cloud (100)
            expect(store().completedPuzzles[0].score).toBe(80);
            expect(store().completedPuzzles[1].score).toBe(95);
            expect(store().completedPuzzles[2].score).toBe(100);
        });

        it('handles a new user with no cloud document gracefully', async () => {
            mockGetDoc.mockResolvedValueOnce({ exists: () => false, data: () => undefined });
            await store().loadProgress('brand_new_user');
            expect(store().completedPuzzles).toEqual({});
        });

        it('does not throw if Firestore is unavailable', async () => {
            mockGetDoc.mockRejectedValueOnce(new Error('Offline'));
            await expect(store().loadProgress('user_abc')).resolves.not.toThrow();
        });
    });

    // ── isPuzzleComplete ────────────────────────────────────────────────────────
    describe('isPuzzleComplete', () => {
        it('returns true for a completed puzzle', async () => {
            await store().markComplete(0, 100, null);
            expect(store().isPuzzleComplete(0)).toBe(true);
        });

        it('returns false for a puzzle not yet completed', () => {
            expect(store().isPuzzleComplete(99)).toBe(false);
        });
    });

    // ── getPuzzleProgress ───────────────────────────────────────────────────────
    describe('getPuzzleProgress', () => {
        it('returns the full progress object for a completed puzzle', async () => {
            await store().markComplete(5, 88, null);
            const progress = store().getPuzzleProgress(5);
            expect(progress).not.toBeNull();
            expect(progress?.score).toBe(88);
            expect(typeof progress?.completedAt).toBe('string');
        });

        it('returns null for an uncompleted puzzle', () => {
            expect(store().getPuzzleProgress(10)).toBeNull();
        });

        it('reflects the highest score when multiple completions occur', async () => {
            await store().markComplete(1, 60, null);
            await store().markComplete(1, 95, null);
            await store().markComplete(1, 70, null);
            const progress = store().getPuzzleProgress(1);
            expect(progress?.score).toBe(95);
        });
    });

    // ── syncLocalToCloud ────────────────────────────────────────────────────────
    describe('syncLocalToCloud', () => {
        it('syncs existing local progress to Firestore for a new user', async () => {
            localStorageMock.setItem('glitchbrain_completed_puzzles', JSON.stringify({
                0: { score: 100, completedAt: '2023-01-01T00:00:00.000Z' },
                2: { score: 85, completedAt: '2023-01-02T00:00:00.000Z' }
            }));
            await store().syncLocalToCloud('user_abc');
            const [, writeData] = mockSetDoc.mock.calls[0];
            expect(writeData.completedPuzzles['0'].score).toBe(100);
            expect(writeData.completedPuzzles['2'].score).toBe(85);
            expect(writeData.lastUpdated).toBe('SERVER_TIMESTAMP');
            expect(mockSetDoc).toHaveBeenCalledOnce();
        });

        it('does nothing if there is no local progress to sync', async () => {
            await store().syncLocalToCloud('user_abc');
            expect(mockSetDoc).not.toHaveBeenCalled();
        });
    });
});
