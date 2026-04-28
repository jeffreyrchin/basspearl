import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useEffectStore } from '../store/useEffectStore';
import EffectPreview from './EffectPreview';
import HoverCanvas from './HoverCanvas';
import { createMacroInstance } from '../constants';
import { PUZZLES } from '../config/puzzles';
import { EffectConfig, PuzzleConfig } from '../types';
import { useAudioStore } from '../store/useAudioStore';
import LoadingSpinner from './LoadingSpinner';

interface PuzzleCardProps {
    puzzle: PuzzleConfig;
    id: number;
    onClick: () => void;
    onHoverStart: (el: HTMLElement, blueprint: EffectConfig[]) => void;
    onHoverEnd: () => void;
}

const PuzzleCard: React.FC<PuzzleCardProps> = ({ puzzle, id, onClick, onHoverStart, onHoverEnd }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const blueprint = useMemo(() => {
        return puzzle.macro ? createMacroInstance(puzzle.macro, true) : [];
    }, [puzzle.macro]);

    const handleMouseEnter = useCallback(() => {
        if (containerRef.current && blueprint.length > 0) {
            onHoverStart(containerRef.current, blueprint);
        }
    }, [onHoverStart, blueprint]);

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
                {/* Fallback Mesh gradient if no preview/macro */}
                {!puzzle.macro && (
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-pink-500/20 group-hover:scale-110 transition-transform duration-700" />
                )}
                {/* Static poster image - Zero WebGL */}
                {puzzle.macro && <EffectPreview macroType={puzzle.macro} />}
            </div>

            {/* Gradient overlay for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none z-10" />

            {/* Lock icon */}
            {puzzle.locked && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <span className="material-symbols-outlined !text-[32px] text-white/30 group-hover:text-white/60 transition-all">
                        lock
                    </span>
                </div>
            )}

            {/* Label */}
            <div className="absolute inset-x-0 bottom-0 p-3 z-20 text-left pointer-events-none">
                <div className="text-[8px] font-bold uppercase tracking-[0.2em] text-indigo-300 mb-0.5">
                    {puzzle.difficulty}
                </div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-white">
                    Puzzle {id + 1}
                </div>
            </div>
        </button>
    );
};

const PuzzlesModal: React.FC = () => {
    const isPuzzlesModalOpen = useEffectStore(s => s.isPuzzlesModalOpen);
    const setIsPuzzlesModalOpen = useEffectStore(s => s.setIsPuzzlesModalOpen);
    const setCurrentPuzzle = useEffectStore(s => s.setCurrentPuzzle);
    const loadAudioFromUrl = useAudioStore(s => s.loadAudioFromUrl);

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

    const handlePuzzleClick = (puzzleId: number) => {
        if (PUZZLES[puzzleId].locked) return;
        loadAudioFromUrl('/trip.mp3', 'Demo Track').catch(err => {
            console.error(err);
        });
        setCurrentPuzzle(puzzleId);
        setIsPuzzlesModalOpen(false);
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

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {entranceComplete ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="p-4 grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-1"
                        >
                            {PUZZLES.map((puzzle, id) => (
                                <PuzzleCard
                                    key={id}
                                    id={id}
                                    puzzle={puzzle}
                                    onClick={() => handlePuzzleClick(id)}
                                    onHoverStart={handleHoverStart}
                                    onHoverEnd={handleHoverEnd}
                                />
                            ))}
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
