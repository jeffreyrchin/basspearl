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
                {selectedEffect.type === 'IMAGE' && (
                    <div className="py-3 flex flex-col">
                        {/* Image Upload Zone */}
                        <div
                            className={`relative w-full h-32 rounded-xl transition-all flex flex-col items-center justify-center overflow-hidden cursor-pointer group bg-white/5 hover:bg-[#22D3EE]/5 data-[dragover=true]:bg-[#22D3EE]/10`}
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.currentTarget.setAttribute('data-dragover', 'true');
                            }}
                            onDragLeave={(e) => {
                                e.preventDefault();
                                e.currentTarget.removeAttribute('data-dragover');
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.removeAttribute('data-dragover');
                                const file = e.dataTransfer.files?.[0];
                                if (file && file.type.startsWith('image/')) {
                                    const url = URL.createObjectURL(file);
                                    setEffectAssetUrl(selectedEffect.id, url, file.name);
                                }
                            }}
                        >
                            {/* SVG Dashed Border for Cross-Browser Consistency */}
                            {!selectedEffect.assetUrl && (
                                <svg
                                    className="absolute inset-0 w-full h-full pointer-events-none rounded-xl"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <rect
                                        width="100%"
                                        height="100%"
                                        rx="12" /* Should match rounded-xl (12px) */
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        strokeDasharray="4 2"
                                        className="text-white/20 transition-colors group-hover:text-[#22D3EE]/80 group-data-[dragover=true]:text-[#22D3EE]"
                                    />
                                </svg>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                title="Upload Image"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, selectedEffect.id)}
                                className="sr-only"
                            />

                            {selectedEffect.assetUrl ? (
                                <>
                                    <img src={selectedEffect.assetUrl} alt={selectedEffect.assetName} className="absolute inset-0 w-full h-full object-contain group-hover:opacity-40 group-data-[dragover=true]:opacity-40 transition-opacity" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-data-[dragover=true]:opacity-100 transition-opacity bg-black/40">
                                        <span className="material-symbols-outlined text-white !text-3xl">add_photo_alternate</span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEffectAssetUrl(selectedEffect.id, undefined, undefined);
                                        }}
                                        className="absolute top-2 right-2 w-7 h-7 bg-red-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors"
                                        title="Remove Image"
                                    >
                                        <span className="material-symbols-outlined !text-[20px]">delete</span>
                                    </button>
                                    <div className="absolute inset-0 rounded-xl border-2 border-white/10 group-hover:border-[#22D3EE]/80 group-data-[dragover=true]:border-[#22D3EE] transition-colors pointer-events-none" />
                                </>
                            ) : (
                                <div className="z-10 flex flex-col items-center gap-2 text-white/60 group-hover:text-[#22D3EE] group-data-[dragover=true]:text-[#22D3EE] transition-colors pointer-events-none">
                                    <span className="material-symbols-outlined !text-3xl shrink-0">add_photo_alternate</span>
                                    <span className="text-xs font-medium text-center px-4">Click or drag image here</span>
                                </div>
                            )}
                        </div>

                        {/* Image File Name */}
                        {selectedEffect.assetName && (
                            <div className="mt-2 text-center text-[10px] text-white/60 truncate w-full px-2">
                                {selectedEffect.assetName}
                            </div>
                        )}
                    </div>
                )}
                {EFFECT_METADATA[selectedEffect.type]?.params?.map((paramMeta, paramIdx) => {
                    const param = selectedEffect.params[paramIdx];
                    return (
                        <div key={paramIdx} className="py-2 flex flex-col">
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
