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
        updateParams,
        updateFrequencyBand
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
                {EFFECT_METADATA[effect.type]?.paramNames?.map((paramName, paramIdx) => (
                    <div key={paramIdx} className="space-y-6 bg-white/[0.03] p-5 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-end">
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold uppercase tracking-widest text-white/60">
                                    {effect.params[paramIdx].reactive ? `Max ${paramName.name}` : paramName.name}
                                </label>
                                <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/5 w-fit">
                                    <button
                                        onClick={() => {
                                            const newParams = [...effect.params];
                                            newParams[paramIdx] = { ...newParams[paramIdx], reactive: false };
                                            updateParams(selectedEffectIndex, newParams);
                                        }}
                                        className={`px-3 py-2 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all ${!effect.params[paramIdx].reactive ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
                                    >
                                        Manual
                                    </button>
                                    <button
                                        onClick={() => {
                                            const newParams = [...effect.params];
                                            newParams[paramIdx] = { ...newParams[paramIdx], reactive: true };
                                            updateParams(selectedEffectIndex, newParams);
                                        }}
                                        className={`px-3 py-2 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all ${effect.params[paramIdx].reactive ? 'bg-primary/10 text-primary border border-primary/40 shadow-[inset_0_0_12px_rgba(59,130,246,0.1)]' : 'text-white/60 hover:text-white border border-transparent'}`}
                                    >
                                        Sync
                                    </button>
                                </div>
                            </div>
                            <span className="font-mono text-xs font-bold text-white px-2 py-1">{Math.round(effect.params[paramIdx].value)}%</span>
                        </div>
                        <EffectSlider
                            value={effect.params[paramIdx].value}
                            onChange={(val) => {
                                const newParams = [...effect.params];
                                newParams[paramIdx] = { ...newParams[paramIdx], value: val };
                                updateParams(selectedEffectIndex, newParams);
                            }}
                            onCommit={() => { }}
                        />
                    </div>
                ))}

                {/* Frequency Bands */}
                <div className="space-y-4 bg-white/[0.03] p-5 rounded-2xl border border-white/5">
                    <label className="text-[9px] font-bold text-white/60 uppercase tracking-widest block">Frequency</label>
                    <div className="grid grid-cols-4 gap-1.5 bg-black/40 p-1.5 rounded-[22px] border border-white/5">
                        {['SUB', 'BASS', 'MID', 'TREBLE'].map(band => (
                            <button key={band} onClick={() => updateFrequencyBand(selectedEffectIndex, band as any)} className={`py-3 rounded-xl text-[9px] font-bold uppercase transition-all border ${effect.frequencyBand === band ? 'bg-primary/10 text-primary border-primary/40 shadow-[inset_0_0_12px_rgba(59,130,246,0.1)]' : 'text-white/60 hover:text-white border-transparent'}`}>{band}</button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EffectParams;
