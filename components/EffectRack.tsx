import React from 'react';
import { EFFECT_METADATA } from '../constants';

import { useEffectStore } from '../store/useEffectStore';

interface EffectRackProps {
    onSelectEffect: () => void;
    onNavigateToLibrary: () => void;
}

const EffectRack: React.FC<EffectRackProps> = ({
    onSelectEffect,
    onNavigateToLibrary
}) => {
    const {
        effects,
        moveEffect,
        removeEffect,
        setSelectedEffectIndex
    } = useEffectStore();

    const activeEffects = effects
        .map((effect, originalIndex) => ({ ...effect, originalIndex }))
        .filter(e => e.active);

    if (activeEffects.length === 0) {
        return (
            <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                <span className="material-symbols-outlined text-white/5 text-5xl mb-4">layers_clear</span>
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] leading-relaxed">
                    No active processing units<br />Select from effects library
                </p>
                <button
                    onClick={onNavigateToLibrary}
                    className="mt-6 px-4 py-2 rounded-full border border-white/10 text-[9px] font-bold text-white/40 uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all"
                >
                    Browse Library
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-2">
            {activeEffects.map((effect, index) => (
                <div
                    key={`${effect.type}-${index}`}
                    className="bg-white/5 border border-white/5 rounded-2xl p-2 pr-4 flex items-center gap-3 group hover:border-white/10 transition-none hover:transition-all hover:duration-300"
                >
                    {/* Order Controls */}
                    <div className="flex flex-col gap-0.5">
                        <button
                            onClick={() => moveEffect(effect.originalIndex, 'up')}
                            disabled={index === 0}
                            className="w-7 h-7 flex items-center justify-center text-white/60 enabled:hover:text-primary disabled:opacity-20 disabled:pointer-events-none transition-none hover:transition-all hover:duration-200"
                            title="Move Up"
                        >
                            <span className="material-symbols-outlined text-xl">keyboard_arrow_up</span>
                        </button>
                        <button
                            onClick={() => moveEffect(effect.originalIndex, 'down')}
                            disabled={index === activeEffects.length - 1}
                            className="w-7 h-7 flex items-center justify-center text-white/60 enabled:hover:text-primary disabled:opacity-20 disabled:pointer-events-none transition-none hover:transition-all hover:duration-200"
                            title="Move Down"
                        >
                            <span className="material-symbols-outlined text-xl">keyboard_arrow_down</span>
                        </button>
                    </div>

                    {/* Icon & Name */}
                    <button
                        onClick={() => {
                            setSelectedEffectIndex(effect.originalIndex);
                            onSelectEffect();
                        }}
                        className="flex-1 flex items-center gap-4 text-left"
                    >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                            <span className="material-symbols-outlined text-xl">{EFFECT_METADATA[effect.type]?.icon || 'extension'}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[11px] text-white uppercase tracking-wider">{EFFECT_METADATA[effect.type]?.label}</span>
                        </div>
                    </button>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                setSelectedEffectIndex(effect.originalIndex);
                                onSelectEffect();
                            }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-none hover:transition-all hover:duration-200"
                            title="Parameters"
                        >
                            <span className="material-symbols-outlined text-xl">tune</span>
                        </button>
                        <button
                            onClick={() => removeEffect(effect.originalIndex)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-none hover:transition-all hover:duration-200"
                            title="Remove effect"
                        >
                            <span className="material-symbols-outlined text-xl">close</span>
                        </button>
                    </div>
                </div>
            ))}
            <div className="pb-32" />
        </div>
    );
};

export default EffectRack;
