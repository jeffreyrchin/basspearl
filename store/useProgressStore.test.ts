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

    // ── saveProgress (Guest / Offline) ──────────────────────────────────────────
    describe('saveProgress — guest mode (no uid)', () => {
        it('adds the puzzle id and score to the in-memory state', async () => {
            await store().saveProgress('SEARCHLIGHTS', 85, null);
            expect(store().completedPuzzles['SEARCHLIGHTS']).toBeDefined();
            expect(store().completedPuzzles['SEARCHLIGHTS'].score).toBe(85);
        });

        it('writes the result to localStorage', async () => {
            await store().saveProgress('AURORA', 95, null);
            const stored = JSON.parse(localStorageMock.getItem('glitchbrain_completed_puzzles')!);
            expect(stored['AURORA']).toBeDefined();
            expect(stored['AURORA'].score).toBe(95);
        });

        it('does NOT call Firestore when uid is null', async () => {
            await store().saveProgress('SPIRAL_GLOW', 100, null);
            expect(mockSetDoc).not.toHaveBeenCalled();
        });

        it('updates the score if the new score is higher', async () => {
            await store().saveProgress('RUSH_HOUR', 70, null);
            await store().saveProgress('RUSH_HOUR', 90, null);
            expect(store().completedPuzzles['RUSH_HOUR'].score).toBe(90);
        });

        it('does NOT update the score if the new score is lower', async () => {
            await store().saveProgress('RUSH_HOUR', 90, null);
            await store().saveProgress('RUSH_HOUR', 70, null);
            expect(store().completedPuzzles['RUSH_HOUR'].score).toBe(90);
        });

        it('tracks distinct scores for different puzzles completed sequentially', async () => {
            await store().saveProgress('AURORA', 100, null);
            await store().saveProgress('TEETH', 50, null);
            expect(store().completedPuzzles['AURORA'].score).toBe(100);
            expect(store().completedPuzzles['TEETH'].score).toBe(50);
        });
    });

    // ── saveProgress (Signed-in / Cloud) ───────────────────────────────────────
    describe('saveProgress — signed-in mode (with uid)', () => {
        it('calls Firestore setDoc with the correct uid path', async () => {
            await store().saveProgress('GRAIN_TUNNEL', 100, 'user_abc');
            expect(mockDoc).toHaveBeenCalledWith({}, 'users', 'user_abc');
            expect(mockSetDoc).toHaveBeenCalledOnce();
        });

        it('updates a specific nested field in Firestore with the new score', async () => {
            await store().saveProgress('TEETH', 98, 'user_abc');
            const [, writeData] = mockSetDoc.mock.calls[0];
            expect(writeData.completedPuzzles['TEETH'].score).toBe(98);
        });

        it('includes a lastUpdated server timestamp in the write', async () => {
            await store().saveProgress('STREAKS', 80, 'user_abc');
            const [, writeData] = mockSetDoc.mock.calls[0];
            expect(writeData.lastUpdated).toBe('SERVER_TIMESTAMP');
        });

        it('still saves locally even if Firestore throws', async () => {
            mockSetDoc.mockRejectedValueOnce(new Error('Network error'));
            await store().saveProgress('LANDSCAPE', 75, 'user_xyz');
            // Local state must still be updated
            expect(store().completedPuzzles['LANDSCAPE'].score).toBe(75);
            const stored = JSON.parse(localStorageMock.getItem('glitchbrain_completed_puzzles')!);
            expect(stored['LANDSCAPE'].score).toBe(75);
        });
    });

    // ── loadProgress (Cloud → Local Merge) ────────────────────────────────────
    describe('loadProgress — merging cloud and local data', () => {
        it('sets completedPuzzles from a cloud snapshot', async () => {
            mockGetDoc.mockResolvedValueOnce({
                exists: () => true,
                data: () => ({
                    completedPuzzles: {
                        'SPIRAL_GLOW': { score: 100, completedAt: '2023-01-01T00:00:00.000Z' },
                        'AURORA': { score: 90, completedAt: '2023-01-02T00:00:00.000Z' }
                    }
                }),
            });
            await store().loadProgress('user_abc');
            expect(store().completedPuzzles['SPIRAL_GLOW'].score).toBe(100);
            expect(store().completedPuzzles['AURORA'].score).toBe(90);
        });

        it('merges local guest progress with cloud data, taking the maximum score', async () => {
            // User played levels as a guest
            localStorageMock.setItem('glitchbrain_completed_puzzles', JSON.stringify({
                'SPIRAL_GLOW': { score: 80, completedAt: '2023-01-03T00:00:00.000Z' },
                'AURORA': { score: 95, completedAt: '2023-01-04T00:00:00.000Z' }
            }));
            // Cloud already has levels
            mockGetDoc.mockResolvedValueOnce({
                exists: () => true,
                data: () => ({
                    completedPuzzles: {
                        'AURORA': { score: 80, completedAt: '2023-01-01T00:00:00.000Z' },
                        'TEETH': { score: 100, completedAt: '2023-01-02T00:00:00.000Z' }
                    }
                }),
            });
            await store().loadProgress('user_abc');
            // SPIRAL_GLOW should be from local (80)
            // AURORA should be max(95 from local, 80 from cloud) -> 95
            // TEETH should be from cloud (100)
            expect(store().completedPuzzles['SPIRAL_GLOW'].score).toBe(80);
            expect(store().completedPuzzles['AURORA'].score).toBe(95);
            expect(store().completedPuzzles['TEETH'].score).toBe(100);
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
        it('returns true for a puzzle with score >= 80', async () => {
            await store().saveProgress('SPIRAL_GLOW', 80, null);
            expect(store().isPuzzleComplete('SPIRAL_GLOW')).toBe(true);
        });

        it('returns false for a puzzle with score < 80', async () => {
            await store().saveProgress('AURORA', 79, null);
            expect(store().isPuzzleComplete('AURORA')).toBe(false);
        });

        it('returns false for a puzzle not yet attempted', () => {
            expect(store().isPuzzleComplete('WAXY_STARS')).toBe(false);
        });
    });

    // ── getPuzzleProgress ───────────────────────────────────────────────────────
    describe('getPuzzleProgress', () => {
        it('returns the full progress object for an attempted puzzle', async () => {
            await store().saveProgress('RUSH_HOUR', 88, null);
            const progress = store().getPuzzleProgress('RUSH_HOUR');
            expect(progress).not.toBeNull();
            expect(progress?.score).toBe(88);
            expect(typeof progress?.completedAt).toBe('string');
        });

        it('returns null for an unattempted puzzle', () => {
            expect(store().getPuzzleProgress('STORM')).toBeNull();
        });

        it('reflects the highest score when multiple attempts occur', async () => {
            await store().saveProgress('AURORA', 60, null);
            await store().saveProgress('AURORA', 95, null);
            await store().saveProgress('AURORA', 70, null);
            const progress = store().getPuzzleProgress('AURORA');
            expect(progress?.score).toBe(95);
        });
    });

    // ── syncLocalToCloud ────────────────────────────────────────────────────────
    describe('syncLocalToCloud', () => {
        it('syncs existing local progress to Firestore for a new user', async () => {
            localStorageMock.setItem('glitchbrain_completed_puzzles', JSON.stringify({
                'SPIRAL_GLOW': { score: 100, completedAt: '2023-01-01T00:00:00.000Z' },
                'TEETH': { score: 85, completedAt: '2023-01-02T00:00:00.000Z' }
            }));
            await store().syncLocalToCloud('user_abc');
            const [, writeData] = mockSetDoc.mock.calls[0];
            expect(writeData.completedPuzzles['SPIRAL_GLOW'].score).toBe(100);
            expect(writeData.completedPuzzles['TEETH'].score).toBe(85);
            expect(writeData.lastUpdated).toBe('SERVER_TIMESTAMP');
            expect(mockSetDoc).toHaveBeenCalledOnce();
        });

        it('does nothing if there is no local progress to sync', async () => {
            await store().syncLocalToCloud('user_abc');
            expect(mockSetDoc).not.toHaveBeenCalled();
        });
    });
});
