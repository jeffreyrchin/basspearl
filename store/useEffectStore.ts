import { create } from 'zustand';
import { EffectConfig, GlitchEffectType, MacroType } from '../types';
import { INITIAL_REACTIVE_EFFECTS, createEffectInstance, createMacroInstance } from '../constants';
import { analytics } from '@/services/analytics';

interface EffectState {
    effects: EffectConfig[];
    selectedIds: Set<string>;

    // History
    past: EffectConfig[][];
    future: EffectConfig[][];

    // Actions
    setEffects: (effects: EffectConfig[]) => void;

    // Selection
    toggleSelected: (id: string, multi?: boolean) => void;
    selectRange: (id: string) => void;
    selectAll: () => void;
    clearSelection: () => void;

    isInSelectMode: boolean;
    setIsInSelectMode: (active: boolean) => void;

    isInspectorOpen: boolean;
    setIsInspectorOpen: (open: boolean) => void;

    isLibraryOpen: boolean;
    setIsLibraryOpen: (open: boolean) => void;

    undo: () => void;
    redo: () => void;
    commitHistory: () => void;

    toggleMute: (id: string) => void;
    toggleSolo: (id: string) => void;
    addEffect: (type: GlitchEffectType) => void;
    addMacro: (macroType: MacroType) => void;
    batchDuplicate: () => void;
    batchRemove: () => void;
    batchMeld: () => void;
    batchUnmeld: () => void;
    updateParameter: (effectId: string, paramIndex: number, update: Partial<EffectConfig['params'][0]>) => void;
}

