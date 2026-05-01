import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useEffectStore } from '../store/useEffectStore';
import EffectPreview from './EffectPreview';
import HoverCanvas from './HoverCanvas';
import { createMacroInstance } from '../constants';
import { PUZZLES, PUZZLE_ORDER } from '../config/puzzles';
import { EffectConfig, PuzzleMetadata, PuzzleType } from '../types';
import { useProgressStore } from '../store/useProgressStore';
import LoadingSpinner from './LoadingSpinner';

interface PuzzleCardProps {
    puzzle: PuzzleMetadata;
    puzzleId: PuzzleType;
    index: number;
    onClick: () => void;
    onHoverStart: (el: HTMLElement, blueprint: EffectConfig[]) => void;
    onHoverEnd: () => void;
}

const PuzzleCard: React.FC<PuzzleCardProps> = ({ puzzle, puzzleId, index, onClick, onHoverStart, onHoverEnd }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const progress = useProgressStore(s => s.getPuzzleProgress(puzzleId));
    const isPuzzleComplete = useProgressStore(s => s.isPuzzleComplete);

    // Unlocked if it's the first puzzle or the previous one is complete
    const isLocked = useMemo(() => {
        if (index === 0) return false;
        const prevPuzzleId = PUZZLE_ORDER[index - 1];
        return !isPuzzleComplete(prevPuzzleId);
    }, [index, isPuzzleComplete]);

    const blueprint = useMemo(() => {
        return puzzle.macro ? createMacroInstance(puzzle.macro, true) : [];
    }, [puzzle.macro]);

    const handleMouseEnter = useCallback(() => {
        if (isLocked) return;
        if (containerRef.current && blueprint.length > 0) {
            onHoverStart(containerRef.current, blueprint);
        }
    }, [onHoverStart, blueprint, isLocked]);

    return (
        <button
            className="group relative w-full aspect-square bg-white/5 border border-white/5 overflow-hidden transition-all duration-300 hover:border-white/20 outline-none focus-visible:ring-1 focus-visible:ring-white/60"
            onClick={onClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={onHoverEnd}
            onFocus={handleMouseEnter}
            onBlur={onHoverEnd}
        >
            <div ref={containerRef} className="absolute inset-0 pointer-events-none">
                {/* Static poster image - Zero WebGL */}
                {puzzle.macro && !isLocked ? <EffectPreview macroType={puzzle.macro} /> :
                    /* Lock icon and gradient overlay for locked puzzles */
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-pink-500/20">
                        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                            <span className="material-symbols-outlined !text-[32px] text-white/30">
                                lock
                            </span>
                        </div>
                    </div>
                }
            </div>

            {/* Gradient overlay for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none z-10" />

            {/* Label */}
            <div className="absolute inset-x-0 bottom-0 p-3 z-20 text-left pointer-events-none">
                <div className={`text-[8px] font-bold uppercase tracking-[0.2em] 
                ${puzzle.difficulty === 'Medium' ? 'text-yellow-300' :
                        puzzle.difficulty === 'Hard' ? 'text-cyan-300' : 'text-indigo-300'
                    } mb-0.5`}>
                    {puzzle.difficulty}
                </div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-white">
                    Puzzle {index + 1}
                </div>
            </div>

            {/* Score Badge */}
            <div className={`absolute bottom-3 right-3 z-20 text-[10px] font-mono font-bold ${progress?.score >= 90 ? 'text-cyan-300' : progress?.score >= 80 ? 'text-green-300' : 'text-white/90'} bg-black/20 px-1.5 py-0.5 rounded border border-white/10`}>
                {progress ? `${progress.score}%` : '0%'}
            </div>
        </button>
    );
};

const PuzzlesModal: React.FC = () => {
    const isPuzzlesModalOpen = useEffectStore(s => s.isPuzzlesModalOpen);
    const setIsPuzzlesModalOpen = useEffectStore(s => s.setIsPuzzlesModalOpen);
    const setCurrentPuzzle = useEffectStore(s => s.setCurrentPuzzle);
    const isPuzzleComplete = useProgressStore(s => s.isPuzzleComplete);
    const setIsSidebarOpen = useEffectStore(s => s.setIsSidebarOpen);

    const [hoverTarget, setHoverTarget] = useState<{ el: HTMLElement; blueprint: EffectConfig[] } | null>(null);
    const [entranceComplete, setEntranceComplete] = useState(false);

    const handleHoverStart = useCallback((el: HTMLElement, blueprint: EffectConfig[]) => {
        setHoverTarget({ el, blueprint });
    }, []);

    const handleHoverEnd = useCallback(() => {
        setHoverTarget(null);
    }, []);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isPuzzlesModalOpen) {
                setIsPuzzlesModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isPuzzlesModalOpen, setIsPuzzlesModalOpen]);

    const handlePuzzleClick = (puzzleId: PuzzleType, index: number) => {
        if (index > 0) {
            const prevPuzzleId = PUZZLE_ORDER[index - 1];
            if (!isPuzzleComplete(prevPuzzleId)) return;
        }

        setCurrentPuzzle(puzzleId);
        setIsPuzzlesModalOpen(false);
        setIsSidebarOpen(true);
    };

    return (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
            {/* THE ONE SHARED HOVER CANVAS */}
            <HoverCanvas
                targetEl={hoverTarget?.el ?? null}
                blueprint={hoverTarget?.blueprint ?? []}
            />

            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80"
                onClick={() => setIsPuzzlesModalOpen(false)}
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onAnimationComplete={() => setEntranceComplete(true)}
                data-section="modal"
                className="relative w-full bg-slate-900/90 max-w-3xl rounded-lg border border-white/10 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header Area */}
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
                    <h2 className="text-[12px] font-bold tracking-widest uppercase text-white">Puzzles</h2>
                    <button
                        onClick={() => setIsPuzzlesModalOpen(false)}
                        className="text-white/60 flex items-center hover:text-white transition-colors"
                        title="Close"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Hero with short backstory */}
                <div className="relative w-full h-[180px] overflow-hidden shrink-0 border-b border-white/5">
                    {/* Background Image */}
                    <img
                        src="/hero.png"
                        alt="Hero Background"
                        className="absolute inset-0 w-full h-full object-cover opacity-40"
                    />

                    {/* Overlays for depth and legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/60 to-transparent" />
                    {/* <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a] via-transparent to-transparent" /> */}

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-8 pb-7">
                        <h3 className="text-2xl font-black tracking-tight text-white uppercase leading-none mb-3 italic">
                            The Grandmaster of Imageria
                        </h3>
                        <p className="text-[12px] text-white/60 max-w-[420px] leading-relaxed font-medium">
                            Imageria crowns the best audio visualizers every year. For 38 years, Professor Emeritus Malpus Mosh has dominated the ranks with his elaborate audiovisual displays and calls everyone else amateurs. You are an up-and-coming visual engineer. Recreate your envisioned show and prove him wrong.
                        </p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {entranceComplete ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="p-4 grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-1"
                        >
                            {PUZZLE_ORDER.map((puzzleId, index) => {
                                const puzzle = PUZZLES[puzzleId];
                                return (
                                    <PuzzleCard
                                        key={puzzleId}
                                        index={index}
                                        puzzleId={puzzleId}
                                        puzzle={puzzle}
                                        onClick={() => handlePuzzleClick(puzzleId, index)}
                                        onHoverStart={handleHoverStart}
                                        onHoverEnd={handleHoverEnd}
                                    />
                                );
                            })}
                        </motion.div>
                    ) : (
                        <div className="py-20">
                            <LoadingSpinner />
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default PuzzlesModal;
