import React from 'react';
import { EFFECT_METADATA } from '../constants';
import { AdaptiveSlider } from './AdaptiveSlider';
import { useEffectStore } from '@/store/useEffectStore';

interface SidebarParamsProps { }

const SidebarParams: React.FC<SidebarParamsProps> = ({ }) => {
    const {
        effects,
        selectedEffectId,
        toggleMute,
        toggleSolo,
        updateParameter
    } = useEffectStore();

    const effectIndex = effects.findIndex(e => e.id === selectedEffectId);
    const effect = effects[effectIndex];
    if (!effect) return (
        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 pt-12">
            <span className="material-symbols-outlined text-white/5 text-5xl">tune</span>
            <p className="text-[10px] font-bold text-white/15 uppercase tracking-[0.2em] leading-relaxed">Select a processor module<br />to begin calibration</p>
        </div>
    );

    const isSoloed = effect.soloed;
    const isMuted = effect.muted;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
                <h3 className="text-primary text-[11px] font-bold uppercase tracking-[0.3em]">{EFFECT_METADATA[effect.type]?.label}</h3>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => toggleSolo(effectIndex)}
                        className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-mono transition-all border ${isSoloed ? 'bg-white text-black border-white' : 'text-white/60 border-white/10 hover:border-white/20'}`}
                        aria-label="Solo Effect"
                    >
                        S
                    </button>
                    <button
                        onClick={() => toggleMute(effectIndex)}
                        className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-mono transition-all border ${isMuted ? 'bg-cyan-900 text-white border-cyan-700' : 'text-white/60 border-white/10 hover:border-white/20'}`}
                        aria-label="Mute Effect"
                    >
                        M
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {EFFECT_METADATA[effect.type]?.params?.map((paramMeta, paramIdx) => {
                    const param = effect.params[paramIdx];
                    const isReactive = param.frequencyBand !== 'OFF';
                    return (
                        <div key={paramIdx} className="space-y-5 bg-white/[0.03] p-5 rounded-2xl border border-white/5 transition-colors hover:border-white/10">
                            <div className="flex flex-col space-y-3">
                                <div className="flex justify-between items-center px-0.5">
                                    <label className="text-[9px] font-bold uppercase tracking-widest text-white/60">
                                        {isReactive ? paramMeta.name + ' (Dynamic)' : paramMeta.name}
                                    </label>
                                    <div className="flex items-center">
                                        {isReactive ? (
                                            <span className="font-mono text-[10px] font-bold text-primary/80 bg-primary/5 px-2 py-0.5 rounded-md border border-primary/20">
                                                {Math.round(param.min)} — {Math.round(param.value)}%
                                            </span>
                                        ) : (
                                            <span className="font-mono text-[10px] font-bold text-white/60 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                                                {Math.round(param.value)}%
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <AdaptiveSlider
                                    value={param.value}
                                    min={param.min}
                                    frequencyBand={param.frequencyBand}
                                    onChange={(update) => updateParameter(effectIndex, paramIdx, update)}
                                />

                                <div className="flex items-center gap-3 pt-1">
                                    <span className="text-[8px] font-bold uppercase tracking-widest text-white/60 select-none">Listen</span>
                                    <div className="grid grid-cols-5 gap-1 bg-black/40 p-1 rounded-xl border border-white/5 w-full">
                                        {(['OFF', 'SUB', 'BASS', 'MID', 'TREBLE'] as const).map((band) => {
                                            const isActive = param.frequencyBand === band;
                                            return (
                                                <button
                                                    key={band}
                                                    onClick={() => updateParameter(effectIndex, paramIdx, { frequencyBand: band })}
                                                    className={`py-1.5 rounded-lg text-[7.5px] font-bold uppercase tracking-widest transition-all border ${isActive
                                                        ? 'bg-primary/20 text-primary border-primary/40 shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]'
                                                        : 'text-white/60 border-transparent hover:text-white'}`}
                                                >
                                                    {band}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SidebarParams;
