import { create } from 'zustand';
import { doc, getDoc, setDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const LOCAL_STORAGE_KEY = 'glitchbrain_completed_puzzles';

// Helper: load from localStorage (guest progress)
const loadLocalProgress = (): number[] => {
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

// Helper: save to localStorage
const saveLocalProgress = (completed: number[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(completed));
};

interface ProgressState {
    completedPuzzles: number[];

    // Load cloud progress for a signed-in user, merging with any local guest progress
    loadProgress: (uid: string) => Promise<void>;

    // Mark a puzzle as complete. Saves locally always, and to cloud if user is signed in.
    markComplete: (puzzleIndex: number, uid: string | null) => Promise<void>;

    // Sync local guest progress up to the cloud after sign-in
    syncLocalToCloud: (uid: string) => Promise<void>;

    isPuzzleComplete: (puzzleIndex: number) => boolean;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
    completedPuzzles: loadLocalProgress(),

    loadProgress: async (uid: string) => {
        try {
            const docRef = doc(db, 'users', uid);
            const snap = await getDoc(docRef);
            const cloudCompleted: number[] = snap.exists()
                ? (snap.data().completedPuzzles ?? [])
                : [];

            // Merge cloud progress with any local guest progress
            const localCompleted = loadLocalProgress();
            const merged = Array.from(new Set([...cloudCompleted, ...localCompleted])).sort((a, b) => a - b);

            // If there was local progress to merge, push it up to the cloud
            if (localCompleted.length > 0 && !snap.exists()) {
                await setDoc(docRef, { completedPuzzles: merged }, { merge: true });
            }

            saveLocalProgress(merged);
            set({ completedPuzzles: merged });
        } catch (error) {
            console.error('Failed to load progress from Firestore:', error);
        }
    },

    markComplete: async (puzzleIndex: number, uid: string | null) => {
        const { completedPuzzles } = get();
        if (completedPuzzles.includes(puzzleIndex)) return;

        const updated = [...completedPuzzles, puzzleIndex].sort((a, b) => a - b);
        saveLocalProgress(updated);
        set({ completedPuzzles: updated });

        if (uid) {
            try {
                const docRef = doc(db, 'users', uid);
                // arrayUnion safely prevents duplicates on the cloud side
                await setDoc(docRef, { completedPuzzles: arrayUnion(puzzleIndex), lastUpdated: serverTimestamp() }, { merge: true });
            } catch (error) {
                console.error('Failed to save progress to Firestore:', error);
                // Local save already succeeded, so progress is not lost
            }
        }
    },

    syncLocalToCloud: async (uid: string) => {
        const localCompleted = loadLocalProgress();
        if (localCompleted.length === 0) return;
        try {
            const docRef = doc(db, 'users', uid);
            await setDoc(docRef, { completedPuzzles: arrayUnion(...localCompleted), lastUpdated: serverTimestamp() }, { merge: true });
        } catch (error) {
            console.error('Failed to sync local progress to cloud:', error);
        }
    },

    isPuzzleComplete: (puzzleIndex: number) => {
        return get().completedPuzzles.includes(puzzleIndex);
    },
}));
