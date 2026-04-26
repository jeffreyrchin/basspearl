import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useEffectStore } from '../store/useEffectStore';

const PuzzleHeader: React.FC = () => {
    const currentPuzzle = useEffectStore(s => s.currentPuzzle);
    const setCurrentPuzzle = useEffectStore(s => s.setCurrentPuzzle);
    const isPreviewing = useEffectStore(s => s.isPreviewingPuzzle);
    const setIsPreviewing = useEffectStore(s => s.setIsPreviewingPuzzle);

    // Toggle preview on 'W' key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'w') setIsPreviewing(true);
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'w') setIsPreviewing(false);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [setIsPreviewing]);

    return (
        <div className="fixed top-8 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="pointer-events-auto flex items-center gap-6 px-6 py-2 bg-slate-900/80 border border-white/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            >
                {/* Puzzle Meta */}
                <div className="flex flex-col">
                    <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-indigo-300 leading-none mb-1">
                        Easy
                    </span>
                    <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-white leading-none">
                        Puzzle {currentPuzzle + 1}
                    </span>
                </div>

                {/* Vertical Divider */}
                <div className="w-[1px] h-6 bg-white/10" />

                {/* Preview Toggle / Status */}
                <div className="flex items-center gap-4">
                    <button
                        onPointerDown={() => setIsPreviewing(true)}
                        onPointerUp={() => setIsPreviewing(false)}
                        onPointerLeave={() => setIsPreviewing(false)}
                        className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${isPreviewing
                            ? 'bg-white text-black'
                            : 'bg-indigo-600 text-white hover:bg-indigo-500'
                            }`}
                    >
                        <span className={`text-[9px] font-bold uppercase tracking-[0.2em] transition-colors ${isPreviewing ? 'text-black' : 'text-inherit'}`}>
                            {isPreviewing ? 'Showing Preview' : 'Hold W to Preview'}
                        </span>
                    </button>

                    <button
                        onClick={() => {/* Check logic here Later */ }}
                        className="px-4 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white font-bold uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                    >
                        Check
                    </button>
                </div>

                {/* Vertical Divider */}
                <div className="w-[1px] h-6 bg-white/10" />

                {/* Exit Action */}
                <button
                    onClick={() => setCurrentPuzzle(null)}
                    className="text-[9px] font-bold uppercase tracking-[0.2em] text-white focus-visible:outline-none focus-visible:text-red-400 hover:text-red-400 transition-colors"
                >
                    Exit Puzzle
                </button>
            </motion.div>
        </div>
    );
};

export default PuzzleHeader;
