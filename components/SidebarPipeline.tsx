import React from 'react';
import { EFFECT_METADATA } from '../constants';

import { useEffectStore } from '../store/useEffectStore';

interface SidebarPipelineProps {
    onSelectEffect: () => void;
    onNavigateToLibrary: () => void;
}

const SidebarPipeline: React.FC<SidebarPipelineProps> = ({
    onSelectEffect,
    onNavigateToLibrary
}) => {
    const {
        effects,
        moveEffect,
        removeEffect,
        setSelectedEffectId,
        toggleMute,
        toggleSolo
    } = useEffectStore();

    const anySoloed = effects.some(e => e.soloed);
    const pipelineEffects = effects.map((effect, originalIndex) => ({ ...effect, originalIndex }));

    if (pipelineEffects.length === 0) {
        return (
            <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                <span className="material-symbols-outlined text-white/30 text-5xl mb-4">layers_clear</span>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em] leading-relaxed">
                    No active effects
                </p>
                <button
                    onClick={onNavigateToLibrary}
                    className="mt-6 px-4 py-2 rounded-full border border-white/10 text-[9px] font-bold text-white/60 uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all"
                >
                    Browse Library
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-2">
            {pipelineEffects.map((effect, index) => {
                const isSoloed = effect.soloed;
                const isMuted = effect.muted;
                const isActiveInChain = anySoloed ? isSoloed : !isMuted;

                return (
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
                                disabled={index === pipelineEffects.length - 1}
                                className="w-7 h-7 flex items-center justify-center text-white/60 enabled:hover:text-primary disabled:opacity-20 disabled:pointer-events-none transition-none hover:transition-all hover:duration-200"
                                title="Move Down"
                            >
                                <span className="material-symbols-outlined text-xl">keyboard_arrow_down</span>
                            </button>
                        </div>

                        {/* Icon & Name */}
                        <button
                            onClick={() => {
                                setSelectedEffectId(effect.id);
                                onSelectEffect();
                            }}
                            className="flex-1 flex items-center gap-4 text-left"
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${isActiveInChain ? 'bg-primary/10 text-primary border-primary/20' : 'bg-white/5 text-white/40 border-white/10'}`}>
                                <span className="material-symbols-outlined text-xl">{EFFECT_METADATA[effect.type]?.icon || 'extension'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[11px] text-white uppercase tracking-wider">{EFFECT_METADATA[effect.type]?.label}</span>
                            </div>
                        </button>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => toggleSolo(effect.originalIndex)}
                                className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-mono transition-all border ${isSoloed ? 'bg-white text-black border-white' : 'text-white/60 border-white/5 hover:border-white/20'}`}
                                title="Solo Effect"
                            >
                                S
                            </button>
                            <button
                                onClick={() => toggleMute(effect.originalIndex)}
                                className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-mono transition-all border ${isMuted ? 'bg-cyan-900 text-white border-cyan-700' : 'text-white/60 border-white/5 hover:border-white/20'}`}
                                title="Mute Effect"
                            >
                                M
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedEffectId(effect.id);
                                    onSelectEffect();
                                }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-none hover:transition-all hover:duration-200"
                                title="Parameters"
                            >
                                <span className="material-symbols-outlined text-xl">tune</span>
                            </button>
                            <button
                                onClick={() => removeEffect(effect.originalIndex)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-red-400 hover:bg-red-400/10 transition-none hover:transition-all hover:duration-200"
                                title="Remove Effect"
                            >
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        </div>
                    </div>
                );
            })}
            <div className="pb-32" />
        </div>
    );
};

export default SidebarPipeline;
