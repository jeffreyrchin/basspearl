import { create } from 'zustand';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface ProStore {
    isPro: boolean;
    isProModalOpen: boolean;
    openProModal: () => void;
    closeProModal: () => void;
    initPaymentListener: (uid: string) => void;
    loadProStatus: (uid: string) => Promise<void>;
    buyPro: (uid: string) => Promise<void>;
}

export const useProStore = create<ProStore>((set) => ({
    isPro: false,
    isProModalOpen: false,
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
                set({ isPro: snap.data().isPro ?? false });
            } else {
                set({ isPro: false });
            }
        } catch (error) {
            console.error('Failed to load Pro status:', error);
            set({ isPro: false });
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
}));
