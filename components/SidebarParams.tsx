import React from 'react';
import { EFFECT_METADATA } from '../constants';
import { AdaptiveSlider } from './AdaptiveSlider';
import { FrequencyDropdown } from './FrequencyDropdown';
import { useEffectStore } from '@/store/useEffectStore';

interface SidebarParamsProps { }

/**
 * SidebarParams: A focused, high-performance container for effect parameter sliders.
 * Orchestrates the relationship between the global effect store and individual slider components.
 */
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
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header Section */}
            <div className="flex items-center justify-between pb-3">
                <h3 className="text-white text-[11px] font-bold uppercase tracking-[0.2em]">
                    {EFFECT_METADATA[effect.type]?.label}
                </h3>
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

            {/* Parameters List */}
            <div className="flex flex-col">
                {EFFECT_METADATA[effect.type]?.params?.map((paramMeta, paramIdx) => {
                    const param = effect.params[paramIdx];
                    return (
                        <div key={paramIdx} className="py-3 flex flex-col">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/80">
                                    {paramMeta.name}
                                </label>

                                <FrequencyDropdown
                                    value={param.frequencyBand}
                                    ariaLabel={`Frequency band for ${paramMeta.name}`}
                                    onChange={(band) => {
                                        commitHistory();
                                        updateParameter(effectIndex, paramIdx, { frequencyBand: band });
                                    }}
                                />
                            </div>

                            <AdaptiveSlider
                                value={param.value}
                                min={param.min}
                                frequencyBand={param.frequencyBand}
                                onPointerDown={() => commitHistory()}
                                onChange={(update) => updateParameter(effectIndex, paramIdx, update)}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SidebarParams;
