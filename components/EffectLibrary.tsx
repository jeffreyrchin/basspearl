import React, { useState } from 'react';
import { EffectCategory } from '../types';
import { EFFECT_METADATA } from '../constants';

import { useEffectStore } from '../store/useEffectStore';

interface EffectLibraryProps {
    onSelectEffect: () => void;
}

const CATEGORIES: EffectCategory[] = ['All', 'Color', 'Glitch', 'Motion', 'Particles', 'Retro'];

const EffectLibrary: React.FC<EffectLibraryProps> = ({
    onSelectEffect,
}) => {
    const {
        effects,
        toggleEffect,
        setSelectedEffectIndex
    } = useEffectStore();

    const [selectedCategory, setSelectedCategory] = useState<EffectCategory>('All');

    const filteredEffects = effects
        .map((effect, originalIndex) => ({ ...effect, originalIndex }))
        .filter(effect => selectedCategory === 'All' || EFFECT_METADATA[effect.type].category === selectedCategory)
        .sort((a, b) => {
            const labelA = EFFECT_METADATA[a.type]?.label || '';
            const labelB = EFFECT_METADATA[b.type]?.label || '';
            return labelA.localeCompare(labelB);
        });

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

            <div className="p-6">
                <div className="grid grid-cols-2 gap-3 pb-32">
                    {filteredEffects.map((effect) => (
                        <div
                            key={effect.type}
                            className={`w-full aspect-square relative group rounded-[20px] border transition-all duration-300 overflow-hidden ${effect.active ? 'bg-primary/10 border-primary/40 shadow-[inset_0_0_12px_rgba(59,130,246,0.1)]' : 'bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.03]'}`}
                        >
                            {/* Main Navigation Area */}
                            <button
                                onClick={() => {
                                    setSelectedEffectIndex(effect.originalIndex);
                                    onSelectEffect();
                                }}
                                className="absolute inset-0 flex flex-col items-center justify-center z-0 w-full h-full"
                            >
                                <div className={`mb-2 transition-all duration-500 ${effect.active ? 'text-primary' : 'text-white/60'}`}>
                                    <span className="material-symbols-outlined text-2xl">{EFFECT_METADATA[effect.type]?.icon || 'extension'}</span>
                                </div>
                                <span className={`text-[12px] font-bold uppercase tracking-wider px-1 text-center leading-tight w-full ${effect.active ? 'text-white' : 'text-white/60'}`}>
                                    {EFFECT_METADATA[effect.type]?.label}
                                </span>
                            </button>

                            {/* Quick Toggle Corner Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleEffect(effect.originalIndex);
                                }}
                                className={`absolute top-2 right-2 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 z-10 border ${effect.active ? 'text-primary hover:bg-primary/10 hover:border-primary/40 border-transparent' : 'text-white hover:bg-white/10 hover:border-white/50 border-transparent'}`}
                                title={effect.active ? 'Deactivate effect' : 'Activate effect'}
                                aria-label={effect.active ? 'Deactivate effect' : 'Activate effect'}
                            >
                                <span className="text-xl material-symbols-outlined">power_settings_new</span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default EffectLibrary;