export const useEffectStore = create<EffectState>((set, get) => ({
    isInSelectMode: false,
    effects: INITIAL_REACTIVE_EFFECTS,
    selectedIds: new Set<string>(),
    past: [],
    future: [],

    setEffects: (effects) => set({ effects }),

    setIsInSelectMode: (isInSelectMode) => set({ isInSelectMode: isInSelectMode }),

    isInspectorOpen: false,
    setIsInspectorOpen: (isInspectorOpen) => set({ isInspectorOpen }),
    isLibraryOpen: false,
    setIsLibraryOpen: (isLibraryOpen) => set({ isLibraryOpen }),

    toggleSelected: (id, multi) => {
        const { selectedIds } = get();
        const next = new Set(multi ? selectedIds : []);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        set({ selectedIds: next });
    },

    selectRange: (id) => {
        const { effects, selectedIds } = get();
        const ids = effects.map(e => e.id);
        const lastSelected = [...selectedIds].pop();
        if (!lastSelected) {
            set({ selectedIds: new Set([id]) });
            return;
        }
        const from = ids.indexOf(lastSelected);
        const to = ids.indexOf(id);
        if (from === -1 || to === -1) return;
        const lo = Math.min(from, to);
        const hi = Math.max(from, to);
        const next = new Set(selectedIds);
        for (let i = lo; i <= hi; i++) next.add(ids[i]);
        set({ selectedIds: next });
    },

    selectAll: () => {
        const { effects } = get();
        set({ selectedIds: new Set(effects.map(e => e.id)) });
    },

    clearSelection: () => set({ selectedIds: new Set<string>() }),

    // Push current effects onto the past stack. Call this BEFORE making changes.
    commitHistory: () => {
        const { effects, past } = get();
        const last = past[past.length - 1];
        // Skip if nothing has changed since the last commit
        if (last && JSON.stringify(last) === JSON.stringify(effects)) return;
        set({
            past: [...past.slice(-100), JSON.parse(JSON.stringify(effects))], // limit undo history to the last 100 snapshots
            future: [],
        });
    },

    undo: () => {
        const { past, effects, future } = get();
        if (past.length === 0) return;
        const previous = past[past.length - 1];
        set({
            effects: previous,
            past: past.slice(0, -1),
            future: [JSON.parse(JSON.stringify(effects)), ...future],
        });
    },

    redo: () => {
        const { past, effects, future } = get();
        if (future.length === 0) return;
        const [next, ...rest] = future;
        set({
            effects: next,
            past: [...past, JSON.parse(JSON.stringify(effects))],
            future: rest,
        });
    },

    toggleMute: (id) => {
        get().commitHistory();
        set((state) => {
            const next = [...state.effects];
            const idx = next.findIndex(e => e.id === id);
            if (idx === -1) return {};
            next[idx] = { ...next[idx], muted: !next[idx].muted };
            return { effects: next };
        });
    },

    toggleSolo: (id) => {
        get().commitHistory();
        set((state) => {
            const next = [...state.effects];
            const idx = next.findIndex(e => e.id === id);
            if (idx === -1) return {};
            next[idx] = { ...next[idx], soloed: !next[idx].soloed };
            return { effects: next };
        });
    },

    addEffect: (type) => {
        get().commitHistory();
        analytics.effect.added(type);
        const newEffect = createEffectInstance(type);
        set((state) => ({
            effects: [...state.effects, newEffect]
        }));
    },

    addMacro: (macroType) => {
        get().commitHistory();
        analytics.effect.added(`MACRO_${macroType}` as any);
        const newEffects = createMacroInstance(macroType);
        if (newEffects.length === 0) return;

        set((state) => ({
            effects: [...state.effects, ...newEffects]
        }));
    },

    batchDuplicate: () => {
        const { selectedIds } = get();
        if (selectedIds.size === 0) return;
        get().commitHistory();
        set((state) => {
            // Collect selected effects in their pipeline order
            const selected = state.effects.filter(e => selectedIds.has(e.id));

            // Clone each one, stripping melded so they paste as independent effects at the end
            const clones: EffectConfig[] = selected.map(src => ({
                ...JSON.parse(JSON.stringify(src)),
                id: crypto.randomUUID(),
                melded: false,
            }));

            const newSelectedIds = new Set(clones.map(c => c.id));
            return {
                effects: [...state.effects, ...clones],
                selectedIds: newSelectedIds,
            };
        });
    },

    batchRemove: () => {
        const { selectedIds } = get();
        if (selectedIds.size === 0) return;
        get().commitHistory();
        set((state) => {
            selectedIds.forEach(id => {
                const e = state.effects.find(e => e.id === id);
                if (e) analytics.effect.removed(e.type);
            });

            // Map and filter in one go: pass along effects we keep, but break meld links
            // if the immediately following effect is being deleted.
            const next = state.effects.reduce((acc: typeof state.effects, current, index) => {
                // If this effect is selected for deletion, skip it
                if (selectedIds.has(current.id)) return acc;

                const nextEffect = state.effects[index + 1];
                const nextIsBeingDeleted = nextEffect && selectedIds.has(nextEffect.id);

                if (current.melded && nextIsBeingDeleted) {
                    acc.push({ ...current, melded: false });
                } else {
                    acc.push(current);
                }

                return acc;
            }, []);

            return { effects: next, selectedIds: new Set<string>() };
        });
    },

    batchMeld: () => {
        const { effects, selectedIds } = get();
        if (selectedIds.size < 2) return;
        // Collect the indices of all selected effects in order
        const indices = effects
            .map((e, i) => selectedIds.has(e.id) ? i : -1)
            .filter(i => i !== -1);
        // They must be contiguous
        const isContiguous = indices.every((v, i) => i === 0 || v === indices[i - 1] + 1);
        if (!isContiguous) return;
        get().commitHistory();
        set((state) => {
            const next = [...state.effects];
            // Meld all selected except the last one
            for (let i = 0; i < indices.length - 1; i++) {
                next[indices[i]] = { ...next[indices[i]], melded: true };
            }
            // The last selected should NOT be melded (it terminates the group)
            next[indices[indices.length - 1]] = { ...next[indices[indices.length - 1]], melded: false };
            return { effects: next };
        });
    },

    batchUnmeld: () => {
        const { effects, selectedIds } = get();
        if (selectedIds.size < 2) return;
        // Collect the indices of all selected effects in order
        const indices = effects
            .map((e, i) => selectedIds.has(e.id) ? i : -1)
            .filter(i => i !== -1);
        // They must be contiguous
        const isContiguous = indices.every((v, i) => i === 0 || v === indices[i - 1] + 1);
        if (!isContiguous) return;
        get().commitHistory();
        set((state) => {
            const next = [...state.effects];
            // Unmeld all selected effects
            for (let i = 0; i < indices.length; i++) {
                next[indices[i]] = { ...next[indices[i]], melded: false };
            }
            return { effects: next };
        });
    },

    // Simple, dumb setter. Callers are responsible for calling commitHistory()
    // before a batch of changes begins (e.g. on slider pointerdown).
    updateParameter: (effectId, paramIndex, update) => {
        set((state) => ({
            effects: state.effects.map((e) => {
                if (e.id !== effectId) return e;
                const newParams = [...e.params];
                newParams[paramIndex] = { ...newParams[paramIndex], ...update };
                return { ...e, params: newParams };
            }),
        }));
    },
}));
