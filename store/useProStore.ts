import { create } from 'zustand';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface ProStore {
    isPro: boolean;
    isProModalOpen: boolean;
    daily4kCount: number;
    last4kDate: string;
    openProModal: () => void;
    closeProModal: () => void;
    initPaymentListener: (uid: string) => void;
    loadProStatus: (uid: string) => Promise<void>;
    buyPro: (uid: string) => Promise<void>;
    record4kExport: (uid: string) => Promise<void>;
}

export const useProStore = create<ProStore>((set) => ({
    isPro: false,
    isProModalOpen: false,
    daily4kCount: 0,
    last4kDate: '',
    openProModal: () => set({ isProModalOpen: true }),
    closeProModal: () => set({ isProModalOpen: false }),

    initPaymentListener: (uid: string) => {
        if (!uid) return;

        // Ensure Lemon.js is initialized
        if (window.createLemonSqueezy) {
            window.createLemonSqueezy();

            window.LemonSqueezy.Setup({
                eventHandler: async (event) => {
                    // Check for successful checkout event
                    if (event.event === 'Checkout.Success') {
                        console.log('Payment successful via Lemon Squeezy', event);

                        // 1. Show a loading state or success toast here (optional UX)
                        console.log('Waiting for webhook to update database...');

                        // 2. Poll the database for the updated status
                        let attempts = 0;
                        const pollInterval = setInterval(async () => {
                            await useProStore.getState().loadProStatus(uid);
                            const currentProStatus = useProStore.getState().isPro;

                            if (currentProStatus) {
                                clearInterval(pollInterval);
                                set({ isProModalOpen: false });
                                console.log('Pro status successfully verified from server!');
                            }

                            attempts++;
                            if (attempts > 10) { // Timeout after ~20 seconds
                                clearInterval(pollInterval);
                                console.error('Payment successful, but server update timed out. Please refresh.');
                            }
                        }, 2000);
                    }
                }
            });
        } else {
            console.warn('LemonSqueezy script not loaded yet.');
        }
    },

    loadProStatus: async (uid: string) => {
        try {
            const docRef = doc(db, 'users', uid);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data();
                set({ 
                    isPro: data.isPro ?? false,
                    daily4kCount: data.daily4kCount ?? 0,
                    last4kDate: data.last4kDate ?? ''
                });
            } else {
                set({ isPro: false, daily4kCount: 0, last4kDate: '' });
            }
        } catch (error) {
            console.error('Failed to load Pro status:', error);
            set({ isPro: false, daily4kCount: 0, last4kDate: '' });
        }
    },

    buyPro: async (uid: string) => {
        if (!uid) return;

        const checkoutUrl = import.meta.env.VITE_LEMON_SQUEEZY_CHECKOUT_URL;

        if (!checkoutUrl) {
            console.error('VITE_LEMON_SQUEEZY_CHECKOUT_URL is not set in environment variables.');
            return;
        }

        // Initialize if it hasn't been already
        if (window.createLemonSqueezy) {
            window.createLemonSqueezy();

            // Open the checkout overlay
            // We pass the uid as custom_data so the webhook (or client) knows who paid
            const urlWithData = `${checkoutUrl}?checkout[custom][uid]=${uid}`;
            window.LemonSqueezy.Url.Open(urlWithData);
        } else {
            // Fallback to regular link if Lemon.js fails to load
            window.open(`${checkoutUrl}?checkout[custom][uid]=${uid}`, '_blank');
        }
    },

    record4kExport: async (uid: string) => {
        if (!uid) return;

        const today = new Date().toISOString().split('T')[0];
        const state = useProStore.getState();
        
        let newCount = 1;
        if (state.last4kDate === today) {
            newCount = state.daily4kCount + 1;
        }

        // Optimistically update the UI state immediately
        set({ daily4kCount: newCount, last4kDate: today });

        try {
            const { setDoc, doc } = await import('firebase/firestore');
            const userRef = doc(db, 'users', uid);
            await setDoc(userRef, {
                daily4kCount: newCount,
                last4kDate: today
            }, { merge: true });
        } catch (error) {
            console.error('Failed to record 4K export:', error);
        }
    },
}));
