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

    const BAND_LABELS: Record<string, string> = {
        'OFF': 'Off',
        'SUB': 'Sub',
        'BASS': 'Bass',
        'MID': 'Mid',
        'TREBLE': 'Treb'
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
                <h3 className="text-primary text-[11px] font-bold uppercase tracking-[0.2em]">{EFFECT_METADATA[effect.type]?.label}</h3>
                <div className="flex h-10 md:h-8 items-center border border-white/10 rounded-md bg-white/5 overflow-hidden">
                    <button
                        onClick={() => toggleSolo(effectIndex)}
                        className={`w-8 h-full flex items-center justify-center transition-colors ${isSoloed ? 'bg-white text-black' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
                        title="Toggle Solo"
                    >
                        <span className="material-symbols-outlined text-[18px]">egg</span>
                    </button>
                    <div className="w-[1px] h-full bg-white/10 flex-shrink-0" />
                    <button
                        onClick={() => toggleMute(effectIndex)}
                        className={`w-8 h-full flex items-center justify-center transition-colors ${isMuted ? 'bg-cyan-900 text-white hover:bg-cyan-800' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
                        title="Toggle Visibility"
                    >
                        <span className="material-symbols-outlined text-[18px]">{isMuted ? 'visibility_off' : 'visibility'}</span>
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {EFFECT_METADATA[effect.type]?.params?.map((paramMeta, paramIdx) => {
                    const param = effect.params[paramIdx];
                    return (
                        <div key={paramIdx} className="space-y-5 bg-white/[0.03] p-5 rounded-2xl border border-white/5 transition-colors hover:border-white/10">
                            <div className="flex flex-col space-y-3">
                                <div className="flex justify-between items-center px-0.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                                        {paramMeta.name}
                                    </label>
                                    <div className="flex gap-0.5 bg-black/40 p-0.5 rounded-lg border border-white/5">
                                        {(['OFF', 'SUB', 'BASS', 'MID', 'TREBLE'] as const).map((band) => {
                                            const isActive = param.frequencyBand === band;
                                            return (
                                                <button
                                                    key={band}
                                                    onClick={() => { commitHistory(); updateParameter(effectIndex, paramIdx, { frequencyBand: band }); }}
                                                    className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold uppercase tracking-widest transition-all flex items-center justify-center min-w-[24px] ${isActive
                                                        ? 'bg-primary/20 text-primary border border-primary/40'
                                                        : 'text-white/60 border border-transparent hover:text-white'}`}
                                                >
                                                    {band === 'OFF' ? (
                                                        <span className="material-symbols-outlined">graphic_eq_off</span>
                                                    ) : (
                                                        BAND_LABELS[band]
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <AdaptiveSlider
                                    value={param.value}
                                    min={param.min}
                                    frequencyBand={param.frequencyBand}
                                    onPointerDown={() => commitHistory()}
                                    onChange={(update) => updateParameter(effectIndex, paramIdx, update)}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SidebarParams;
