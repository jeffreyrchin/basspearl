import React from 'react';
import { EFFECT_METADATA } from '../constants';
import { AdaptiveSlider } from './AdaptiveSlider';
import { useEffectStore } from '@/store/useEffectStore';

interface SidebarParamsProps { }

const SidebarParams: React.FC<SidebarParamsProps> = ({ }) => {
    const effects = useEffectStore(s => s.effects);
    const selectedEffectId = useEffectStore(s => s.selectedEffectId);
    const toggleMute = useEffectStore(s => s.toggleMute);
    const toggleSolo = useEffectStore(s => s.toggleSolo);
    const updateParameter = useEffectStore(s => s.updateParameter);
    const commitHistory = useEffectStore(s => s.commitHistory);

    const effectIndex = effects.findIndex(e => e.id === selectedEffectId);
    const effect = effects[effectIndex];
    if (!effect) return (
        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <span className="material-symbols-outlined text-white/60 text-5xl">tune</span>
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em] leading-relaxed">No effect selected</p>
        </div>
    );

    const isSoloed = effect.soloed;
    const isMuted = effect.muted;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
                <h3 className="text-primary text-[11px] font-bold uppercase tracking-[0.3em]">{EFFECT_METADATA[effect.type]?.label}</h3>
                <div className="flex h-10 md:h-8 items-center border border-white/10 rounded-md bg-white/5 overflow-hidden">
                    <button
                        onClick={() => toggleSolo(effectIndex)}
                        className={`w-8 h-full flex items-center justify-center text-[10px] font-mono transition-none ${isSoloed ? 'bg-white text-black' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
                        aria-label="Solo Effect"
                    >
                        S
                    </button>
                    <div className="w-[1px] h-full bg-white/10 flex-shrink-0" />
                    <button
                        onClick={() => toggleMute(effectIndex)}
                        className={`w-8 h-full flex items-center justify-center text-[10px] font-mono transition-none ${isMuted ? 'bg-cyan-900 text-white hover:bg-cyan-800' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
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
                                    onPointerDown={() => commitHistory()}
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
                                                    onClick={() => { commitHistory(); updateParameter(effectIndex, paramIdx, { frequencyBand: band }); }}
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
