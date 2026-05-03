import React from 'react';
import { motion } from 'framer-motion';
import { useEffectStore } from '../store/useEffectStore';

const PuzzleHelpModal: React.FC = () => {
    const setIsPuzzleHelpModalOpen = useEffectStore(s => s.setIsPuzzleHelpModalOpen);

    return (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsPuzzleHelpModalOpen(false)}
                className="absolute inset-0 bg-black/80"
            />

            {/* Modal Container */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative flex flex-col w-full max-w-md max-h-[95vh] overflow-hidden bg-slate-900 border border-white/10 rounded-3xl shadow-[0_32px_128px_rgba(0,0,0,0.8)]"
            >
                {/* Top Glow Accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.8)]" />

                <div className="p-8 flex flex-col items-center text-center overflow-y-auto overflow-x-hidden custom-scrollbar flex-1 min-h-0">
                    <div className="mb-6 w-16 h-16 shrink-0 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/50">
                        <span className="material-symbols-outlined text-4xl text-indigo-400">help</span>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-tight">
                        How to Play
                    </h2>

                    <div className="text-slate-300 text-[13px] leading-relaxed mb-8 flex flex-col gap-4 text-left w-full">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined shrink-0 text-indigo-400 mt-0.5 !text-[18px]">target</span>
                            <p>Your goal is to create a visualization that matches the preview visualization as close as possible. Match <strong className="text-white">80%</strong> or higher to complete the puzzle.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined shrink-0 text-indigo-400 mt-0.5 !text-[18px]">keyboard</span>
                            <p>Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white text-xs border border-white/20 font-mono">W</kbd> to toggle between the preview and your visualization.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined shrink-0 text-indigo-400 mt-0.5 !text-[18px]">add_circle</span>
                            <p>Add patterns and effects in the sidebar.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined shrink-0 text-indigo-400 mt-0.5 !text-[18px]">grain</span>
                            <p>Drag the icons on the left of the sidebar to rearrange patterns and effects.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined shrink-0 text-indigo-400 mt-0.5 !text-[18px]">tune</span>
                            <p>Click the inspector icon to open and edit parameters of patterns and effects.</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsPuzzleHelpModalOpen(false)}
                        className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-widest text-[11px] transition-all hover:scale-[1.02] active:scale-[0.98] will-change-transform shadow-lg shadow-indigo-600/20"
                    >
                        Got it
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default PuzzleHelpModal;
