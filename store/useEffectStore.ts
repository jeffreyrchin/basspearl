import { create } from 'zustand';
import { EffectConfig, GlitchEffectType, MacroType } from '../types';
import { INITIAL_REACTIVE_EFFECTS, createEffectInstance, createMacroInstance } from '../constants';
import { analytics } from '@/services/analytics';

interface EffectState {
    effects: EffectConfig[];
    selectedEffectId: string | null;

    // History
    past: EffectConfig[][];
    future: EffectConfig[][];

    // Actions
    setEffects: (effects: EffectConfig[]) => void;
    setSelectedEffectId: (id: string | null) => void;

    isDraggingAny: boolean;
    setIsDraggingAny: (isDraggingAny: boolean) => void;

    undo: () => void;
    redo: () => void;
    commitHistory: () => void;

    toggleMute: (index: number) => void;
    toggleSolo: (index: number) => void;
    toggleMeld: (index: number) => void;
    addEffect: (type: GlitchEffectType) => void;
    addMacro: (macroType: MacroType) => void;
    removeEffect: (index: number) => void;
    updateParameter: (effectIndex: number, paramIndex: number, update: Partial<EffectConfig['params'][0]>) => void;
}


export const useEffectStore = create<EffectState>((set, get) => ({
    isDraggingAny: false,
    effects: INITIAL_REACTIVE_EFFECTS,
    selectedEffectId: INITIAL_REACTIVE_EFFECTS[0]?.id || null,
    past: [],
    future: [],

    setEffects: (effects) => set({ effects }),

    setSelectedEffectId: (selectedEffectId) => set({ selectedEffectId }),

    setIsDraggingAny: (isDraggingAny) => set({ isDraggingAny }),

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

    toggleMute: (index) => {
        get().commitHistory();
        set((state) => {
            const next = [...state.effects];
            next[index] = { ...next[index], muted: !next[index].muted };
            return { effects: next };
        });
    },

    toggleSolo: (index) => {
        get().commitHistory();
        set((state) => {
            const next = [...state.effects];
            next[index] = { ...next[index], soloed: !next[index].soloed };
            return { effects: next };
        });
    },

    toggleMeld: (index) => {
        // Only meld if not the last effect
        const { effects } = get();
        if (index >= effects.length - 1) return;

        get().commitHistory();
        set((state) => {
            const next = [...state.effects];
            next[index] = { ...next[index], melded: !next[index].melded };
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

    removeEffect: (index) => {
        get().commitHistory();
        set((state) => {
            analytics.effect.removed(state.effects[index].type);
            const next = [...state.effects];
            next.splice(index, 1);

            // If the item BEFORE the removed one was melded, it was melded TO the removed item.
            // We should break that bond now that the target is gone.
            if (index > 0 && state.effects[index - 1].melded) {
                next[index - 1] = { ...next[index - 1], melded: false };
            }

            return { effects: next };
        });
    },

    // Simple, dumb setter. Callers are responsible for calling commitHistory()
    // before a batch of changes begins (e.g. on slider pointerdown).
    updateParameter: (effectIndex, paramIndex, update) => {
        set((state) => ({
            effects: state.effects.map((e, i) => {
                if (i !== effectIndex) return e;
                const newParams = [...e.params];
                newParams[paramIndex] = { ...newParams[paramIndex], ...update };
                return { ...e, params: newParams };
            }),
        }));
    },
}));
