import { create } from 'zustand';

interface LegalStore {
    isLegalOpen: boolean;
    openLegal: () => void;
    closeLegal: () => void;
}

export const useLegalStore = create<LegalStore>((set) => ({
    isLegalOpen: false,
    openLegal: () => set({ isLegalOpen: true }),
    closeLegal: () => set({ isLegalOpen: false }),
}));
