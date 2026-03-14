import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DndContext, pointerWithin, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

import { useEffectStore } from '../store/useEffectStore';
import { getEffectGroups, reorderEffectGroups } from '@/services/pipelineUtils';
import SortableGroupItem from './SortableGroupItem';

interface SidebarPipelineProps {
    onNavigateToLibrary: () => void;
}

const SidebarPipeline = ({ onNavigateToLibrary }: SidebarPipelineProps) => {
    const effects = useEffectStore(s => s.effects);
    const setEffects = useEffectStore(s => s.setEffects);
    const commitHistory = useEffectStore(s => s.commitHistory);
    const selectedIds = useEffectStore(s => s.selectedIds);
    const clearSelection = useEffectStore(s => s.clearSelection);
    const selectAll = useEffectStore(s => s.selectAll);
    const batchRemove = useEffectStore(s => s.batchRemove);
    const batchDuplicate = useEffectStore(s => s.batchDuplicate);
    const batchMeld = useEffectStore(s => s.batchMeld);
    const batchUnmeld = useEffectStore(s => s.batchUnmeld);

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
                commitHistory();
                const newEffects = reorderEffectGroups(effects, index, newIndex);
                setEffects(newEffects);

                // Restore focus to the same item in its new position
                setTimeout(() => {
                    const buttons = document.querySelectorAll('[title="Drag to Reorder"]');
                    (buttons[newIndex] as HTMLElement)?.focus();
                }, 0);
            }
        }
    }, [effects, effectGroups, setEffects, commitHistory]);

    const onDragStart = useCallback((event: any) => {
        commitHistory();
        setActiveId(event.active.id);
    }, [commitHistory]);

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

    // Keyboard shortcuts for pipeline actions
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isMod = e.metaKey || e.ctrlKey;
            const key = e.key.toLowerCase();

            // Select All - Ctrl/Cmd + A (always allow if sidebar is likely focused)
            if (isMod && key === 'a') {
                e.preventDefault();
                selectAll();
                return;
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
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIds, batchRemove, clearSelection, selectAll, batchDuplicate, batchMeld, batchUnmeld]);

    if (effects.length === 0) {
        return (
            <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                <span className="material-symbols-outlined text-white/30 text-5xl mb-4">layers_clear</span>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em] leading-relaxed">No active effects</p>
                <button onClick={onNavigateToLibrary} className="mt-6 px-4 py-2 rounded-full border border-white/10 text-[9px] font-bold text-white/60 uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all">Browse Effects</button>
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
                className="p-4 flex flex-col gap-2 min-h-full cursor-default"
                onClick={() => clearSelection()}
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
