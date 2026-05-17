import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useProStore } from '../store/useProStore';
import { useAuth } from '../context/AuthContext';
import { useAuthStore } from '../store/useAuthStore';
import ModalBackground from './ModalBackground';

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
        <div className="fixed inset-0 z-pro-modal flex items-center justify-center p-4">
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
                className="relative flex flex-col w-full max-w-md max-h-[95vh] overflow-hidden bg-slate-900 border border-white/10 shadow-2xl rounded-xl"
            >
                {/* SQUARE_RIPPLES macro background */}
                <ModalBackground macroType="SQUARE_RIPPLES" opacity={0.4} />

                <div className="relative p-8 gap-4 flex flex-col items-center text-center overflow-y-auto overflow-x-hidden custom-scrollbar flex-1 z-10">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white uppercase tracking-tight mb-2">Lifetime Pro</h2>
                        <p className="text-xs text-white/60 font-medium leading-relaxed">
                            Pay once to unlock the full creative potential of basspearl.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {[
                            { text: 'Unlock all Puzzles' },
                            { text: 'Unlock all Presets' },
                            { text: 'Unlimited 4K-Res Exports' },
                            { text: 'Unlimited Scene Slots' }
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-3 px-5 py-3 rounded-lg bg-black/50 border border-indigo-300/30">
                                <span className="material-symbols-outlined text-indigo-300 !text-[20px]">check_circle</span>
                                <span className="text-xs font-bold text-white uppercase tracking-wider">{feature.text}</span>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-white/10">
                        <button
                            onClick={() => user ? buyPro(user.uid) : openAuth('login')}
                            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-secondary to-purple-600 text-white font-bold text-sm uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-[0.98]"
                        >
                            <span className="material-symbols-outlined">workspace_premium</span>
                            {user ? 'Get Lifetime Pro - $39' : 'Sign in to Upgrade'}
                        </button>
                        <button
                            onClick={closeProModal}
                            className="w-full mt-3 py-3 text-xs font-bold text-white/60 hover:text-white uppercase tracking-widest transition-colors"
                        >
                            Maybe Later
                        </button>
                        <p className="mt-4 text-[10px] text-white/90 leading-relaxed font-medium max-w-[80%] mx-auto">
                            Includes all current Pro features and updates. New premium add-ons may be offered separately.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ProModal;
