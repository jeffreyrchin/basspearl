import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EFFECT_METADATA } from '../constants';
import { useEffectStore } from '../store/useEffectStore';

interface SortableGroupItemProps {
    key?: React.Key;
    group: any;
    groupIndex: number;
    isLastGroup: boolean;
    onGripKeyDown: (e: React.KeyboardEvent, index: number) => void;
    onSelectEffect: () => void;
    isOverlay?: boolean;
}

const SortableGroupItem = ({
    group,
    groupIndex,
    isLastGroup,
    onGripKeyDown,
    onSelectEffect,
    isOverlay = false,
}: SortableGroupItemProps) => {
    const toggleMute = useEffectStore(s => s.toggleMute);
    const toggleSolo = useEffectStore(s => s.toggleSolo);
    const toggleMeld = useEffectStore(s => s.toggleMeld);
    const removeEffect = useEffectStore(s => s.removeEffect);
    const setSelectedEffectId = useEffectStore(s => s.setSelectedEffectId);
    const isDraggingAny = useEffectStore(s => s.isDraggingAny);

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: group.id,
        disabled: isOverlay,
    });

    const style = isOverlay ? {} : {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div
            ref={isOverlay ? undefined : setNodeRef}
            style={style}
            className={`flex flex-row w-full border border-white/10 rounded-md ${isOverlay ? 'bg-black shadow-2xl ring-1 ring-white/20' : 'bg-white/5'}`}
        >
            {/* Grip Handle */}
            <button
                {...(isOverlay ? {} : { ...attributes, ...listeners })}
                onKeyDown={isOverlay ? undefined : (e) => onGripKeyDown(e, groupIndex)}
                className="group w-8 flex-shrink-0 flex flex-col items-center justify-center hover:bg-white/10 focus-visible:bg-primary/20 focus-visible:border-primary/50 outline-none rounded-l-md touch-none transition-colors cursor-grab active:cursor-grabbing"
                title="Drag to reorder"
            >
                <span className="material-symbols-outlined text-white/60 group-hover:text-white transition-colors text-[18px]">drag_indicator</span>
            </button>

            {/* Effect Cards */}
            <div className={`flex-1 flex flex-col`}>
                {group.effects.map((effect: any, idx: number) => {
                    const isLastInGroup = idx === group.effects.length - 1;
                    const showMeld = !isOverlay && !isDraggingAny && !(isLastGroup && isLastInGroup);

                    const handleSelect = () => {
                        if (isOverlay) return;
                        setSelectedEffectId(effect.id);
                        onSelectEffect();
                    };

                    return (
                        <div key={effect.id} className="flex flex-col w-full">
                            <div className={`flex items-center h-16 md:h-10 overflow-hidden ${effect.melded ? 'border-b-0' : ''}`}>
                                <button
                                    onClick={handleSelect}
                                    className={`flex-1 px-3 h-full transition-colors text-left truncate text-[10px] font-bold uppercase tracking-widest ${effect.isActive ? 'text-white/60 hover:text-white' : 'text-white/20'}`}
                                >
                                    {EFFECT_METADATA[effect.type]?.label}
                                </button>

                                {!isOverlay && (
                                    <div className="flex h-full">
                                        <button onClick={() => toggleSolo(effect.actualIndex)} className={`w-10 md:w-8 h-full font-mono text-[12px] ${effect.soloed ? 'bg-white text-black' : 'text-white/60 transition-colors hover:bg-white/10 hover:text-white'}`} title="Solo">S</button>
                                        <button onClick={() => toggleMute(effect.actualIndex)} className={`w-10 md:w-8 h-full font-mono text-[12px] ${effect.muted ? 'bg-cyan-900 text-white' : 'text-white/60 transition-colors hover:bg-white/10 hover:text-white'}`} title="Mute">M</button>
                                        <button onClick={() => removeEffect(effect.actualIndex)} className="w-10 md:w-8 h-full flex items-center justify-center rounded-r-md text-white/60 transition-colors hover:text-red-400 hover:bg-red-400/20" title="Remove">
                                            <span className="material-symbols-outlined text-[18px]">close</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Meld Button */}
                            {showMeld && (
                                <div className={`relative h-0 flex items-center justify-center z-20 group/meld ${effect.melded ? 'translate-y-0' : 'translate-y-[5px]'}`}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleMeld(effect.actualIndex); }}
                                        className="w-full h-4 flex items-center px-4"
                                        title={effect.melded ? 'Unmeld' : 'Meld'}
                                    >
                                        {/* Left Line Segment */}
                                        <div className={`flex-1 h-[1px] transition-all duration-300 ${effect.melded ? 'bg-gradient-to-r from-transparent via-white/10 to-white/20' : 'bg-gradient-to-r from-transparent via-white/5 to-white/10 group-hover/meld:via-white/10 group-hover/meld:to-white/20'}`} />

                                        {/* The Join Node */}
                                        <div className={`flex shrink-0 items-center justify-center mx-2 transition-all duration-300 scale-110 group-hover/meld:scale-120 md:scale-90 md:group-hover/meld:scale-100 ${effect.melded ? 'text-white' : 'text-white/60 group-hover/meld:text-white'}`}>
                                            <span className="material-symbols-outlined shrink-0" style={{ fontSize: '30px', fontVariationSettings: 'wght 300' }}>
                                                {effect.melded ? 'commit' : 'arrow_drop_up'}
                                            </span>
                                        </div>

                                        {/* Right Line Segment */}
                                        <div className={`flex-1 h-[1px] transition-all duration-300 ${effect.melded ? 'bg-gradient-to-l from-transparent via-white/10 to-white/20' : 'bg-gradient-to-l from-transparent via-white/5 to-white/10 group-hover/meld:via-white/10 group-hover/meld:to-white/20'}`} />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SortableGroupItem;
