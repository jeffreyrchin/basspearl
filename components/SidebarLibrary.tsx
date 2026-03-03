import React, { useState } from 'react';
import { GlitchEffectType, EffectCategory } from '../types';
import { EFFECT_METADATA } from '../constants';
import { useEffectStore } from '../store/useEffectStore';
import EffectPreview from './EffectPreview';

interface SidebarLibraryProps {
    onSelectEffect: () => void;
}

const CATEGORIES: EffectCategory[] = ['All', 'Additive', 'Color', 'Glitch', 'Motion', 'Mask'];

const SidebarLibrary: React.FC<SidebarLibraryProps> = ({ onSelectEffect }) => {
    const addEffect = useEffectStore(s => s.addEffect);
    const [selectedCategory, setSelectedCategory] = useState<EffectCategory>('All');

    const filteredEffects = React.useMemo(() => {
        return (Object.entries(EFFECT_METADATA) as [GlitchEffectType, typeof EFFECT_METADATA[GlitchEffectType]][])
            .filter(([, meta]) => selectedCategory === 'All' || meta.category === selectedCategory)
            .sort(([, a], [, b]) => a.label.localeCompare(b.label));
    }, [selectedCategory]);

    const handleAdd = (type: GlitchEffectType) => {
        addEffect(type);
        onSelectEffect();
    };

    return (
        <div className="flex flex-col h-full bg-[#050B14]">
            {/* Header / Category Filters */}
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

            {/* Gallery Grid */}
            <div className="p-3 flex-1 overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filteredEffects.map(([type, meta]) => (
                        <button
                            key={type}
                            className="w-full aspect-square relative group rounded-md border transition-all duration-500 overflow-hidden bg-white/[0.01] border-white/5 hover:border-white/20 hover:bg-white/[0.03] cursor-pointer shadow-lg"
                            onClick={() => handleAdd(type)}
                            aria-label="Add Effect"
                        >
                            {/* Card Background / Live Preview */}
                            <EffectPreview type={type} />

                            {/* Gradient overlay for text legibility */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none" />

                            {/* Label */}
                            <div className="absolute inset-x-0 bottom-0 p-2 z-10 pointer-events-none">
                                <span className="text-[9px] text-left font-bold uppercase tracking-[0.15em] text-white/90 group-hover:text-white transition-colors block leading-tight">
                                    {meta.label}
                                </span>
                            </div>

                            {/* Quick add indicator */}
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-[-4px] group-hover:translate-y-0 pointer-events-none">
                                <span className="text-sm material-symbols-outlined text-white">add</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SidebarLibrary;
