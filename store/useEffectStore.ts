import { create } from 'zustand';
import { EffectConfig, GlitchEffectType, FrequencyBand } from '../types';
import { INITIAL_REACTIVE_EFFECTS, createEffectInstance } from '../constants';
import { analytics } from '@/services/analytics';

interface EffectState {
    effects: EffectConfig[];
    selectedEffectId: string | null;

    // Actions
    setEffects: (effects: EffectConfig[]) => void;
    setSelectedEffectId: (id: string | null) => void;

    moveEffect: (index: number, direction: 'up' | 'down') => void;
    toggleMute: (index: number) => void;
    toggleSolo: (index: number) => void;
    addEffect: (type: GlitchEffectType) => void;
    removeEffect: (index: number) => void;
    updateParameter: (effectIndex: number, paramIndex: number, update: Partial<EffectConfig['params'][0]>) => void;
}

export const useEffectStore = create<EffectState>((set) => ({
    effects: INITIAL_REACTIVE_EFFECTS,
    selectedEffectId: INITIAL_REACTIVE_EFFECTS[0]?.id || null,

    setEffects: (effects) => set({ effects }),

    setSelectedEffectId: (selectedEffectId) => set({ selectedEffectId }),

    moveEffect: (index, direction) => set((state) => {
        const next = [...state.effects];

        if (direction === 'up' && index > 0) {
            [next[index], next[index - 1]] = [next[index - 1], next[index]];
        } else if (direction === 'down' && index < next.length - 1) {
            [next[index], next[index + 1]] = [next[index + 1], next[index]];
        }

        return { effects: next };
    }),

    toggleMute: (index) => set((state) => {
        const next = [...state.effects];
        next[index] = { ...next[index], muted: !next[index].muted };
        return { effects: next };
    }),

    toggleSolo: (index) => set((state) => {
        const next = [...state.effects];
        next[index] = { ...next[index], soloed: !next[index].soloed };
        return { effects: next };
    }),

    addEffect: (type) => set((state) => {
        analytics.effect.added(type);
        const newEffect = createEffectInstance(type);
        const next = [...state.effects, newEffect];
        return { effects: next, selectedEffectId: newEffect.id };
    }),

    removeEffect: (index) => set((state) => {
        analytics.effect.removed(state.effects[index].type);
        return {
            effects: state.effects.filter((_, i) => i !== index)
        };
    }),

    updateParameter: (effectIndex, paramIndex, update) => set((state) => ({
        effects: state.effects.map((e, i) => {
            if (i !== effectIndex) return e;
            const newParams = [...e.params];
            newParams[paramIndex] = { ...newParams[paramIndex], ...update };
            return { ...e, params: newParams };
        })
    })),
}));
