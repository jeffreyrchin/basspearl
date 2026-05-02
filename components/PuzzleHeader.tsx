import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useEffectStore } from '../store/useEffectStore';
import { PUZZLES, PUZZLE_ORDER } from '../config/puzzles';

const PuzzleHeader = () => {
    const currentPuzzle = useEffectStore(s => s.currentPuzzle);
    const setCurrentPuzzle = useEffectStore(s => s.setCurrentPuzzle);
    const isPreviewing = useEffectStore(s => s.isPreviewingPuzzle);
    const toggleIsPreviewing = useEffectStore(s => s.toggleIsPreviewingPuzzle);
    const setIsPuzzleHelpModalOpen = useEffectStore(s => s.setIsPuzzleHelpModalOpen);

    const currentPuzzleDifficulty = currentPuzzle !== null ? PUZZLES[currentPuzzle].difficulty : '---';

    const puzzleNumber = useMemo(() => {
        if (currentPuzzle === null) return null;
        return PUZZLE_ORDER.indexOf(currentPuzzle) + 1;
    }, [currentPuzzle]);

    return (
        <div className="fixed top-8 left-0 right-0 flex justify-center pointer-events-none">
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="pointer-events-auto flex items-stretch gap-5 md:gap-8 mx-3 px-5 md:px-7 py-3 md:py-4 bg-slate-900/90 border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
            >
                {/* Puzzle Meta */}
                <div className="flex flex-col justify-center gap-3">
                    <div className="flex flex-col">
                        <span className={`text-[9px] font-bold tracking-[0.2em] uppercase
                            ${currentPuzzleDifficulty === 'Medium' ? 'text-yellow-300' :
                                currentPuzzleDifficulty === 'Hard' ? 'text-cyan-300' : 'text-indigo-300'
                            }
                            leading-none mb-1.5`}>
                            {currentPuzzleDifficulty}
                        </span>
                        <span className="text-sm md:text-base font-black tracking-widest uppercase text-white leading-none">
                            {puzzleNumber !== null ? `Puzzle ${puzzleNumber}` : '---'}
                        </span>
                    </div>

                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => setIsPuzzleHelpModalOpen(true)}
                            className="self-start text-[9px] font-bold uppercase tracking-[0.15em] text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                            <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined !text-[16px]">help</span>
                                <span>Help</span>
                            </div>
                        </button>

                        {/* Exit Action */}
                        <button
                            onClick={() => setCurrentPuzzle(null)}
                            className="self-start text-[9px] font-bold uppercase tracking-[0.15em] text-red-400 bg-red-400/10 hover:bg-red-400/20 px-3 py-1.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                        >
                            <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined !text-[16px]">exit_to_app</span>
                                <span>Exit Game</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Vertical Divider */}
                <div className="hidden sm:block w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent" />

                {/* Preview Toggle */}
                <div className="flex flex-col items-center justify-center gap-3">
                    <button
                        onClick={toggleIsPreviewing}
                        className={`group flex flex-col items-center justify-center rounded-full w-16 h-16 md:w-20 md:h-20 transition-all duration-300 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${isPreviewing ? 'bg-indigo-500 scale-105' : 'bg-slate-800 hover:bg-slate-700'}`}
                        title="Toggle Preview (W)"
                    >
                        <span className={`text-[8px] md:text-[9px] uppercase tracking-widest font-semibold transition-colors ${isPreviewing ? 'text-indigo-100' : 'text-white/60 group-hover:text-white/80'}`}>
                            Preview
                        </span>
                        <span className={`text-sm md:text-base font-bold transition-colors ${isPreviewing ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
                            {isPreviewing ? 'ON' : 'OFF'}
                        </span>
                    </button>

                    {/* Small visual switch below */}
                    <button
                        onClick={toggleIsPreviewing}
                        className={`relative w-8 h-4.5 rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${isPreviewing ? 'bg-indigo-500' : 'bg-white/10'}`}
                        title="Toggle Preview (W)"
                        tabIndex={0}
                    >
                        <div className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-300 ease-out ${isPreviewing ? 'translate-x-3.5' : 'translate-x-0'}`} />
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default PuzzleHeader;
