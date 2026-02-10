import { create } from 'zustand';

interface LegalStore {
    isLegalOpen: boolean;
    isForced: boolean;
    hasAcceptedTerms: boolean;
    postConsentCallback: (() => void) | null;
    openLegal: (force?: boolean, callback?: () => void) => void;
    closeLegal: () => void;
    confirmLegal: () => void;
    setHasAcceptedTerms: (accepted: boolean) => void;
}

export const useLegalStore = create<LegalStore>((set, get) => ({
    isLegalOpen: false,
    isForced: false,
    hasAcceptedTerms: !!localStorage.getItem('glitch_consent_02042026'),
    postConsentCallback: null,

    openLegal: (force = false, callback) => {
        set({
            isLegalOpen: true,
            isForced: force,
            postConsentCallback: callback || null,
        });
    },

    closeLegal: () => {
        set({ isLegalOpen: false, isForced: false, postConsentCallback: null });
    },

    confirmLegal: () => {
        localStorage.setItem('glitch_consent_02042026', 'true');
        const { postConsentCallback } = get();

        set({
            hasAcceptedTerms: true,
            isLegalOpen: false,
            isForced: false,
            postConsentCallback: null,
        });

        if (postConsentCallback) {
            postConsentCallback();
        }
    },

    setHasAcceptedTerms: (accepted: boolean) => {
        if (accepted) {
            localStorage.setItem('glitch_consent_02042026', 'true');
        } else {
            localStorage.removeItem('glitch_consent_02042026');
        }
        set({ hasAcceptedTerms: accepted });
    }
}));
