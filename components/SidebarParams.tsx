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
const SidebarParams: React.FC<SidebarParamsProps> = () => {
    const updateParameter = useEffectStore(s => s.updateParameter);
    const commitHistory = useEffectStore(s => s.commitHistory);
    const selectedIds = useEffectStore(s => s.selectedIds);
    const effects = useEffectStore(s => s.effects);

    if (selectedIds.size > 1) {
        return <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <span className="material-symbols-outlined text-white/60 text-5xl">tune</span>
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em] leading-relaxed">Multiple effects selected</p>
        </div>
    }

    if (selectedIds.size === 0) {
        return <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <span className="material-symbols-outlined text-white/60 text-5xl">tune</span>
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em] leading-relaxed">No effect selected</p>
        </div>
    }

    const selectedEffectId = selectedIds.values().next().value;
    const selectedEffect = effects.find(e => e.id === selectedEffectId);

    if (!selectedEffect) {
        return <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <span className="material-symbols-outlined text-white/60 text-5xl">tune</span>
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em] leading-relaxed">No effect selected</p>
        </div>
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Parameters List */}
            <div className="flex flex-col">
                {EFFECT_METADATA[selectedEffect.type]?.params?.map((paramMeta, paramIdx) => {
                    const param = selectedEffect.params[paramIdx];
                    return (
                        <div key={paramIdx} className="py-3 flex flex-col">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/80">
                                    {paramMeta.name}
                                </label>

                                <FrequencyDropdown
                                    id={`${selectedEffect.id}-${paramIdx}`}
                                    value={param.frequencyBand}
                                    ariaLabel={`Frequency band for ${paramMeta.name}`}
                                    onChange={(band) => {
                                        commitHistory();
                                        updateParameter(selectedEffect.id, paramIdx, { frequencyBand: band });
                                    }}
                                />
                            </div>

                            <AdaptiveSlider
                                value={param.value}
                                min={param.min}
                                frequencyBand={param.frequencyBand}
                                onPointerDown={() => commitHistory()}
                                onChange={(update) => updateParameter(selectedEffect.id, paramIdx, update)}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SidebarParams;
