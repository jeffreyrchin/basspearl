import React, { useRef } from 'react';
import { EFFECT_METADATA, MASTER_ASPECT_RATIO } from '../constants';
import { AdaptiveSlider } from './AdaptiveSlider';
import { FrequencyDropdown } from './FrequencyDropdown';
import { ColorPicker } from './ColorPicker';
import { useEffectStore } from '@/store/useEffectStore';
import { getSafeAspectRatio, shouldDecoupleScale, getLinkedScale } from '../services/transformMath';
import { calculateInitialImageScale } from '../services/canvasMath';

interface SidebarParamsProps { }

/**
 * SidebarParams: A focused, high-performance container for effect parameter sliders.
 * Orchestrates the relationship between the global effect store and individual slider components.
 */
const SidebarParams: React.FC<SidebarParamsProps> = () => {
    const updateParameter = useEffectStore(s => s.updateParameter);
    const updateEffect = useEffectStore(s => s.updateEffect);
    const updateMultipleParameters = useEffectStore(s => s.updateMultipleParameters);
    const toggleAspectLocked = useEffectStore(s => s.toggleAspectLocked);
    const commitHistory = useEffectStore(s => s.commitHistory);
    const selectedIds = useEffectStore(s => s.selectedIds);
    const effects = useEffectStore(s => s.effects);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement> | { target: { files: FileList | null, value: string } }, effectId: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);

            // 1. Create a temporary image to measure dimensions
            const img = new Image();
            img.onload = () => {
                const { scaleX: sX, scaleY: sY } = calculateInitialImageScale(img.naturalWidth, img.naturalHeight, MASTER_ASPECT_RATIO);

                // 3. Apply updates to the store
                const effect = useEffectStore.getState().effects.find(e => e.id === effectId);
                if (effect) {
                    const sxIdx = effect.params.findIndex(p => p.param === 'Scale X');
                    const syIdx = effect.params.findIndex(p => p.param === 'Scale Y');

                    if (sxIdx !== -1 && syIdx !== -1) {
                        updateMultipleParameters(effectId, [
                            { paramIndex: sxIdx, update: { value: sX } },
                            { paramIndex: syIdx, update: { value: sY } }
                        ]);
                    }
                }

                updateEffect(effectId, {
                    assetUrl: url,
                    assetName: file.name,
                    aspectLocked: true,
                    aspectRatio: img.naturalWidth / img.naturalHeight
                });
            };
            img.src = url;

            // Reset the input value so the same file can be re-uploaded if deleted
            if ('value' in e.target) e.target.value = '';
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
                                const files = e.dataTransfer.files;
                                if (files && files.length > 0 && files[0].type.startsWith('image/')) {
                                    handleImageUpload({ target: { files, value: '' } } as any, selectedEffect.id);
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
                                            updateEffect(selectedEffect.id, { assetUrl: undefined, assetName: undefined });
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
                                <div className="flex items-center gap-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white">
                                        {paramMeta.name}
                                    </label>

                                    {/* Aspect Lock Toggle: Only show next to Scale X if Scale Y exists */}
                                    {paramMeta.name === 'Scale X' && EFFECT_METADATA[selectedEffect.type].params.some(p => p.name === 'Scale Y') && (
                                        <button
                                            onClick={() => toggleAspectLocked(selectedEffect.id)}
                                            className={`flex items-center justify-center p-1 rounded-md transition-all ${selectedEffect.aspectLocked ? 'text-[#22D3EE] bg-[#22D3EE]/10' : 'text-white/60 hover:text-white/80'}`}
                                            title={selectedEffect.aspectLocked ? 'Unlock Aspect Ratio' : 'Lock Aspect Ratio'}
                                        >
                                            <span className="material-symbols-outlined !text-[14px]">
                                                {selectedEffect.aspectLocked ? 'link' : 'link_off'}
                                            </span>
                                        </button>
                                    )}
                                </div>

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
                                onChange={(update) => {
                                    if (selectedEffect.aspectLocked && (update.value !== undefined || update.min !== undefined)) {
                                        const sxIdx = EFFECT_METADATA[selectedEffect.type].params.findIndex(p => p.name === 'Scale X');
                                        const syIdx = EFFECT_METADATA[selectedEffect.type].params.findIndex(p => p.name === 'Scale Y');

                                        if (sxIdx !== -1 && syIdx !== -1) {
                                            const currentX = selectedEffect.params[sxIdx].value;
                                            const currentY = selectedEffect.params[syIdx].value;

                                            const isDraggingX = paramIdx === sxIdx;
                                            const shouldSync = !shouldDecoupleScale(currentX, currentY, isDraggingX);
                                            const ratio = getSafeAspectRatio(currentX, currentY, selectedEffect.aspectRatio);

                                            if (isDraggingX) {
                                                const multiUpdate: any[] = [{ paramIndex: sxIdx, update }];
                                                if (shouldSync) {
                                                    if (update.value !== undefined) multiUpdate.push({ paramIndex: syIdx, update: { value: getLinkedScale(update.value, ratio, true) } });
                                                    if (update.min !== undefined) multiUpdate.push({ paramIndex: syIdx, update: { min: getLinkedScale(update.min, ratio, true) } });
                                                }
                                                updateMultipleParameters(selectedEffect.id, multiUpdate);
                                                return;
                                            } else {
                                                const multiUpdate: any[] = [{ paramIndex: syIdx, update }];
                                                if (shouldSync) {
                                                    if (update.value !== undefined) multiUpdate.push({ paramIndex: sxIdx, update: { value: getLinkedScale(update.value, ratio, false) } });
                                                    if (update.min !== undefined) multiUpdate.push({ paramIndex: sxIdx, update: { min: getLinkedScale(update.min, ratio, false) } });
                                                }
                                                updateMultipleParameters(selectedEffect.id, multiUpdate);
                                                return;
                                            }
                                        }
                                    }
                                    updateParameter(selectedEffect.id, paramIdx, update);
                                }}
                                effectId={selectedEffect.id}
                                paramIdx={paramIdx}
                                getAdditionalOverrides={(val, isMin) => {
                                    if (!selectedEffect.aspectLocked) return [];
                                    const sxIdx = EFFECT_METADATA[selectedEffect.type].params.findIndex(p => p.name === 'Scale X');
                                    const syIdx = EFFECT_METADATA[selectedEffect.type].params.findIndex(p => p.name === 'Scale Y');
                                    if (sxIdx === -1 || syIdx === -1) return [];

                                    const currentX = selectedEffect.params[sxIdx].value;
                                    const currentY = selectedEffect.params[syIdx].value;

                                    const isDraggingX = paramIdx === sxIdx;
                                    if (shouldDecoupleScale(currentX, currentY, isDraggingX)) return [];

                                    const ratio = getSafeAspectRatio(currentX, currentY, selectedEffect.aspectRatio);

                                    if (isDraggingX) {
                                        return [{
                                            index: syIdx,
                                            [isMin ? 'min' : 'value']: getLinkedScale(val, ratio, true)
                                        }];
                                    } else {
                                        return [{
                                            index: sxIdx,
                                            [isMin ? 'min' : 'value']: getLinkedScale(val, ratio, false)
                                        }];
                                    }
                                }}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SidebarParams;
