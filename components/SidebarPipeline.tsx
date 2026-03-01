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
        toggleSolo,
        toggleMeld
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
        <div className="p-4 pl-10 flex flex-col">
            {pipelineEffects.map((effect, index) => {
                const isSoloed = effect.soloed;
                const isMuted = effect.muted;
                const isActiveInChain = anySoloed ? isSoloed : !isMuted;
                const melded = effect.melded;
                const prevMelded = index > 0 && pipelineEffects[index - 1].melded;

                // Border radius logic for groups
                const borderRadius =
                    (melded && prevMelded) ? 'rounded-none' :
                        (melded && !prevMelded) ? 'rounded-t-lg rounded-b-none' :
                            (!melded && prevMelded) ? 'rounded-b-lg rounded-t-none' :
                                'rounded-lg';

                return (
                    <React.Fragment key={effect.id}>
                        <div className={`flex items-center gap-2 group/row transition-all duration-300 ${melded ? 'mb-0' : 'mb-2'}`}>
                            {/* Order Controls */}
                            <div className={`flex flex-col w-10 bg-white/5 -ml-8 h-16 md:h-10 border border-white/10 overflow-hidden transition-all duration-300 ${borderRadius} ${melded ? 'border-b-0' : ''} ${prevMelded ? 'border-t-0' : ''}`}>
                                <button
                                    onClick={() => moveEffect(effect.originalIndex, 'up')}
                                    disabled={index === 0}
                                    className={`w-full h-8 md:h-5 flex items-center justify-center text-white/60 enabled:hover:text-white enabled:hover:bg-white/10 disabled:opacity-20 disabled:pointer-events-none transition-none ${prevMelded ? 'invisible pointer-events-none' : ''}`}
                                    title="Move Up">
                                    <span className="material-symbols-outlined text-[16px]">keyboard_arrow_up</span>
                                </button>
                                <button
                                    onClick={() => moveEffect(effect.originalIndex, 'down')}
                                    disabled={index === pipelineEffects.length - 1}
                                    className={`w-full h-8 md:h-5 flex items-center justify-center text-white/60 enabled:hover:text-white enabled:hover:bg-white/10 disabled:opacity-20 disabled:pointer-events-none transition-none ${melded ? 'invisible pointer-events-none' : ''}`}
                                    title="Move Down">
                                    <span className="material-symbols-outlined text-[16px]">keyboard_arrow_down</span>
                                </button>
                            </div>

                            {/* Main Effect Card */}
                            <div
                                className={`flex-1 bg-white/5 border border-white/10 h-16 md:h-10 flex items-center transition-all duration-300 overflow-hidden ${borderRadius} ${melded ? 'border-b-0' : ''} ${prevMelded ? 'border-t-0' : ''}`}
                            >
                                <button
                                    onClick={() => {
                                        setSelectedEffectId(effect.id);
                                        onSelectEffect();
                                    }}
                                    className="flex-1 h-full px-3 flex items-center text-left hover:bg-white/5 transition-none"
                                >
                                    <span className={`text-[10px] uppercase tracking-[0.15em] truncate transition-none ${isActiveInChain ? 'text-white' : 'text-white/20'}`}>
                                        {EFFECT_METADATA[effect.type]?.label}
                                    </span>
                                </button>

                                {/* Action Buttons */}
                                <div className="flex h-full items-center">
                                    <div className="w-[1px] h-full bg-white/10 flex-shrink-0" />
                                    <button
                                        onClick={() => toggleSolo(effect.originalIndex)}
                                        className={`w-8 h-full flex items-center justify-center text-[10px] font-mono transition-none ${isSoloed ? 'bg-white/70 text-black hover:bg-white/80' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
                                        title="Solo Effect">
                                        S
                                    </button>
                                    <div className="w-[1px] h-full bg-white/10 flex-shrink-0" />
                                    <button
                                        onClick={() => toggleMute(effect.originalIndex)}
                                        className={`w-8 h-full flex items-center justify-center text-[10px] font-mono transition-none ${isMuted ? 'bg-cyan-900 text-white hover:bg-cyan-800' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
                                        title="Mute Effect">
                                        M
                                    </button>
                                    <div className="w-[1px] h-full bg-white/10 flex-shrink-0" />
                                    <button
                                        onClick={() => {
                                            setSelectedEffectId(effect.id);
                                            onSelectEffect();
                                        }}
                                        className="w-8 h-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-none"
                                        title="Parameters">
                                        <span className="material-symbols-outlined text-[16px]">tune</span>
                                    </button>
                                    <div className="w-[1px] h-full bg-white/10 flex-shrink-0" />
                                    <button
                                        onClick={() => removeEffect(effect.originalIndex)}
                                        className="w-8 h-full flex items-center justify-center text-white/60 hover:text-red-400 hover:bg-red-400/20 transition-none"
                                        title="Remove Effect">
                                        <span className="material-symbols-outlined text-[18px]">close</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Toggleable meld button between effects */}
                        {index < pipelineEffects.length - 1 && (
                            <div className="relative h-0 flex items-center justify-center group/meld z-20 overflow-visible">
                                <button
                                    onClick={() => toggleMeld(index)}
                                    className={`absolute w-10 h-10 md:h-6 rounded-full flex items-center justify-center transition-all duration-300 border backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${melded
                                        ? 'bg-primary/20 border-primary/30 scale-105 text-primary'
                                        : `border-white/10 text-white/60 hover:text-white hover:border-white/30 hover:scale-110 translate-y-[-5px]`}`}
                                    title={melded ? "Ungroup Effects" : "Group Effects"}>
                                    <span
                                        className="material-symbols-outlined"
                                        style={{ fontVariationSettings: "'wght' 500", fontSize: '18px', lineHeight: '1' }}>
                                        link
                                    </span>
                                </button>
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
            <div className="pb-32" />
        </div>
    );
};

export default SidebarPipeline;
