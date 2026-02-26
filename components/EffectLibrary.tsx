import React, { useState } from 'react';
import { GlitchEffectType, EffectCategory } from '../types';
import { EFFECT_METADATA } from '../constants';
import { useEffectStore } from '../store/useEffectStore';

interface EffectLibraryProps {
    onSelectEffect: () => void;
}

const CATEGORIES: EffectCategory[] = ['All', 'Additive', 'Color', 'Glitch', 'Motion', 'Mask'];

const EffectLibrary: React.FC<EffectLibraryProps> = ({ onSelectEffect }) => {
    const { addEffect } = useEffectStore();
    const [selectedCategory, setSelectedCategory] = useState<EffectCategory>('All');

    const filteredEffects = (Object.entries(EFFECT_METADATA) as [GlitchEffectType, typeof EFFECT_METADATA[GlitchEffectType]][])
        .filter(([, meta]) => selectedCategory === 'All' || meta.category === selectedCategory)
        .sort(([, a], [, b]) => a.label.localeCompare(b.label));

    const handleAdd = (type: GlitchEffectType) => {
        addEffect(type);
        onSelectEffect();
    };

    return (
        <>
            <div className="sticky top-0 z-20 px-6 py-4 bg-[#050B14]/80 backdrop-blur-md border-b border-white/5 flex flex-col gap-4">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {CATEGORIES.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${selectedCategory === category
                                ? 'bg-primary/10 text-primary border-primary/40 shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]'
                                : 'text-white/60 hover:text-white/80 border-transparent hover:bg-white/5'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-3">
                <div className="grid grid-cols-3 gap-3">
                    {filteredEffects.map(([type, meta]) => (
                        <div
                            key={type}
                            className="w-full aspect-square relative group rounded-sm border transition-all duration-300 overflow-hidden bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.03]"
                        >
                            {/* Main card area */}
                            <div
                                className="absolute inset-0 flex flex-col items-center justify-center z-0 w-full h-full pointer-events-none"
                            >
                                <span className="text-[12px] uppercase tracking-wider px-1 text-center leading-tight w-full text-white/60">
                                    {meta.label}
                                </span>
                            </div>

                            {/* Add to rack corner button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAdd(type);
                                }}
                                className="absolute top-2 right-2 w-8 h-8 rounded-sm flex items-center justify-center transition-all duration-300 z-10 border text-white/40 hover:text-white hover:bg-white/10 hover:border-white/30 border-transparent"
                                title="Add to rack"
                                aria-label="Add effect to rack"
                            >
                                <span className="text-xl material-symbols-outlined">add</span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default EffectLibrary;
