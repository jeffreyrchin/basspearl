import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DndContext, pointerWithin, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

import { useEffectStore } from '../store/useEffectStore';
import { getEffectGroups, reorderEffectGroups } from '@/services/pipelineUtils';
import SortableGroupItem from './SortableGroupItem';

interface SidebarPipelineProps {
    onLoadMuxels: () => void;
    onNavigateToLibrary: () => void;
}

const SidebarPipeline = ({ onLoadMuxels, onNavigateToLibrary }: SidebarPipelineProps) => {
    const effects = useEffectStore(s => s.effects);
    const setEffects = useEffectStore(s => s.setEffects);
    const selectedIds = useEffectStore(s => s.selectedIds);
    const clearSelection = useEffectStore(s => s.clearSelection);
    const selectAll = useEffectStore(s => s.selectAll);
    const batchRemove = useEffectStore(s => s.batchRemove);
    const batchDuplicate = useEffectStore(s => s.batchDuplicate);
    const batchMeld = useEffectStore(s => s.batchMeld);
    const batchUnmeld = useEffectStore(s => s.batchUnmeld);
    const focusStack = useEffectStore(s => s.focusStack);
    const activeFocus = focusStack[focusStack.length - 1];
    const pushFocus = useEffectStore(s => s.pushFocus);
    const addEffectFromSidebar = useEffectStore(s => s.addEffectFromSidebar);

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const [activeId, setActiveId] = useState<string | null>(null);

    const { effectGroups, itemIds } = useMemo(() => {
        const groups = getEffectGroups(effects);
        return { effectGroups: groups, itemIds: groups.map(g => g.id) };
    }, [effects]);

    const activeGroup = useMemo(() =>
        effectGroups.find(g => g.id === activeId),
        [effectGroups, activeId]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 1 } })
    );

    const handleGripKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const direction = e.key === 'ArrowUp' ? -1 : 1;
            const newIndex = index + direction;

            if (newIndex >= 0 && newIndex < effectGroups.length) {
                const newEffects = reorderEffectGroups(effects, index, newIndex);
                setEffects(newEffects);

                // Restore focus to the same item in its new position
                setTimeout(() => {
                    const groups = document.querySelectorAll('[data-sortable-group]');
                    (groups[newIndex] as HTMLElement)?.focus();
                }, 0);
            }
        }
    }, [effects, effectGroups, setEffects]);

    const onDragStart = useCallback((event: any) => {
        setActiveId(event.active.id);
    }, []);

    const onDragEnd = useCallback((event: any) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const activeIdx = effectGroups.findIndex(g => g.id === active.id);
            const overIdx = effectGroups.findIndex(g => g.id === over.id);

            if (activeIdx !== -1 && overIdx !== -1) {
                setEffects(reorderEffectGroups(effects, activeIdx, overIdx));
            }
        }

        setActiveId(null);
    }, [effects, effectGroups, setEffects]);

    // Logic Ref for Keyboard Shortcuts (Prevents stale closures for selection/dropdowns)
    const handleKeyDownRef = useRef<(e: KeyboardEvent) => void>(() => { });

    useEffect(() => {
        handleKeyDownRef.current = (e: KeyboardEvent) => {
            const isMod = e.metaKey || e.ctrlKey;
            const key = e.key.toLowerCase();
            const target = e.target as HTMLElement;
            const isTyping = target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable;

            const isModalOpen = document.querySelector('[data-section="modal"]');

            if (isTyping || activeFocus !== 'pipeline' || isModalOpen) return;

            // Select All - Ctrl/Cmd + A
            if (isMod && key === 'a') {
                e.preventDefault();
                selectAll();
                return;
            }

            // Add Image - O
            if (key === 'o') {
                e.preventDefault();
                addEffectFromSidebar('IMAGE');
            }

            // Add Color - C
            else if (key === 'c') {
                e.preventDefault();
                addEffectFromSidebar('RGBA');
            }

            if (selectedIds.size === 0) return;

            // Delete selected effects - Backspace or Delete
            if (e.key === 'Backspace' || e.key === 'Delete') {
                e.preventDefault();
                batchRemove();
            }

            // Clear selection - Escape
            else if (e.key === 'Escape') {
                clearSelection();
            }

            // Duplicate selected effects - Ctrl/Cmd + D
            else if (isMod && key === 'd') {
                e.preventDefault();
                batchDuplicate();
            }

            // Ungroup selected effects - Ctrl/Cmd + Shift + G
            // We check this BEFORE the group shortcut so the Shift modifier is caught correctly
            else if (isMod && e.shiftKey && key === 'g') {
                e.preventDefault();
                batchUnmeld();
            }

            // Group selected effects - Ctrl/Cmd + G
            else if (isMod && key === 'g') {
                e.preventDefault();
                batchMeld();
            }
        };
    }); // Update logic on every render

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            handleKeyDownRef.current(e);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []); // Listener is attached once

    const pipelineCard = (icon: string, label: string, onClick: () => void) => (
        <button
            onClick={onClick}
            className="group relative py-4 flex flex-col items-center justify-center rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-1 active:scale-[0.9] overflow-hidden"
        >
            <span className={`material-symbols-outlined text-white transition-all duration-300 group-hover:scale-110 mb-3 z-10`}>
                {icon}
            </span>

            <div className="flex flex-col items-center z-10">
                <span className="text-[11px] font-bold text-white/90 uppercase tracking-[0.15em] group-hover:text-white transition-colors">
                    {label}
                </span>
            </div>
        </button>
    )

    if (effects.length === 0) {
        return (
            <div className="py-3 px-6 flex flex-col gap-4 select-none">
                {pipelineCard('add_circle', 'Add Visuals', onNavigateToLibrary)}
                {pipelineCard('upload_file', 'Import .muxels', onLoadMuxels)}
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            modifiers={[restrictToVerticalAxis]}
        >
            <div
                className="pb-24 flex flex-col min-h-full cursor-default"
                onClick={() => {
                    pushFocus('pipeline');
                    clearSelection();
                }}
            >
                <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                    {effectGroups.map((group, i) => (
                        <SortableGroupItem
                            key={group.id}
                            group={group}
                            groupIndex={i}
                            onGripKeyDown={handleGripKeyDown}
                        />
                    ))}
                </SortableContext>
            </div>

            {mounted && createPortal(
                <DragOverlay adjustScale={false} dropAnimation={null}>
                    {activeGroup ? (
                        <SortableGroupItem
                            group={activeGroup}
                            groupIndex={-1}
                            onGripKeyDown={() => { }}
                            isOverlay
                        />
                    ) : null}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
};

export default SidebarPipeline;
