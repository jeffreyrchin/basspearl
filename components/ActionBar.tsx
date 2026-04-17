import React, { useMemo } from 'react';
import { useEffectStore } from '../store/useEffectStore';
import { motion } from 'framer-motion';

interface ActionBarProps { }

const ActionBar: React.FC<ActionBarProps> = () => {
    const effects = useEffectStore(s => s.effects);
    const selectedIds = useEffectStore(s => s.selectedIds);
    const batchRemove = useEffectStore(s => s.batchRemove);
    const batchMeld = useEffectStore(s => s.batchMeld);
    const batchUnmeld = useEffectStore(s => s.batchUnmeld);
    const batchDuplicate = useEffectStore(s => s.batchDuplicate);

    const selectionCount = selectedIds.size;

    const addEffectFromSidebar = useEffectStore(s => s.addEffectFromSidebar);

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

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1.5 rounded-xl bg-[#0a0a1a] border border-white/10 z-actionbar">

            {/* Add Image Overlay - always enabled */}
            <button
                onClick={() => addEffectFromSidebar('IMAGE_OVERLAY')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest text-white/80 hover:text-white hover:bg-white/10 transition-all`}
                title="Image Overlay (O)"
            >
                <span className="material-symbols-outlined">image</span>
            </button>

            <div className="w-[1px] h-4 bg-white/10" />

            {/* Add Color - always enabled */}
            <button
                onClick={() => addEffectFromSidebar('RGBA')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest text-white/80 hover:text-white hover:bg-white/10 transition-all`}
                title="Color Select (C)"
            >
                <span className="material-symbols-outlined">palette</span>
            </button>

            <div className="w-[1px] h-4 bg-white/10" />

            {/* Duplicate */}
            <button
                onClick={batchDuplicate}
                disabled={selectionCount === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest text-white/80 enabled:hover:text-white enabled:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="Duplicate (Cmd+D)"
            >
                <span className="material-symbols-outlined">content_copy</span>
            </button>

            <div className="w-[1px] h-4 bg-white/10" />

            {/* Meld/Group — only for multi-selection of contiguous effects */}
            <button
                key={isAlreadyMelded ? 'ungroup' : 'group'}
                onClick={isAlreadyMelded ? batchUnmeld : batchMeld}
                disabled={!canMeld || selectionCount < 2}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest text-white/80 enabled:hover:text-white enabled:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title={isAlreadyMelded ? "Ungroup (Cmd+Shift+G)" : "Group (Cmd+G)"}
            >
                <span className="material-symbols-outlined">
                    {isAlreadyMelded ? 'link_off' : 'group_work'}
                </span>
            </button>

            <div className="w-[1px] h-4 bg-white/10" />

            {/* Remove */}
            <button
                onClick={batchRemove}
                disabled={selectionCount === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest text-red-400 enabled:hover:text-red-300 enabled:hover:bg-red-400/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="Remove (Backspace)"
            >
                <span className="material-symbols-outlined">delete</span>
            </button>
        </motion.div>
    );
};

export default ActionBar;
