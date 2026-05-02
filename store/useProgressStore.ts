import { create } from 'zustand';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { MIN_PUZZLE_COMPLETION_SCORE } from '../constants';
import { PuzzleType } from '../types';

const LOCAL_STORAGE_KEY = 'glitchbrain_completed_puzzles';

export interface PuzzleProgress {
    score: number;
    completedAt: string;
}

// Helper: load from localStorage (guest progress)
const loadLocalProgress = (): Record<string, PuzzleProgress> => {
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

// Helper: save to localStorage
const saveLocalProgress = (completed: Record<string, PuzzleProgress>) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(completed));
};

interface ProgressState {
    completedPuzzles: Record<string, PuzzleProgress>;

    // Load cloud progress for a signed-in user, merging with any local guest progress
    loadProgress: (uid: string) => Promise<void>;

    // Save progress for a puzzle. Saves locally always, and to cloud if user is signed in.
    saveProgress: (puzzleId: PuzzleType, score: number, uid: string | null) => Promise<void>;

    // Sync local guest progress up to the cloud after sign-in
    syncLocalToCloud: (uid: string) => Promise<void>;

    isPuzzleComplete: (puzzleId: PuzzleType) => boolean;

    getPuzzleProgress: (puzzleId: PuzzleType) => PuzzleProgress | null;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
    completedPuzzles: loadLocalProgress(),

    loadProgress: async (uid: string) => {
        try {
            const docRef = doc(db, 'users', uid);
            const snap = await getDoc(docRef);
            const data = snap.exists() ? snap.data() : {};
            const cloudCompleted: Record<string, PuzzleProgress> = data.completedPuzzles ?? {};

            // Merge cloud progress with any local guest progress
            const localCompleted = loadLocalProgress();
            const merged: Record<string, PuzzleProgress> = { ...cloudCompleted };

            let hasNewLocalData = false;
            for (const [key, localProgress] of Object.entries(localCompleted)) {
                const puzzleId = key as PuzzleType;
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

    saveProgress: async (puzzleId: PuzzleType, score: number, uid: string | null) => {
        const { completedPuzzles } = get();
        const existing = completedPuzzles[puzzleId];

        if (existing && existing.score >= score) return;

        const newProgress: PuzzleProgress = { score, completedAt: new Date().toISOString() };
        const updated = { ...completedPuzzles, [puzzleId]: newProgress };
        
        saveLocalProgress(updated);
        set({ completedPuzzles: updated });

        if (uid) {
            try {
                const docRef = doc(db, 'users', uid);
                await setDoc(docRef, {
                    completedPuzzles: {
                        [puzzleId]: newProgress
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

    isPuzzleComplete: (puzzleId: PuzzleType) => {
        const progress = get().completedPuzzles[puzzleId];
        return !!progress && progress.score >= MIN_PUZZLE_COMPLETION_SCORE;
    },

    getPuzzleProgress: (puzzleId: PuzzleType) => {
        return get().completedPuzzles[puzzleId] || null;
    },
}));
