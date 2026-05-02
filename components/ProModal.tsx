import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useProStore } from '../store/useProStore';
import { useAuth } from '../context/AuthContext';
import { useAuthStore } from '../store/useAuthStore';

const ProModal: React.FC = () => {
    const closeProModal = useProStore(s => s.closeProModal);
    const buyPro = useProStore(s => s.buyPro);
    const { user } = useAuth();
    const openAuth = useAuthStore(s => s.openAuth);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeProModal();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [closeProModal]);

    return (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                onClick={closeProModal}
                className="absolute inset-0 bg-black"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative flex flex-col w-full max-w-md max-h-[95vh] overflow-hidden bg-slate-900 border border-white/10 shadow-2xl rounded-3xl"
            >
                <div className="p-8 gap-4 flex flex-col items-center text-center overflow-y-auto overflow-x-hidden custom-scrollbar flex-1">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white uppercase tracking-tight mb-2">Lifetime Pro</h2>
                        <p className="text-xs text-white/60 font-medium leading-relaxed">
                            Unlock the full creative potential of Muxels. Pay once, own it forever.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {[
                            { text: 'Unlock all Puzzles' },
                            { text: 'Access to all Presets' },
                            { text: 'Unlimited 4K-Res Exports' },
                            { text: 'Unlimited Scene Slots' }
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/5">
                                <span className="material-symbols-outlined text-indigo-300 !text-[20px]">check_circle</span>
                                <span className="text-xs font-bold text-white uppercase tracking-wider">{feature.text}</span>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-white/10">
                        <button
                            onClick={() => user ? buyPro(user.uid) : openAuth('login')}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white font-bold text-sm uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-[0.98]"
                        >
                            {user ? 'Get Lifetime Pro - $49' : 'Login to Upgrade'}
                        </button>
                        <button
                            onClick={closeProModal}
                            className="w-full mt-3 py-3 text-xs font-bold text-white/60 hover:text-white uppercase tracking-widest transition-colors"
                        >
                            Maybe Later
                        </button>
                        <p className="mt-4 text-[10px] text-white/60 leading-relaxed font-medium max-w-[80%] mx-auto">
                            Includes all current Pro features and updates. New premium add-ons may be offered separately.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ProModal;
