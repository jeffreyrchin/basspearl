import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useEffectStore } from '../store/useEffectStore';
import { PUZZLES, PUZZLE_ORDER } from '../config/puzzles';

const PuzzleHeader = () => {
    const currentPuzzle = useEffectStore(s => s.currentPuzzle);
    const setCurrentPuzzle = useEffectStore(s => s.setCurrentPuzzle);
    const isPreviewing = useEffectStore(s => s.isPreviewingPuzzle);
    const toggleIsPreviewing = useEffectStore(s => s.toggleIsPreviewingPuzzle);
    const checkPuzzle = useEffectStore(s => s.checkPuzzle);

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
                className="pointer-events-auto flex items-center gap-3 md:gap-6 mx-3 px-4 md:px-6 py-2 bg-slate-900/80 border border-white/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            >
                {/* Puzzle Meta */}
                <div className="flex flex-col">
                    <span className={`text-[9px] font-bold tracking-[0.2em] uppercase
                    ${currentPuzzleDifficulty === 'Medium' ? 'text-yellow-300' :
                            currentPuzzleDifficulty === 'Hard' ? 'text-cyan-300' : 'text-indigo-300'
                        }
                    leading-none mb-1`}>
                        {currentPuzzleDifficulty}
                    </span>
                    <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-white leading-none">
                        {puzzleNumber !== null ? `Puzzle ${puzzleNumber}` : '---'}
                    </span>
                </div>

                {/* Vertical Divider */}
                <div className="hidden sm:block w-[1px] h-6 bg-white/10" />

                {/* Preview Toggle */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleIsPreviewing}
                        className={`group relative flex items-center gap-2 px-3 md:px-4 py-2 rounded-full transition-all
                            hover:scale-110 duration-300 will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white
                            ${isPreviewing
                                ? "bg-white text-black shadow-md"
                                : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm"
                            }`}
                    >
                        <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wide">
                            {isPreviewing ? (
                                <>
                                    <span className="hidden sm:inline">Hide </span>Preview
                                    <span className="hidden md:inline"> (W)</span>
                                </>
                            ) : (
                                <>
                                    <span className="hidden sm:inline">Show </span>Preview
                                    <span className="hidden md:inline"> (W)</span>
                                </>
                            )}
                        </span>
                    </button>

                    <button
                        onClick={checkPuzzle}
                        className="px-3 md:px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] md:text-xs font-semibold uppercase tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white transition-all hover:scale-110 duration-300 will-change-transform shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                    >
                        Check<span className="hidden sm:inline"> Solution</span>
                    </button>
                </div>

                {/* Vertical Divider */}
                <div className="hidden sm:block w-[1px] h-6 bg-white/10" />

                {/* Exit Action */}
                <button
                    onClick={() => setCurrentPuzzle(null)}
                    className="text-[9px] font-bold uppercase tracking-[0.2em] text-white focus-visible:outline-none focus-visible:text-red-400 hover:text-red-400 transition-colors"
                >
                    Exit
                </button>
            </motion.div>
        </div>
    );
};

export default PuzzleHeader;
