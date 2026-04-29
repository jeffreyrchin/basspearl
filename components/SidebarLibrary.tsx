import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { GlitchEffectType, EffectCategory, MacroType, EffectConfig } from '../types';
import { EFFECT_METADATA, MACRO_METADATA, createEffectInstance, createMacroInstance } from '../constants';
import { useEffectStore } from '../store/useEffectStore';
import { PUZZLES } from '../config/puzzles';
import EffectPreview from './EffectPreview';
import HoverCanvas from './HoverCanvas';
import { useProgressStore } from '@/store/useProgressStore';

interface SidebarLibraryProps {
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
    const requiredPuzzleIdCompletedToUnlock = macroType ? MACRO_METADATA[macroType].requiredPuzzleIdCompletedToUnlock : undefined;
    const isLocked = requiredPuzzleIdCompletedToUnlock !== undefined && !isPuzzleComplete(requiredPuzzleIdCompletedToUnlock);

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
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none z-10" />

            {isLocked && (
                <div className="absolute inset-0 bg-slate-800/40 flex flex-col items-center justify-center gap-1.5 p-3 border border-white/5">
                    <span className="material-symbols-outlined text-white/30 !text-[18px]">lock</span>
                    <span className="text-[10px] text-center text-white">Complete <span className="font-bold text-indigo-300">Puzzle {requiredPuzzleIdCompletedToUnlock + 1}</span> to unlock this preset</span>
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

const SidebarLibrary: React.FC<SidebarLibraryProps> = () => {
    const addEffect = useEffectStore(s => s.addEffect);
    const addMacro = useEffectStore(s => s.addMacro);
    const isGameMode = useEffectStore(s => s.isGameMode);
    const currentPuzzle = useEffectStore(s => s.currentPuzzle);
    const isPuzzleComplete = useProgressStore(s => s.isPuzzleComplete);
    const [selectedCategory, setSelectedCategory] = useState<string>('Patterns');

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

        return items
            .filter((item) => {
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
    }, [selectedCategory, isGameMode, currentPuzzle]);

    const handleAdd = (type: GlitchEffectType) => {
        addEffect(type);
    };

    const handleAddMacro = (macroType: MacroType) => {
        const meta = MACRO_METADATA[macroType];
        if (meta.requiredPuzzleIdCompletedToUnlock !== undefined && !isPuzzleComplete(meta.requiredPuzzleIdCompletedToUnlock)) {
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

            {/* Header / Category Filters */}
            <div className="sticky top-[-1px] z-50 px-6 py-3 border-b border-white/5 bg-slate-900 flex flex-col gap-4">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {CATEGORIES.map(category => {
                        if (isGameMode && category === 'Presets') return null;
                        return (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${selectedCategory === category
                                    ? 'bg-white/5 text-white border-white/20'
                                    : 'text-white/60 hover:text-white border-transparent hover:bg-white/5'
                                    }`}
                            >
                                {category}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Gallery Grid */}
            <div className="rounded-lg m-3 overflow-hidden">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))]">
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
            </div>
        </div>
    );
};

export default SidebarLibrary;
