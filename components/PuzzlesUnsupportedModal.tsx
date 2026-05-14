import React from 'react';
import { motion } from 'framer-motion';

interface PuzzlesUnsupportedModalProps {
    onClose: () => void;
}

const PuzzlesUnsupportedModal: React.FC<PuzzlesUnsupportedModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg bg-[#0a0a1a] rounded-2xl border border-white/10 p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden"
            >
                <div className="flex flex-col items-center text-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-cyan-300/10 flex items-center justify-center mb-2">
                        <span className="material-symbols-outlined !text-4xl text-cyan-300">grid_view</span>
                    </div>

                    <div className="flex flex-col gap-3">
                        <h2 className="text-2xl font-bold uppercase tracking-tight text-white">Puzzles Unsupported on Mobile</h2>
                        <p className="text-white/60 text-sm leading-relaxed max-w-sm">
                            Puzzles are currently unsupported for mobile environments. Complete puzzles on a desktop or laptop to unlock new presets.
                        </p>
                    </div>

                    <div className="w-full flex flex-col gap-3 mt-4">
                        <button
                            onClick={onClose}
                            className="w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-sm bg-indigo-500 hover:bg-indigo-400 text-white transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                        >
                            Got it
                        </button>
                    </div>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
            </motion.div>
        </div>
    );
};

export default PuzzlesUnsupportedModal;
