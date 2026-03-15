import React, { useState, useCallback, useMemo, useRef } from 'react';
import { GlitchEffectType, EffectCategory, MacroType, EffectConfig } from '../types';
import { EFFECT_METADATA, MACRO_METADATA, createEffectInstance, createMacroInstance } from '../constants';
import { useEffectStore } from '../store/useEffectStore';
import EffectPreview from './EffectPreview';
import HoverCanvas from './HoverCanvas';

interface SidebarLibraryProps { }

interface LibraryCardProps {
    effectType?: GlitchEffectType;
    macroType?: MacroType;
    onClick: () => void;
    onHoverStart: (el: HTMLElement, blueprint: EffectConfig[]) => void;
    onHoverEnd: () => void;
}

const LibraryCard: React.FC<LibraryCardProps> = ({ effectType, macroType, onClick, onHoverStart, onHoverEnd }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const blueprint = useMemo(() => {
        return macroType
            ? createMacroInstance(macroType, true)
            : [createEffectInstance(effectType!, true)];
    }, [effectType, macroType]);

    const handleMouseEnter = useCallback(() => {
        if (containerRef.current) {
            onHoverStart(containerRef.current, blueprint);
        }
    }, [onHoverStart, blueprint]);

    const label = effectType ? EFFECT_METADATA[effectType].label : MACRO_METADATA[macroType!].label;

    return (
        <button
            className="w-full aspect-square relative group rounded-md border transition-all duration-500 overflow-hidden bg-white/[0.01] border-white/5 hover:border-white/20 hover:bg-white/[0.03] cursor-pointer shadow-lg"
            onClick={onClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={onHoverEnd}
            onFocus={handleMouseEnter}
            onBlur={onHoverEnd}
            aria-label={`Add ${label}`}
        >
            <div ref={containerRef} className="absolute inset-0 pointer-events-none">
                {/* Static poster image - Zero WebGL */}
                {effectType && <EffectPreview type={effectType} />}
                {macroType && <EffectPreview macroType={macroType} />}
            </div>

            {/* Gradient overlay for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none z-10" />

            {/* Label */}
            <div className="absolute inset-x-0 bottom-0 p-2 z-20 pointer-events-none">
                <span className="text-[9px] text-left font-bold uppercase tracking-[0.15em] text-white/90 group-hover:text-white transition-colors block leading-tight">
                    {label}
                </span>
            </div>

            {/* Quick add indicator */}
            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/40 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-[-4px] group-hover:translate-y-0 pointer-events-none z-20">
                <span className="text-sm material-symbols-outlined text-white">add</span>
            </div>
        </button>
    );
}

const CATEGORIES: EffectCategory[] = ['All', 'Pattern', 'Color', 'Spatial', 'Distort', 'Macro'];

const SidebarLibrary: React.FC<SidebarLibraryProps> = () => {
    const addEffect = useEffectStore(s => s.addEffect);
    const addMacro = useEffectStore(s => s.addMacro);
    const [selectedCategory, setSelectedCategory] = useState<EffectCategory>('All');

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

    const filteredEffects = useMemo(() => {
        if (selectedCategory === 'Macro') return [];
        return (Object.entries(EFFECT_METADATA) as [GlitchEffectType, typeof EFFECT_METADATA[GlitchEffectType]][])
            .filter(([, meta]) => selectedCategory === 'All' || meta.category === selectedCategory)
            .sort(([, a], [, b]) => a.label.localeCompare(b.label));
    }, [selectedCategory]);

    const handleAdd = (type: GlitchEffectType) => {
        addEffect(type);
    };

    const handleAddMacro = (macroType: MacroType) => {
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
            <div className="sticky top-0 z-50 px-6 py-4 bg-slate-900 border-b border-white/5 flex flex-col gap-4">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {CATEGORIES.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${selectedCategory === category
                                ? 'bg-slate-900 text-white border-white/40'
                                : 'text-white/60 hover:text-white/80 border-transparent hover:bg-white/5'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Gallery Grid */}
            <div className="p-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {/* Render Macros first if in 'All' or 'Macro' */}
                    {(selectedCategory === 'All' || selectedCategory === 'Macro') && Object.entries(MACRO_METADATA).map(([id]) => (
                        <LibraryCard
                            key={id}
                            macroType={id as MacroType}
                            onClick={() => handleAddMacro(id as MacroType)}
                            onHoverStart={handleHoverStart}
                            onHoverEnd={handleHoverEnd}
                        />
                    ))}

                    {/* Render Individual Effects */}
                    {filteredEffects.map(([type]) => (
                        <LibraryCard
                            key={type}
                            effectType={type}
                            onClick={() => handleAdd(type)}
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
