import React, { useRef } from 'react';
import { EFFECT_METADATA } from '../constants';
import { AdaptiveSlider } from './AdaptiveSlider';
import { FrequencyDropdown } from './FrequencyDropdown';
import { ColorPicker } from './ColorPicker';
import { useEffectStore } from '@/store/useEffectStore';

interface SidebarParamsProps { }

/**
 * SidebarParams: A focused, high-performance container for effect parameter sliders.
 * Orchestrates the relationship between the global effect store and individual slider components.
 */
const SidebarParams: React.FC<SidebarParamsProps> = () => {
    const updateParameter = useEffectStore(s => s.updateParameter);
    const updateMultipleParameters = useEffectStore(s => s.updateMultipleParameters);
    const setEffectAssetUrl = useEffectStore(s => s.setEffectAssetUrl);
    const commitHistory = useEffectStore(s => s.commitHistory);
    const selectedIds = useEffectStore(s => s.selectedIds);
    const effects = useEffectStore(s => s.effects);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, effectId: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setEffectAssetUrl(effectId, url, file.name);
            // Reset the input value so the same file can be re-uploaded if deleted
            e.target.value = '';
        }
    };

    const NoEffectSelected = () => (
        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <span className="material-symbols-outlined text-white/80 text-5xl">info</span>
            <p className="text-[10px] font-bold text-white/80 uppercase tracking-[0.15em] leading-relaxed">No effect selected</p>
        </div>
    );

    if (selectedIds.size > 1) {
        return <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <span className="material-symbols-outlined text-white/80 text-5xl">info</span>
            <p className="text-[10px] font-bold text-white/80 uppercase tracking-[0.15em] leading-relaxed">Multiple effects selected</p>
        </div>
    }

    if (selectedIds.size === 0) {
        return <NoEffectSelected />
    }

    const selectedEffectId = selectedIds.values().next().value;
    const selectedEffect = effects.find(e => e.id === selectedEffectId);

    if (!selectedEffect) {
        return <NoEffectSelected />
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Parameters List */}
            <div className="flex flex-col">
                {selectedEffect.type === 'RGBA' && (
                    <ColorPicker
                        r={selectedEffect.params[0].value}
                        g={selectedEffect.params[1].value}
                        b={selectedEffect.params[2].value}
                        onPointerDown={() => commitHistory()}
                        onChange={(r, g, b) => {
                            updateMultipleParameters(selectedEffect.id, [
                                { paramIndex: 0, update: { value: r } },
                                { paramIndex: 1, update: { value: g } },
                                { paramIndex: 2, update: { value: b } }
                            ]);
                        }}
                        effectId={selectedEffect.id}
                    />
                )}
                {selectedEffect.type === 'IMAGE_OVERLAY' && (
                    <div className="py-3 flex flex-col">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/80 mb-2">
                            Image Overlay
                        </label>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="py-1.5 px-3 rounded-md text-xs font-semibold bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer whitespace-nowrap active:scale-95"
                            >
                                Choose File
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, selectedEffect.id)}
                                className="sr-only"
                            />

                            <div className="flex items-center justify-between w-full min-w-0">
                                <span className="text-white/80 text-xs truncate max-w-[150px]">
                                    {selectedEffect.assetName || "No file chosen"}
                                </span>

                                {selectedEffect.assetUrl && (
                                    <button
                                        onClick={() => setEffectAssetUrl(selectedEffect.id, undefined, undefined)}
                                        className="material-symbols-outlined text-white/50 hover:text-red-400 text-lg transition-colors"
                                        title="Remove Image"
                                    >
                                        close
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {EFFECT_METADATA[selectedEffect.type]?.params?.map((paramMeta, paramIdx) => {
                    const param = selectedEffect.params[paramIdx];
                    return (
                        <div key={paramIdx} className="py-3 flex flex-col">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white">
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
                                effectId={selectedEffect.id}
                                paramIdx={paramIdx}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SidebarParams;
