import React, { useState } from 'react';
import { EffectConfig } from '../types';
import { EFFECT_METADATA } from '../constants';
import { EffectSlider } from './EffectSlider';

interface SidebarNavigationProps {
    effects: EffectConfig[];
    setEffects: React.Dispatch<React.SetStateAction<EffectConfig[]>>;
    selectedEffectIndex: number;
    setSelectedEffectIndex: React.Dispatch<React.SetStateAction<number>>;
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
    effects,
    setEffects,
    selectedEffectIndex,
    setSelectedEffectIndex,
}) => {
    const [view, setView] = useState<'rack' | 'params'>('rack');

    if (view === 'params') {
        const effect = effects[selectedEffectIndex];
        return (
            <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-black/20">
                    <button
                        onClick={() => setView('rack')}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                    </button>
                    <label className="text-[10px] font-bold text-white uppercase tracking-[0.4em]">Parameters</label>
                </div>

                <div
                    key={`params-${selectedEffectIndex}`}
                    className="flex-1 overflow-y-auto custom-scrollbar p-6"
                >
                    {(() => {
                        if (!effect) return (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 pt-12">
                                <span className="material-symbols-outlined text-white/5 text-5xl">tune</span>
                                <p className="text-[10px] font-bold text-white/15 uppercase tracking-[0.2em] leading-relaxed">Select a processor module<br />to begin calibration</p>
                            </div>
                        );
                        return (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="flex items-center justify-between border-b border-white/5 pb-8">
                                    <div className="space-y-1.5">
                                        <h3 className="text-primary text-[11px] font-bold uppercase tracking-[0.3em]">{EFFECT_METADATA[effect.type]?.label}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className={`w-1 h-1 rounded-full ${effect.active ? 'bg-green-500' : 'bg-white/10'}`} />
                                            <p className="text-[8px] text-white/50 uppercase tracking-widest">{effect.active ? 'Active' : 'Inactive'}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setEffects(prev => prev.map((e, idx) =>
                                                idx === selectedEffectIndex ? { ...e, active: !e.active } : e
                                            ));
                                        }}
                                        className={`w-12 h-6 rounded-full transition-all duration-300 relative border ${effect.active ? 'bg-primary/20 border-primary/40 shadow-[inset_0_0_10px_rgba(59,130,246,0.2)]' : 'bg-white/10 border-transparent'}`}
                                    >
                                        <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white transition-all duration-300 ${effect.active ? 'left-7' : 'left-1'} shadow-md`} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {/* Intensity Settings */}
                                    <div className="space-y-6 bg-white/[0.03] p-5 rounded-2xl border border-white/5">
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-bold uppercase tracking-widest text-white/40">
                                                    {effect.reactiveIntensity ? `Peak ${EFFECT_METADATA[effect.type]?.intensityLabel || 'Intensity'}` : (EFFECT_METADATA[effect.type]?.intensityLabel || 'Intensity')}
                                                </label>
                                                <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/5 w-fit">
                                                    <button
                                                        onClick={() => {
                                                            setEffects(prev => prev.map((e, idx) =>
                                                                idx === selectedEffectIndex ? { ...e, reactiveIntensity: false } : e
                                                            ));
                                                        }}
                                                        className={`px-3 py-2 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all ${!effect.reactiveIntensity ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
                                                    >
                                                        Manual
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEffects(prev => prev.map((e, idx) =>
                                                                idx === selectedEffectIndex ? { ...e, reactiveIntensity: true } : e
                                                            ));
                                                        }}
                                                        className={`px-3 py-2 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all ${effect.reactiveIntensity ? 'bg-primary/10 text-primary border border-primary/40 shadow-[inset_0_0_12px_rgba(59,130,246,0.1)]' : 'text-white/60 hover:text-white border border-transparent'}`}
                                                    >
                                                        Sync
                                                    </button>
                                                </div>
                                            </div>
                                            <span className="font-mono text-xs font-bold text-white px-2 py-1">{Math.round(effect.reactiveIntensity ? (effect.maxIntensity ?? 100) : effect.intensity)}%</span>
                                        </div>
                                        <EffectSlider
                                            value={effect.reactiveIntensity ? (effect.maxIntensity ?? 100) : effect.intensity}
                                            onChange={(val) => {
                                                setEffects(prev => prev.map((e, idx) => {
                                                    if (idx === selectedEffectIndex) {
                                                        return e.reactiveIntensity ? { ...e, maxIntensity: val } : { ...e, intensity: val };
                                                    }
                                                    return e;
                                                }));
                                            }}
                                            onCommit={() => { }}
                                        />
                                    </div>

                                    {/* Threshold Settings */}
                                    <div className="space-y-6 bg-white/[0.03] p-5 rounded-2xl border border-white/5">
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-bold uppercase tracking-widest text-white/40">
                                                    {effect.reactiveThreshold ? `Peak ${EFFECT_METADATA[effect.type]?.thresholdLabel || 'Threshold'}` : (EFFECT_METADATA[effect.type]?.thresholdLabel || 'Threshold')}
                                                </label>
                                                <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/5 w-fit">
                                                    <button
                                                        onClick={() => {
                                                            setEffects(prev => prev.map((e, idx) =>
                                                                idx === selectedEffectIndex ? { ...e, reactiveThreshold: false } : e
                                                            ));
                                                        }}
                                                        className={`px-3 py-2 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all ${!effect.reactiveThreshold ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
                                                    >
                                                        Manual
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEffects(prev => prev.map((e, idx) =>
                                                                idx === selectedEffectIndex ? { ...e, reactiveThreshold: true } : e
                                                            ));
                                                        }}
                                                        className={`px-3 py-2 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all ${effect.reactiveThreshold ? 'bg-primary/10 text-primary border border-primary/40 shadow-[inset_0_0_12px_rgba(59,130,246,0.1)]' : 'text-white/60 hover:text-white border border-transparent'}`}
                                                    >
                                                        Sync
                                                    </button>
                                                </div>
                                            </div>
                                            <span className="font-mono text-xs font-bold text-white px-2 py-1">{Math.round(effect.reactiveThreshold ? (effect.maxThreshold ?? 100) : effect.threshold)}%</span>
                                        </div>
                                        <EffectSlider
                                            value={effect.reactiveThreshold ? (effect.maxThreshold ?? 100) : effect.threshold}
                                            onChange={(val) => {
                                                setEffects(prev => prev.map((e, idx) => {
                                                    if (idx === selectedEffectIndex) {
                                                        return e.reactiveThreshold ? { ...e, maxThreshold: val } : { ...e, threshold: val };
                                                    }
                                                    return e;
                                                }));
                                            }}
                                            onCommit={() => { }}
                                        />
                                    </div>

                                    {/* Frequency Bands */}
                                    <div className="space-y-4 bg-white/[0.03] p-5 rounded-2xl border border-white/5">
                                        <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">Frequency Target</label>
                                        <div className="grid grid-cols-4 gap-1.5 bg-black/40 p-1.5 rounded-[22px] border border-white/5">
                                            {['BASS', 'MID', 'TREBLE', 'ENERGY'].map(band => (
                                                <button key={band} onClick={() => {
                                                    setEffects(prev => prev.map((e, idx) =>
                                                        idx === selectedEffectIndex ? { ...e, frequencyBand: band as any } : e
                                                    ));
                                                }} className={`py-3 rounded-xl text-[9px] font-bold uppercase transition-all border ${effect.frequencyBand === band ? 'bg-primary/10 text-primary border-primary/40 shadow-[inset_0_0_12px_rgba(59,130,246,0.1)]' : 'text-white/60 hover:text-white border-transparent'}`}>{band}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
                <label className="text-[10px] font-bold text-white uppercase tracking-[0.4em]">Effects</label>
            </div>

            <div
                key="rack-scroll"
                className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-black/10"
            >
                <div className="grid grid-cols-3 gap-3">
                    {effects.map((effect, idx) => (
                        <div
                            key={effect.type}
                            className={`w-full aspect-square relative group rounded-[20px] border transition-all duration-300 overflow-hidden ${effect.active ? 'bg-primary/10 border-primary/40 shadow-[inset_0_0_12px_rgba(59,130,246,0.1)]' : 'bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.03]'}`}
                        >
                            {/* Main Navigation Area */}
                            <button
                                onClick={() => {
                                    setSelectedEffectIndex(idx);
                                    setView('params');
                                }}
                                className="absolute inset-0 flex flex-col items-center justify-center z-0 w-full h-full"
                            >
                                <div className={`mb-2 transition-all duration-500 ${effect.active ? 'text-primary' : 'text-white/60'}`}>
                                    <span className="material-symbols-outlined text-xl">{EFFECT_METADATA[effect.type]?.icon || 'extension'}</span>
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-1 text-center leading-tight w-full ${effect.active ? 'text-white' : 'text-white/60'}`}>
                                    {EFFECT_METADATA[effect.type]?.label}
                                </span>
                            </button>

                            {/* Quick Toggle Corner Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEffects(prev => prev.map((curr, i) =>
                                        i === idx ? { ...curr, active: !curr.active } : curr
                                    ));
                                }}
                                className={`absolute top-1 right-1 w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-300 z-10 border ${effect.active ? 'text-primary hover:bg-primary/10 hover:border-primary/40 border-transparent' : 'text-white hover:bg-white/10 hover:border-white/50 border-transparent'}`}
                                title={effect.active ? 'Deactivate' : 'Activate'}
                            >
                                <span className="material-symbols-outlined text-base">power_settings_new</span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SidebarNavigation;
