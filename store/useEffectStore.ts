import { create } from 'zustand';
import { EffectConfig, GlitchEffectType } from '../types';
import { INITIAL_REACTIVE_EFFECTS, createEffectInstance } from '../constants';
import { analytics } from '@/services/analytics';

interface EffectState {
    effects: EffectConfig[];
    selectedEffectIndex: number;

    // Actions
    setEffects: (effects: EffectConfig[]) => void;
    setSelectedEffectIndex: (index: number) => void;

    moveEffect: (index: number, direction: 'up' | 'down') => void;
    toggleEffect: (index: number) => void;
    addEffect: (type: GlitchEffectType) => void;
    removeEffect: (index: number) => void;
    updateParams: (index: number, params: EffectConfig['params']) => void;
    updateFrequencyBand: (index: number, band: EffectConfig['frequencyBand']) => void;
}

export const useEffectStore = create<EffectState>((set) => ({
    effects: INITIAL_REACTIVE_EFFECTS,
    selectedEffectIndex: 0,

    setEffects: (effects) => set({ effects }),

    setSelectedEffectIndex: (selectedEffectIndex) => set({ selectedEffectIndex }),

    moveEffect: (index, direction) => set((state) => {
        const next = [...state.effects];
        const activeIndices = next.map((e, i) => e.active ? i : -1).filter(i => i !== -1);
        const currentActivePos = activeIndices.indexOf(index);
        let newSelectedIndex = state.selectedEffectIndex;

        if (direction === 'up' && currentActivePos > 0) {
            const targetIndex = activeIndices[currentActivePos - 1];
            [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
            newSelectedIndex = targetIndex;
        } else if (direction === 'down' && currentActivePos < activeIndices.length - 1) {
            const targetIndex = activeIndices[currentActivePos + 1];
            [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
            newSelectedIndex = targetIndex;
        }

        return { effects: next, selectedEffectIndex: newSelectedIndex };
    }),

    toggleEffect: (index) => set((state) => {
        const isTurningOn = !state.effects[index].active;
        analytics.effect.toggled(state.effects[index].type, isTurningOn);

        if (isTurningOn) {
            const item = { ...state.effects[index], active: true };
            const others = state.effects.filter((_, i) => i !== index);
            const next = [...others, item];
            return {
                effects: next,
                selectedEffectIndex: next.length - 1
            };
        } else {
            const next = state.effects.map((e, i) =>
                i === index ? { ...e, active: false } : e
            );
            return { effects: next };
        }
    }),

    addEffect: (type) => set((state) => {
        analytics.effect.toggled(type, true);
        const newEffect = createEffectInstance(type);
        const next = [...state.effects, newEffect];
        return { effects: next, selectedEffectIndex: next.length - 1 };
    }),

    removeEffect: (index) => set((state) => {
        analytics.effect.toggled(state.effects[index].type, false);
        const next = state.effects.filter((_, i) => i !== index);
        const newSelected = Math.min(state.selectedEffectIndex, next.length - 1);
        return { effects: next, selectedEffectIndex: Math.max(0, newSelected) };
    }),

    updateParams: (index, params) => set((state) => ({
        effects: state.effects.map((e, i) => i === index ? { ...e, params } : e)
    })),

    updateFrequencyBand: (index, frequencyBand) => set((state) => ({
        effects: state.effects.map((e, i) => i === index ? { ...e, frequencyBand } : e)
    })),
}));
