import { create } from 'zustand';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { MIN_PUZZLE_COMPLETION_SCORE } from '../constants';

const LOCAL_STORAGE_KEY = 'glitchbrain_completed_puzzles';

export interface PuzzleProgress {
    score: number;
    completedAt: string;
}

// Helper: load from localStorage (guest progress)
const loadLocalProgress = (): Record<number, PuzzleProgress> => {
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

// Helper: save to localStorage
const saveLocalProgress = (completed: Record<number, PuzzleProgress>) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(completed));
};

interface ProgressState {
    completedPuzzles: Record<number, PuzzleProgress>;

    // Load cloud progress for a signed-in user, merging with any local guest progress
    loadProgress: (uid: string) => Promise<void>;

    // Save progress for a puzzle. Saves locally always, and to cloud if user is signed in.
    saveProgress: (puzzleIndex: number, score: number, uid: string | null) => Promise<void>;

    // Sync local guest progress up to the cloud after sign-in
    syncLocalToCloud: (uid: string) => Promise<void>;

    isPuzzleComplete: (puzzleIndex: number) => boolean;

    getPuzzleProgress: (puzzleIndex: number) => PuzzleProgress | null;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
    completedPuzzles: loadLocalProgress(),

    loadProgress: async (uid: string) => {
        try {
            const docRef = doc(db, 'users', uid);
            const snap = await getDoc(docRef);
            const cloudCompleted: Record<number, PuzzleProgress> = snap.exists()
                ? (snap.data().completedPuzzles ?? {})
                : {};

            // Merge cloud progress with any local guest progress
            const localCompleted = loadLocalProgress();
            const merged: Record<number, PuzzleProgress> = { ...cloudCompleted };

            let hasNewLocalData = false;
            for (const [key, localProgress] of Object.entries(localCompleted)) {
                const puzzleId = Number(key);
                const cloudProgress = merged[puzzleId];
                if (!cloudProgress || localProgress.score > cloudProgress.score) {
                    merged[puzzleId] = localProgress;
                    hasNewLocalData = true;
                }
            }

            // If there was local progress to merge, push it up to the cloud
            if (hasNewLocalData) {
                await setDoc(docRef, { completedPuzzles: merged }, { merge: true });
            }

            saveLocalProgress(merged);
            set({ completedPuzzles: merged });
        } catch (error) {
            console.error('Failed to load progress from Firestore:', error);
        }
    },

    saveProgress: async (puzzleIndex: number, score: number, uid: string | null) => {
        const { completedPuzzles } = get();
        const existing = completedPuzzles[puzzleIndex];

        if (existing && existing.score >= score) return;

        const newProgress: PuzzleProgress = { score, completedAt: new Date().toISOString() };
        const updated = { ...completedPuzzles, [puzzleIndex]: newProgress };
        
        saveLocalProgress(updated);
        set({ completedPuzzles: updated });

        if (uid) {
            try {
                const docRef = doc(db, 'users', uid);
                await setDoc(docRef, {
                    completedPuzzles: {
                        [puzzleIndex]: newProgress
                    },
                    lastUpdated: serverTimestamp()
                }, { merge: true });
            } catch (error) {
                console.error('Failed to save progress to Firestore:', error);
                // Local save already succeeded, so progress is not lost
            }
        }
    },

    syncLocalToCloud: async (uid: string) => {
        const localCompleted = loadLocalProgress();
        if (Object.keys(localCompleted).length === 0) return;
        try {
            const docRef = doc(db, 'users', uid);
            await setDoc(docRef, { completedPuzzles: localCompleted, lastUpdated: serverTimestamp() }, { merge: true });
        } catch (error) {
            console.error('Failed to sync local progress to cloud:', error);
        }
    },

    isPuzzleComplete: (puzzleIndex: number) => {
        const progress = get().completedPuzzles[puzzleIndex];
        return !!progress && progress.score >= MIN_PUZZLE_COMPLETION_SCORE;
    },

    getPuzzleProgress: (puzzleIndex: number) => {
        return get().completedPuzzles[puzzleIndex] || null;
    },
}));
