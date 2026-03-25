import React, { useMemo } from 'react';
import { useEffectStore } from '../store/useEffectStore';
import { EFFECT_METADATA } from '../config/effects';

interface ActionBarProps { }

const ActionBar: React.FC<ActionBarProps> = () => {
    const effects = useEffectStore(s => s.effects);
    const selectedIds = useEffectStore(s => s.selectedIds);
    const batchRemove = useEffectStore(s => s.batchRemove);
    const batchMeld = useEffectStore(s => s.batchMeld);
    const batchUnmeld = useEffectStore(s => s.batchUnmeld);
    const batchDuplicate = useEffectStore(s => s.batchDuplicate);

    const selectionCount = selectedIds.size;
    const focusStack = useEffectStore(s => s.focusStack);
    const pushFocus = useEffectStore(s => s.pushFocus);
    const isInspectorOpen = focusStack.includes('inspector');

    const addColor = useEffectStore(s => s.addColor);

    const [selectedId, selectedEffect, canAddColor] = useMemo(() => {
        const selectedId = selectionCount === 1 ? selectedIds.values().next().value : null;
        const selectedEffect = effects.find(e => e.id === selectedId);
        const canAddColor = selectedEffect && EFFECT_METADATA[selectedEffect?.type]?.isColorable;
        return [selectedId, selectedEffect, canAddColor];
    }, [selectionCount, selectedIds, effects]); // Only run when selectionCount, selectedIds, or effects change

    // Check if selected effects are contiguous (for meld eligibility)
    const canMeld = useMemo(() => {
        if (selectionCount < 2) return false;
        const indices = effects
            .map((e, i) => selectedIds.has(e.id) ? i : -1)
            .filter(i => i !== -1);
        return indices.every((v, i) => i === 0 || v === indices[i - 1] + 1);
    }, [selectionCount, selectedIds, effects]);

    // Check if the current selection is already fully melded together
    const isAlreadyMelded = useMemo(() => {
        if (!canMeld || selectionCount < 2) return false;
        const indices = effects
            .map((e, i) => selectedIds.has(e.id) ? i : -1)
            .filter(i => i !== -1);

        // A group is considered "melded" if every item EXCEPT the last one has melded=true
        for (let i = 0; i < indices.length - 1; i++) {
            if (!effects[indices[i]].melded) return false;
        }
        return true;
    }, [canMeld, selectionCount, selectedIds, effects]);

    if (selectionCount === 0) return null;

    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1.5 rounded-xl bg-black/80 border border-white/15 shadow-2xl shadow-black/50 animate-in fade-in slide-in-from-bottom-2 duration-200 z-actionbar">
            {/* Parameters — only for single selection */}
            <button
                onClick={() => pushFocus('inspector')}
                disabled={selectionCount !== 1}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest enabled:hover:text-white enabled:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${isInspectorOpen && selectionCount === 1 ? 'text-white bg-white/10' : 'text-white/70'}`}
                title="Show Inspector (I)"
            >
                <span className="material-symbols-outlined text-[16px]">tune</span>
            </button>

            <div className="w-[1px] h-4 bg-white/20" />

            {/* Add Color */}
            <button
                onClick={addColor}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest text-white/70 hover:text-white hover:bg-white/10 transition-all`}
                title="Color Select (C)"
            >
                <span className="material-symbols-outlined text-[16px]">palette</span>
            </button>

            <div className="w-[1px] h-4 bg-white/20" />

            {/* Duplicate — always visible */}
            <button
                onClick={batchDuplicate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest text-white/70 hover:text-white hover:bg-white/10 transition-all"
                title="Duplicate (Cmd+D)"
            >
                <span className="material-symbols-outlined text-[16px]">content_copy</span>
            </button>

            <div className="w-[1px] h-4 bg-white/20" />

            {/* Meld/Group — only for multi-selection of contiguous effects */}
            <button
                key={isAlreadyMelded ? 'ungroup' : 'group'}
                onClick={isAlreadyMelded ? batchUnmeld : batchMeld}
                disabled={!canMeld || selectionCount === 1}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest text-white/70 enabled:hover:text-white enabled:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title={isAlreadyMelded ? "Ungroup (Cmd+Shift+G)" : "Group (Cmd+G)"}
            >
                <span className="material-symbols-outlined text-[16px]">
                    {isAlreadyMelded ? 'link_off' : 'group_work'}
                </span>
            </button>

            <div className="w-[1px] h-4 bg-white/20" />

            {/* Remove */}
            <button
                onClick={batchRemove}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest text-red-400/80 hover:text-red-400 hover:bg-red-400/10 transition-all"
                title="Remove (Backspace)"
            >
                <span className="material-symbols-outlined text-[16px]">delete</span>
            </button>
        </div>
    );
};

export default ActionBar;
