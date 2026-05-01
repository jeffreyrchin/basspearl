import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { GlitchEffectType, EffectCategory, MacroType, EffectConfig } from '../types';
import { EFFECT_METADATA, MACRO_METADATA, createEffectInstance, createMacroInstance } from '../constants';
import { useEffectStore } from '../store/useEffectStore';
import { PUZZLES, PUZZLE_ORDER } from '../config/puzzles';
import EffectPreview from './EffectPreview';
import HoverCanvas from './HoverCanvas';
import { useProgressStore } from '@/store/useProgressStore';

interface SidebarLibraryProps {
    onClose: () => void;
}

interface SidebarLibraryItem {
    id: string;
    label: string;
    category: EffectCategory;
    effectType?: GlitchEffectType;
    macroType?: MacroType;
}

interface LibraryCardProps {
    effectType?: GlitchEffectType;
    macroType?: MacroType;
    onClick: () => void;
    onHoverStart: (el: HTMLElement, blueprint: EffectConfig[]) => void;
    onHoverEnd: () => void;
}

const LibraryIcon = ({ effectType, macroType }: { effectType?: GlitchEffectType; macroType?: MacroType }) => {
    if (macroType) {
        return <span className="material-symbols-outlined text-cyan-300 !text-[12px]">grid_view</span>;
    }

    if (!effectType) return null;

    const metadata = EFFECT_METADATA[effectType];

    // Explicit type-to-icon overrides
    const overrides: Record<string, { icon: string; color: string }> = {
        IMAGE: { icon: 'image', color: 'text-red-300' },
        RGBA: { icon: 'palette', color: 'text-indigo-300' },
        TRANSFORM: { icon: 'drag_pan', color: 'text-indigo-300' },
    };

    if (overrides[effectType]) {
        const { icon, color } = overrides[effectType];
        return <span className={`material-symbols-outlined ${color} !text-[12px] transition-colors`}>{icon}</span>;
    }

    // Category-based fallbacks
    const isPattern = metadata?.category === 'Pattern';
    const icon = isPattern ? 'grain' : 'adjust';
    const color = isPattern ? 'text-red-300' : 'text-indigo-300';

    return <span className={`material-symbols-outlined ${color} !text-[12px] transition-colors`}>{icon}</span>;
};

