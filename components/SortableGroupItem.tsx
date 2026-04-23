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
    const pushFocus = useEffectStore(s => s.pushFocus);

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: group.id,
        disabled: isOverlay,
    });

    const style = isOverlay ? {} : {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    const isMelded = group.effects.length > 1;

    return (
        <div
            ref={isOverlay ? undefined : setNodeRef}
            style={style}
            {...(isOverlay ? {} : attributes)}
            onKeyDown={isOverlay ? undefined : (e) => onGripKeyDown(e, groupIndex)}
            tabIndex={isOverlay ? -1 : 0}
            data-sortable-group
            title="Drag to Reorder (Arrow keys for keyboard reorder)"
            className={`flex flex-row w-full overflow-hidden focus-visible:outline-none focus-visible:bg-white/10 ${isOverlay ? 'bg-white/10' : 'bg-white/5'}`}
        >
            {/* Vertical bar indicator for melded groups */}
            {isMelded && <div className="w-[3px] mx-1 my-2 rounded-full bg-indigo-400" />}

            {/* Effect Cards Wrapper */}
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
                            e.stopPropagation(); // Prevent reordering the group while navigating cards
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
                            <div
                                className={`flex items-center h-16 md:h-10 overflow-hidden
                                    ${isSelected ? 'bg-white/10' : 'hover:bg-white/5'}
                                `}
                            >
                                <button
                                    onClick={handleClick}
                                    onDoubleClick={() => pushFocus('inspector')}
                                    onMouseDown={(e) => e.preventDefault()} // Prevent browser from synthesizing a click event (prevents focus ring from appearing on shift key down)
                                    onKeyDown={handleKeyDown}
                                    data-effect-card
                                    className={`flex-1 px-3 h-full flex items-center text-left truncate text-[10px] font-bold uppercase tracking-widest outline-none focus-visible:bg-white/10 focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/20 focus-visible:rounded-md transition-colors
                                        ${effect.isActive ? 'text-white/80' : 'text-white/20'}
                                        ${isSelected ? '!text-white' : ''}
                                    `}
                                    title={`Select ${EFFECT_METADATA[effect.type]?.label}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            {...(isOverlay ? {} : listeners)}
                                            className="cursor-grab active:cursor-grabbing touch-none flex items-center"
                                        >
                                            {EFFECT_METADATA[effect.type]?.category === 'Pattern' ?
                                                <span className="material-symbols-outlined text-red-300 transition-colors">grain</span> :
                                                <span className="material-symbols-outlined text-indigo-300 transition-colors">adjust</span>}
                                        </div>
                                        {EFFECT_METADATA[effect.type]?.label}
                                    </div>
                                </button>

                                {!isOverlay && (
                                    <div className="flex h-full items-center" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => {
                                                toggleSelected(effect.id, false);
                                                pushFocus('inspector');
                                            }}
                                            className={`w-9 h-full flex items-center justify-center outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/40 focus-visible:rounded-md transition-colors text-white/60 hover:bg-white/10 hover:text-white`}
                                            title="Show Inspector (I)"
                                        >
                                            <span className="material-symbols-outlined">switches</span>
                                        </button>
                                        <button
                                            onClick={() => toggleSolo(effect.id)}
                                            className={`w-9 h-full flex items-center justify-center outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/40 focus-visible:rounded-md transition-colors ${effect.soloed ? 'bg-white text-black' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
                                            title="Toggle Solo"
                                        >
                                            <span className="material-symbols-outlined">pill</span>
                                        </button>
                                        <button
                                            onClick={() => toggleMute(effect.id)}
                                            className={`w-9 h-full flex items-center justify-center outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/40 focus-visible:rounded-md transition-colors ${effect.muted ? 'bg-indigo-500 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
                                            title="Toggle Visibility"
                                        >
                                            <span className="material-symbols-outlined">{effect.muted ? 'visibility_off' : 'visibility'}</span>
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
