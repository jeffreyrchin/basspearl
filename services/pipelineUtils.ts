import { EffectConfig } from '../types';

/**
 * Represents the data needed to render a single interactive shader card.
 * This is a "view-model" that decouples the UI from the raw store indices.
 */
export interface EffectData {
    id: string;
    type: string;
    melded: boolean;
    muted: boolean;
    soloed: boolean;
    isActive: boolean;
}

/**
 * Represents effect data for a single draggable unit in the pipeline.
 * It contains data for one or more effects that are linked (melded) together.
 */
export interface EffectGroupData {
    id: string;
    effects: EffectData[];
}

/**
 * Transforms the flat effects array into a structured tree of effect groups.
 * This is the single source of truth for the Pipeline's visual hierarchy.
 */
export const getEffectGroups = (effects: EffectConfig[]): EffectGroupData[] => {
    const anySoloed = effects.some(e => e.soloed);
    const groups: EffectGroupData[] = [];
    let currentGroupEffects: EffectData[] = [];

    effects.forEach((effect) => {
        const effectData: EffectData = {
            id: effect.id,
            type: effect.type,
            melded: effect.melded,
            muted: effect.muted,
            soloed: effect.soloed,
            isActive: anySoloed ? effect.soloed : !effect.muted,
        };

        currentGroupEffects.push(effectData);

        // If this effect is not melded to the next, it terminates the group
        if (!effect.melded) {
            groups.push({
                id: `group-${currentGroupEffects[0].id}`,
                effects: currentGroupEffects
            });
            currentGroupEffects = [];
        }
    });

    // Fallback for trailing melded items
    if (currentGroupEffects.length > 0) {
        groups.push({
            id: `group-${currentGroupEffects[0].id}`,
            effects: currentGroupEffects
        });
    }

    return groups;
};

/**
 * Reorders a group of effects in a flat array.
 */
export const reorderEffectGroups = (
    effects: EffectConfig[],
    sourceIndex: number,
    destinationIndex: number
): EffectConfig[] => {
    const nextEffects = [...effects];

    // 1. Identify all groups in current state
    const groups: EffectConfig[][] = [];
    let currentGroup: EffectConfig[] = [];
    nextEffects.forEach((e) => {
        currentGroup.push(e);
        if (!e.melded) {
            groups.push(currentGroup);
            currentGroup = [];
        }
    });
    if (currentGroup.length > 0) groups.push(currentGroup);

    // 2. Reorder groups
    const [moved] = groups.splice(sourceIndex, 1); // Extract the group at sourceIndex and mutate groups
    groups.splice(destinationIndex, 0, moved); // Insert the extracted group at destinationIndex

    // 3. Return flattened result
    return groups.flat();
};

/**
 * Checks if the current selection is eligible for melding (grouping).
 * Requires at least 2 selected items that are contiguous in the pipeline.
 */
export const canMeld = (effects: EffectConfig[], selectedIds: Set<string>): boolean => {
    if (selectedIds.size < 2) return false;
    const indices = effects
        .map((e, i) => selectedIds.has(e.id) ? i : -1)
        .filter(i => i !== -1);
    return indices.every((v, i) => i === 0 || v === indices[i - 1] + 1);
};

/**
 * Checks if the current selection is already fully melded together.
 */
export const isAlreadyMelded = (effects: EffectConfig[], selectedIds: Set<string>): boolean => {
    if (!canMeld(effects, selectedIds)) return false;
    const indices = effects
        .map((e, i) => selectedIds.has(e.id) ? i : -1)
        .filter(i => i !== -1);

    // A group is considered "melded" if every item EXCEPT the last one has melded=true
    for (let i = 0; i < indices.length - 1; i++) {
        if (!effects[indices[i]].melded) return false;
    }
    return true;
};