const LibraryCard: React.FC<LibraryCardProps> = ({ effectType, macroType, onClick, onHoverStart, onHoverEnd }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const isPuzzleComplete = useProgressStore(s => s.isPuzzleComplete);
    const requiredPuzzleCompletedToUnlock = macroType ? MACRO_METADATA[macroType].requiredPuzzleCompletedToUnlock : undefined;
    const isLocked = requiredPuzzleCompletedToUnlock !== undefined && !isPuzzleComplete(requiredPuzzleCompletedToUnlock);
    const puzzleNumber = requiredPuzzleCompletedToUnlock ? PUZZLE_ORDER.indexOf(requiredPuzzleCompletedToUnlock) + 1 : -1;

    const blueprint = useMemo(() => {
        return macroType
            ? createMacroInstance(macroType, true)
            : [createEffectInstance(effectType!, true)];
    }, [effectType, macroType]);

    const handleMouseEnter = useCallback(() => {
        if (isLocked) return;
        if (containerRef.current) {
            onHoverStart(containerRef.current, blueprint);
        }
    }, [onHoverStart, blueprint, isLocked]);

    const label = effectType ? EFFECT_METADATA[effectType].label : MACRO_METADATA[macroType!].label;

    return (
        <button
            className="w-full aspect-square relative group transition-all duration-500 overflow-hidden cursor-pointer outline-none"
            onClick={onClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={onHoverEnd}
            onFocus={handleMouseEnter}
            onBlur={onHoverEnd}
            aria-label={`Add ${label}`}
        >
            <div ref={containerRef} className="absolute inset-0 pointer-events-none">
                {/* Static poster image - Zero WebGL */}
                {!isLocked && effectType && <EffectPreview type={effectType} />}
                {!isLocked && macroType && <EffectPreview macroType={macroType} />}
            </div>

            {/* Gradient overlay for text legibility */}
            {!isLocked && <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none z-10" />}

            {isLocked && (
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-pink-500/20">
                    <div className="absolute inset-0 bg-slate-800/40 flex flex-col items-center justify-center gap-1.5 p-3 border border-white/5">
                        <span className="material-symbols-outlined text-white/30 !text-[18px]">lock</span>
                        <span className="text-[10px] text-center text-white">Complete <span className="font-bold text-indigo-300">Puzzle {puzzleNumber}</span> to unlock this preset</span>
                    </div>
                </div>
            )}

            {!isLocked &&
                <>
                    {/* Label */}
                    <div className="absolute inset-x-0 bottom-0 p-1.5 z-20 pointer-events-none">
                        <span className="flex items-center gap-1 text-[9px] text-left font-bold uppercase tracking-[0.15em] text-white/90 group-hover:text-white transition-colors leading-none">
                            <LibraryIcon effectType={effectType} macroType={macroType} />
                            {label}
                        </span>
                    </div>

                    {/* Quick add indicator */}
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/40 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-[-4px] group-hover:translate-y-0 pointer-events-none z-20">
                        <span className="text-sm material-symbols-outlined text-white">add</span>
                    </div>
                </>
            }

            {/* Focus ring */}
            <div className="z-30 absolute inset-0 border-2 border-white opacity-0 group-focus-visible:opacity-100 pointer-events-none transition-opacity" />
        </button>
    );
}

const CATEGORIES = ['All', 'Patterns', 'Effects', 'Presets'];

const SidebarLibrary: React.FC<SidebarLibraryProps> = ({ onClose }) => {
    const addEffect = useEffectStore(s => s.addEffect);
    const addMacro = useEffectStore(s => s.addMacro);
    const isGameMode = useEffectStore(s => s.isGameMode);
    const currentPuzzle = useEffectStore(s => s.currentPuzzle);
    const isPuzzleComplete = useProgressStore(s => s.isPuzzleComplete);
    const setIsPuzzlesModalOpen = useEffectStore(s => s.setIsPuzzlesModalOpen);
    const [selectedCategory, setSelectedCategory] = useState<string>('Patterns');
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Auto-focus search input when switching to 'All'
    useEffect(() => {
        if (selectedCategory === 'All') {
            // 0ms timeout allows rendering to complete before focusing
            setTimeout(() => searchInputRef.current?.focus(), 0);
        }
    }, [selectedCategory]);

    // Automatically switch to 'All' if the user starts a game
    useEffect(() => {
        if (isGameMode) {
            setSelectedCategory('All');
        }
    }, [isGameMode]);

    // === Shared Hover Canvas State ===
    // Only one (element, blueprint) pair is active at a time.
    // This is the "teleportation target" for the single HoverCanvas.
    const [hoverTarget, setHoverTarget] = useState<{ el: HTMLElement; blueprint: EffectConfig[] } | null>(null);

    const handleHoverStart = useCallback((el: HTMLElement, blueprint: EffectConfig[]) => {
        setHoverTarget({ el, blueprint });
    }, []);

    const handleHoverEnd = useCallback(() => {
        setHoverTarget(null);
    }, []);

    const libraryItems = useMemo(() => {
        const effects: SidebarLibraryItem[] = (Object.entries(EFFECT_METADATA) as [GlitchEffectType, typeof EFFECT_METADATA[GlitchEffectType]][])
            .map(([type, meta]) => ({
                id: type,
                label: meta.label,
                category: meta.category,
                effectType: type,
            }));

        const macros: SidebarLibraryItem[] = (Object.entries(MACRO_METADATA) as [MacroType, typeof MACRO_METADATA[MacroType]][])
            .map(([type, meta]) => ({
                id: type,
                label: meta.label,
                category: 'Macro' as EffectCategory,
                macroType: type,
            }));

        const activePuzzle = isGameMode && currentPuzzle !== null ? PUZZLES[currentPuzzle] : null;
        const allowedEffects = activePuzzle?.allowedEffects;

        // Hide macros during game mode, as puzzles are meant to be solved with base effects
        const items: SidebarLibraryItem[] = [...effects, ...(activePuzzle ? [] : macros)];

        // Handle multi-word search: searchTerms is an array of words
        const searchTerms = searchQuery
            .trim()            // 1. Remove whitespace from start and end
            .toLowerCase()     // 2. Make everything lowercase (case-insensitive search)
            .split(' ')        // 3. Split string into an array using spaces
            .filter(Boolean);  // 4. Remove empty strings

        return items
            .filter((item) => {
                // Filter by search query (only applies to the 'All' tab)
                if (selectedCategory === 'All' && searchTerms.length > 0 && !searchTerms.every((t) => item.label.toLowerCase().includes(t))) {
                    return false;
                }

                // If in game mode and allowedEffects is defined, strict filter
                if (activePuzzle && allowedEffects && item.effectType) {
                    if (!allowedEffects.includes(item.effectType)) return false;
                }

                if (selectedCategory === 'All') return true;
                if (selectedCategory === 'Patterns') return item.category === 'Pattern';
                if (selectedCategory === 'Effects') return item.category === 'Modifier';
                if (selectedCategory === 'Presets') return item.category === 'Macro';
                return false;
            })
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [selectedCategory, isGameMode, currentPuzzle, searchQuery]);

    const handleAdd = (type: GlitchEffectType) => {
        addEffect(type);
    };

    const handleAddMacro = (macroType: MacroType) => {
        const meta = MACRO_METADATA[macroType];
        if (meta.requiredPuzzleCompletedToUnlock !== undefined && !isPuzzleComplete(meta.requiredPuzzleCompletedToUnlock)) {
            setIsPuzzlesModalOpen(true);
            return;
        }
        addMacro(macroType);
    };

    return (
        <div>
            {/* THE ONE SHARED HOVER CANVAS — portals into whichever card is hovered */}
            <HoverCanvas
                targetEl={hoverTarget?.el ?? null}
                blueprint={hoverTarget?.blueprint ?? []}
            />

            {/* Header / Category Filters & Search */}
            <div className="sticky top-0 z-50 px-3 pt-2.5 pb-2 border-b border-white/5 bg-slate-900 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                    <div className="relative flex-1 flex items-center min-w-0">
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-1">
                            {CATEGORIES.map(category => {
                                if (isGameMode && category === 'Presets') return null;
                                return (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`px-3 h-7 rounded-full flex items-center text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${selectedCategory === category
                                            ? 'bg-white/5 text-white border-white/20'
                                            : 'text-white/60 hover:text-white border-white/10 hover:bg-white/5'
                                            }`}
                                    >
                                        {category === 'All' ? <span className="material-symbols-outlined !text-[16px]">search</span> : category}
                                    </button>
                                )
                            })}
                        </div>
                        {/* Fade masks */}
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-l from-slate-900 to-transparent pointer-events-none z-10" />
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-r from-slate-900 to-transparent pointer-events-none z-10" />
                    </div>

                    <button
                        onClick={onClose}
                        className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
                        title="Close Library (Y)"
                    >
                        <span className="material-symbols-outlined !text-[20px]">close</span>
                    </button>
                </div>

                {/* Search Bar */}
                {selectedCategory === 'All' && (
                    <div className="relative group mx-1">
                        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-white/60 !text-[16px]">search</span>
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search..."
                            className="w-full bg-white/5 border border-white/5 rounded-lg h-7 pl-8 pr-8 text-[10px] text-white placeholder:text-white/60 focus:bg-white/10 outline-none ring-0 focus:border-indigo-400 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined !text-[20px]">close</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Gallery Grid */}
            <div className="m-3 overflow-hidden">
                {libraryItems.length > 0 ? (
                    <div className="grid gap-[1px] grid-cols-[repeat(auto-fill,minmax(110px,1fr))]">
                        {libraryItems.map((item) => (
                            <LibraryCard
                                key={item.id}
                                effectType={item.effectType}
                                macroType={item.macroType}
                                onClick={() => item.macroType ? handleAddMacro(item.macroType) : handleAdd(item.effectType!)}
                                onHoverStart={handleHoverStart}
                                onHoverEnd={handleHoverEnd}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center px-6 text-center">
                        <span className="material-symbols-outlined text-white/10 !text-[48px] mb-2">search_off</span>
                        <p className="text-[11px] text-white/60 font-medium tracking-wide">
                            No results found for <span className="text-white/90">"{searchQuery}"</span>
                        </p>
                        <button
                            onClick={() => setSearchQuery('')}
                            className="mt-4 px-3 h-7 rounded-full text-[10px] border border-white/5 bg-white/5 hover:bg-white/10 text-white/90 font-bold uppercase tracking-widest transition-colors"
                        >
                            Clear Search
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SidebarLibrary;
