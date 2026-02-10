import { create } from 'zustand';

interface AuthStore {
    isAuthOpen: boolean;
    authMode: 'login' | 'signup';
    openAuth: (mode: 'login' | 'signup') => void;
    closeAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
    isAuthOpen: false,
    authMode: 'login',
    openAuth: (mode) => set({ isAuthOpen: true, authMode: mode }),
    closeAuth: () => set({ isAuthOpen: false, authMode: 'login' })
}));
