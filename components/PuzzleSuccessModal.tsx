import React from 'react';
import { motion } from 'framer-motion';
import { useEffectStore } from '../store/useEffectStore';
import { PUZZLES } from '../config/puzzles';

import { PuzzleMatchResult } from '../services/puzzleService';

interface SuccessModalProps {
    result: PuzzleMatchResult;
}

const PuzzleSuccessModal: React.FC<SuccessModalProps> = ({ result }) => {
    const setResult = useEffectStore(s => s.setPuzzleMatchResult);
    const currentPuzzle = useEffectStore(s => s.currentPuzzle);
    const setCurrentPuzzle = useEffectStore(s => s.setCurrentPuzzle);

    const isMatch = result.isMatch;
    const hasNext = currentPuzzle !== null && currentPuzzle < PUZZLES.length - 1;

    const handleNext = () => {
        if (hasNext) {
            setCurrentPuzzle(currentPuzzle + 1);
            setResult(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setResult(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Container */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-md overflow-hidden bg-slate-900 border border-white/10 rounded-3xl shadow-[0_32px_128px_rgba(0,0,0,0.8)]"
            >
                {/* Top Glow Accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${isMatch ? 'bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.8)]' : 'bg-red-500'}`} />

                <div className="p-8 flex flex-col items-center text-center">
                    {/* Score Circle */}
                    <div className="relative mb-6">
                        <svg className="w-32 h-32 transform -rotate-90">
                            <circle
                                cx="64"
                                cy="64"
                                r="60"
                                fill="transparent"
                                stroke="currentColor"
                                strokeWidth="8"
                                className="text-white/5"
                            />
                            <motion.circle
                                cx="64"
                                cy="64"
                                r="60"
                                fill="transparent"
                                stroke="currentColor"
                                strokeWidth="8"
                                strokeDasharray={2 * Math.PI * 60}
                                initial={{ strokeDashoffset: 2 * Math.PI * 60 }}
                                animate={{ strokeDashoffset: (2 * Math.PI * 60) * (1 - result.score / 100) }}
                                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                                className={isMatch ? "text-indigo-500" : "text-amber-500"}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                className="text-4xl font-black text-white"
                            >
                                {result.score}%
                            </motion.span>
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none">Match</span>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-tight">
                        {isMatch ? 'Puzzle Solved!' : 'Not Quite There'}
                    </h2>

                    <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-[280px]">
                        {result.feedback}
                    </p>

                    <div className="flex flex-col gap-3 w-full">
                        {isMatch ? (
                            <>
                                {hasNext && (
                                    <button
                                        onClick={handleNext}
                                        className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-widest text-[11px] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-600/20"
                                    >
                                        Next Puzzle
                                    </button>
                                )}
                                <button
                                    onClick={() => setResult(null)}
                                    className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-bold uppercase tracking-widest text-[11px] transition-all"
                                >
                                    Keep Tinkering
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setResult(null)}
                                className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-widest text-[11px] transition-all"
                            >
                                Try Again
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default PuzzleSuccessModal;
