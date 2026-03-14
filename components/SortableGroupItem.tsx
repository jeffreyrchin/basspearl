import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EFFECT_METADATA } from '../constants';
import { useEffectStore } from '../store/useEffectStore';

interface SortableGroupItemProps {
    key?: React.Key;
    group: any;
    groupIndex: number;
    onGripKeyDown: (e: React.KeyboardEvent, index: number) => void;
    isOverlay?: boolean;
}

const SortableGroupItem = ({
    group,
    groupIndex,
    onGripKeyDown,
    isOverlay = false,
}: SortableGroupItemProps) => {
    const toggleMute = useEffectStore(s => s.toggleMute);
    const toggleSolo = useEffectStore(s => s.toggleSolo);
    const selectedIds = useEffectStore(s => s.selectedIds);
    const toggleSelected = useEffectStore(s => s.toggleSelected);
    const selectRange = useEffectStore(s => s.selectRange);
    const isInSelectMode = useEffectStore(s => s.isInSelectMode);

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
                onClick={(e) => e.stopPropagation()}
                className="group w-8 flex-shrink-0 flex flex-col items-center justify-center hover:bg-white/10 focus-visible:bg-primary/20 focus-visible:border-primary/50 outline-none rounded-l-md touch-none transition-colors cursor-grab active:cursor-grabbing"
                title="Drag to Reorder"
            >
                <span className="material-symbols-outlined text-white/60 group-hover:text-white transition-colors text-[18px]">drag_indicator</span>
            </button>

            {/* Effect Cards */}
            <div className="flex-1 flex flex-col">
                {group.effects.map((effect: any, idx: number) => {
                    const isSelected = !isOverlay && selectedIds.has(effect.id);

                    // Click Selection Handler for Effects: Click, Shift+Click (Range), and Cmd+Click (Non-Contiguous Selection and Deselection)
                    const handleClick = (e: React.MouseEvent) => {
                        if (isOverlay) return;
                        e.stopPropagation(); // Prevent bubbling to the "void" click handler
                        if (e.shiftKey) {
                            selectRange(effect.id);
                        } else {
                            toggleSelected(effect.id, isInSelectMode || e.metaKey || e.ctrlKey);
                        }
                    };

                    // Keyboard Navigation and Selection Handler for Effects: Arrow Up/Down Navigation, Space/Enter, Shift+Space/Enter (Range), and Ctrl+Space/Enter (Non-Contiguous Selection and Deselection)
                    const handleKeyDown = (e: React.KeyboardEvent) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                            e.preventDefault(); // Prevent page scrolling
                            // Retrieve all cards in their current DOM order
                            const cards = Array.from(document.querySelectorAll('[data-effect-card]')) as HTMLElement[];
                            const currentIndex = cards.indexOf(e.currentTarget as HTMLElement);
                            if (currentIndex === -1) return;

                            const nextIndex = e.key === 'ArrowDown'
                                ? Math.min(currentIndex + 1, cards.length - 1)
                                : Math.max(currentIndex - 1, 0);

                            cards[nextIndex]?.focus();
                        } else if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault(); // Prevent browser from synthesizing a click event
                            e.stopPropagation(); // Prevent bubbling to the "void" click handler
                            if (isOverlay) return;

                            if (e.shiftKey) {
                                selectRange(effect.id);
                            } else {
                                toggleSelected(effect.id, isInSelectMode || e.metaKey || e.ctrlKey);
                            }
                        }
                    };

                    return (
                        <div key={effect.id} className="flex flex-col w-full">
                            {/* Subtle separator line between melded effects */}
                            {idx > 0 && (
                                <div className="h-[1px] mx-3 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            )}

                            <div
                                className={`flex items-center h-16 md:h-10 overflow-hidden
                                    ${isSelected ? 'bg-white/10' : 'hover:bg-white/[0.04]'}
                                `}
                            >
                                <button
                                    onClick={handleClick}
                                    onMouseDown={(e) => e.preventDefault()} // Prevent browser from synthesizing a click event (prevents focus ring from appearing on shift key down)
                                    onKeyDown={handleKeyDown}
                                    data-effect-card
                                    className={`flex-1 px-3 h-full flex items-center text-left truncate text-[10px] font-bold uppercase tracking-widest outline-none focus-visible:bg-white/10 focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/20 transition-colors
                                        ${effect.isActive ? 'text-white/80' : 'text-white/20'}
                                        ${isSelected ? '!text-white' : ''}
                                    `}
                                    title={`Select ${EFFECT_METADATA[effect.type]?.label}`}
                                >
                                    {EFFECT_METADATA[effect.type]?.label}
                                </button>

                                {!isOverlay && (
                                    <div className="flex h-full items-center" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => toggleSolo(effect.id)}
                                            className={`w-9 h-full flex items-center justify-center outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/20 transition-colors ${effect.soloed ? 'bg-white text-black' : 'text-white/30 hover:bg-white/10 hover:text-white'}`}
                                            title="Toggle Solo"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">egg</span>
                                        </button>
                                        <div className="w-[1px] h-8 md:h-5 bg-white/10"></div>
                                        <button
                                            onClick={() => toggleMute(effect.id)}
                                            className={`w-9 h-full flex items-center justify-center outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/20 transition-colors rounded-r-md ${effect.muted ? 'bg-cyan-900 text-white' : 'text-white/30 hover:bg-white/10 hover:text-white'}`}
                                            title="Toggle Visibility"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">{effect.muted ? 'visibility_off' : 'visibility'}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SortableGroupItem;
