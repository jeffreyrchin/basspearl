import React from 'react';
import { EFFECT_METADATA } from '../constants';
import { EffectSlider } from './EffectSlider';
import { useEffectStore } from '@/store/useEffectStore';

interface EffectParamsProps { }

const EffectParams: React.FC<EffectParamsProps> = ({ }) => {
    const {
        effects,
        selectedEffectIndex,
        toggleEffect,
        updateParameter
    } = useEffectStore();

    const effect = effects[selectedEffectIndex];

    if (!effect) return (
        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 pt-12">
            <span className="material-symbols-outlined text-white/5 text-5xl">tune</span>
            <p className="text-[10px] font-bold text-white/15 uppercase tracking-[0.2em] leading-relaxed">Select a processor module<br />to begin calibration</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
                <h3 className="text-primary text-[11px] font-bold uppercase tracking-[0.3em]">{EFFECT_METADATA[effect.type]?.label}</h3>
                <div className="flex items-center space-x-2">
                    <p className={`text-[10px] uppercase tracking-widest ${effect.active ? 'text-primary' : 'text-white/60'}`}>{effect.active ? 'Active' : 'Inactive'}</p>
                    <button
                        onClick={() => toggleEffect(selectedEffectIndex)}
                        className={`w-12 h-6 rounded-full transition-all duration-300 relative border ${effect.active ? 'bg-primary/20 border-primary/40 shadow-[inset_0_0_10px_rgba(59,130,246,0.2)]' : 'bg-white/10 border-transparent'}`}
                        aria-label={effect.active ? 'Deactivate effect' : 'Activate effect'}
                    >
                        <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white transition-all duration-300 ${effect.active ? 'left-7' : 'left-1'} shadow-md`} />
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {EFFECT_METADATA[effect.type]?.paramNames?.map((paramName, paramIdx) => {
                    const param = effect.params[paramIdx];
                    return (
                        <div key={paramIdx} className="space-y-6 bg-white/[0.03] p-5 rounded-2xl border border-white/5">
                            <div className="flex flex-col space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-[9px] font-bold uppercase tracking-widest text-white/60">
                                        {param.reactive ? `${paramName.name} (Reactive)` : paramName.name}
                                    </label>
                                    <span className="font-mono text-[10px] font-bold text-white/60 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">{Math.round(param.value)}%</span>
                                </div>

                                <EffectSlider
                                    value={param.value}
                                    onChange={(val) => {
                                        updateParameter(selectedEffectIndex, paramIdx, { value: val });
                                    }}
                                    onCommit={() => { }}
                                />
                                <div className="flex items-center gap-3">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/60">Sync</span>
                                    <div className="grid grid-cols-5 gap-1 bg-black/40 p-1 rounded-xl border border-white/5 w-full">
                                        {(['OFF', 'SUB', 'BASS', 'MID', 'TREBLE'] as const).map((band) => {
                                            const isActive = band === 'OFF' ? !param.reactive : (param.reactive && param.frequencyBand === band);
                                            return (
                                                <button
                                                    key={band}
                                                    onClick={() => {
                                                        if (band === 'OFF') {
                                                            updateParameter(selectedEffectIndex, paramIdx, { reactive: false });
                                                        } else {
                                                            updateParameter(selectedEffectIndex, paramIdx, { reactive: true, frequencyBand: band });
                                                        }
                                                    }}
                                                    className={`py-2 rounded-lg text-[7.5px] font-bold uppercase tracking-widest transition-all border ${isActive
                                                        ? 'bg-primary/20 text-primary border-primary/40 shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]'
                                                        : 'text-white/40 border-transparent hover:text-white/60'}`}
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

export default EffectParams;
