import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useEffectStore } from '../store/useEffectStore';

const PuzzleHeader: React.FC = () => {
    const currentPuzzle = useEffectStore(s => s.currentPuzzle);
    const setCurrentPuzzle = useEffectStore(s => s.setCurrentPuzzle);

    const [mixValue, setMixValue] = useState(1); // 0 = Target, 1 = Live

    return (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 pointer-events-none">
            <motion.div
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -40, opacity: 0 }}
                className="pointer-events-auto w-64 bg-slate-900/95 border border-white/10 rounded-md shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] flex flex-col p-4 relative overflow-hidden"
            >

                {/* Top Row: Meta & Actions */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <h2 className="text-[12px] italic font-bold tracking-[0.2em] uppercase text-white/90">
                            Puzzle {currentPuzzle + 1}
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {/* Final check logic here */ }}
                            className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/80 hover:text-white transition-colors"
                        >
                            Verify
                        </button>
                        <div className="w-[1px] h-3 bg-white/10" />
                        <button
                            onClick={() => setCurrentPuzzle(null)}
                            className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/80 hover:text-white transition-colors"
                        >
                            Exit
                        </button>
                    </div>
                </div>

                {/* Bottom Row: The Comparison Slider */}
                <div className="flex items-center gap-4 group">
                    <span className="text-[15px] font-bold text-indigo-300">A</span>
                    <div className="relative flex-1 flex items-center">
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.001"
                            value={mixValue}
                            onChange={(e) => setMixValue(parseFloat(e.target.value))}
                            className="w-full cursor-pointer accent-white h-1 bg-white/10 rounded-full appearance-none hover:bg-white/20 transition-colors"
                        />

                    </div>
                    <span className="text-[15px] font-bold text-indigo-300">B</span>
                </div>
            </motion.div>
        </div>
    );
};

export default PuzzleHeader;
