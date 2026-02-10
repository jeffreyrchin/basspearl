import { create } from 'zustand';

interface AuthStore {
    isAuthOpen: boolean;
    authMode: 'login' | 'signup';
    setAuthMode: (mode: 'login' | 'signup') => void;
    openAuth: (mode: 'login' | 'signup') => void;
    closeAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
    isAuthOpen: false,
    authMode: 'login',
    setAuthMode: (mode) => set({ authMode: mode }),
    openAuth: (mode) => set({ isAuthOpen: true, authMode: mode }),
    closeAuth: () => set({ isAuthOpen: false, authMode: 'login' })
}));
