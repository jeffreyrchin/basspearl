import { EffectConfig, GlitchEffectType } from '../types';
import { EFFECT_METADATA } from '../config/effects';

/**
 * PuzzleService
 * Handles the comparison logic between the user's current live
 * configuration and the target puzzle configuration.
 *
 * Core Model: Effects are pre-processed into "Meld Groups" before comparison.
 * A Meld Group is one anchor effect followed by zero or more melded children.
 */

export interface PuzzleMatchResult {
    score: number; // 0 to 100
}

interface MeldGroup {
    anchor: EffectConfig;
    members: EffectConfig[];
}

// Category 1: Pure pixel math — apply an identical function to every pixel independently.
// They distribute over ALL categorized spatial operations.
const POINT_OPS = new Set<string>(['RGBA', 'INVERT', 'HUE_ROTATION']);

// Category 2: Data-Dependent Point Ops — read current pixel data (luma) to decide output.
// They commute with "Rigid" UV warps (Scroll, Rotate) because moving a pixel doesn't
// change its luma. However, they DO NOT commute with effects that modify color content 
// (e.g. BIT_CRUSH, TERRAIN) because the mask would be reacting to different source data.
const ADAPTIVE_OPS = new Set<string>(['SPECTRAL_MAP', 'LUMINANCE_MASK', 'LUMINANCE_MAP']);

// Category 3: Translation-Invariant Filters — symmetric neighbor convolutions.
// Only commute with Uniform Warps (translation invariance property).
const ISOTROPIC_FILTERS = new Set<string>(['BLUR', 'GLOW', 'EDGE_MASK', 'COLOR_BLEED', 'CHANNEL_SHIFT']);

// Category 4: Uniform Warps — identical global translation applied to every pixel.
// Commute with each other and with Isotropic Filters.
const UNIFORM_WARPS = new Set<string>(['SCROLL', 'SCREEN_SHAKE']);

// Category 5: Non-Uniform UV Warps — deterministic positional math, no image-data reading.
// Commute with POINT_OPS and ADAPTIVE_OPS.
const NON_UNIFORM_WARPS = new Set<string>([
    'TUNNEL_WARP', 'ROTATE', 'SKEW', 'TILE', 'TRANSFORM',
    'BLACK_HOLE', 'WHITE_HOLE', 'WAVE_DISTORTION',
    'BIT_CRUSH', 'TRI_CRUSH', 'HEX_CRUSH',
    'TERRAIN', 'TERRAIN_SPHERE', 'TERRAIN_RING'
]);

// Uncategorized effects (DATA_CORRUPTION, DEEP_FRY, etc.) 
// default to STRICT (never commute)., UNLESS they satisfy
// specific parameter conditions below.

export class PuzzleService {
    static evaluate(userEffects: EffectConfig[], targetEffects: EffectConfig[]): PuzzleMatchResult {
        if (userEffects.length === 0 && targetEffects.length === 0) {
            return { score: 100 };
        }

        const userGroups = this.parseGroups(userEffects);
        const targetGroups = this.parseGroups(targetEffects);

        // 1. Parameter Matching (Fuzzy)
        const { totalParamScore, pairedIndices, totalStatePenalty } = this.calculateBestFitGroupScore(userGroups, targetGroups);

        // 2. Global Order Validity (Strict)
        const structuralScore = this.checkGroupOrderValidity(targetGroups, pairedIndices);

        // 3. Final Calculation
        // Weights: 70% Param Accuracy (fuzzy), 30% Structural/Order Accuracy (logic)
        const rawScore = (totalParamScore * 0.7) + (structuralScore * 0.3);

        // Apply global state penalties (Muted, Soloed, Melded) directly to final score
        // to ensure they are never "diluted" by long stacks.
        const finalScore = Math.max(0, Math.round(rawScore - totalStatePenalty));

        return {
            score: finalScore,
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Group Parsing
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Splits a flat effect stack into meld groups.
     * Any non-melded effect terminates the current group.
     */
    private static parseGroups(effects: EffectConfig[]): MeldGroup[] {
        const groups: MeldGroup[] = [];
        let currentMembers: EffectConfig[] = [];

        for (const effect of effects) {
            currentMembers.push(effect);
            if (!effect.melded) {
                groups.push({
                    anchor: currentMembers[0],
                    members: currentMembers
                });
                currentMembers = [];
            }
        }

        if (currentMembers.length > 0) {
            groups.push({ anchor: currentMembers[0], members: currentMembers });
        }
        return groups;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Group-Level Scoring
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Greedy best-fit matching at the GROUP level.
     * Groups are paired by matching anchor types. Modifiers are then greedily scored
     * inside the selected pair.
     */
    private static calculateBestFitGroupScore(userGroups: MeldGroup[], targetGroups: MeldGroup[]) {
        let totalScore = 0;
        let totalStatePenalty = 0;
        const pairedIndices = new Map<number, number>();
        const usedUserIndices = new Set<number>();

        targetGroups.forEach((tGroup, tIdx) => {
            let bestMatchIdx = -1;
            let bestMatchScore = -1;
            let bestMatchPenalty = 0;

            userGroups.forEach((uGroup, uIdx) => {
                if (usedUserIndices.has(uIdx) || uGroup.anchor.type !== tGroup.anchor.type) return;

                const { score, penalty } = this.compareGroups(uGroup, tGroup);
                if (score > bestMatchScore) {
                    bestMatchScore = score;
                    bestMatchIdx = uIdx;
                    bestMatchPenalty = penalty;
                }
            });

            if (bestMatchIdx !== -1) {
                totalScore += bestMatchScore;
                totalStatePenalty += bestMatchPenalty;
                pairedIndices.set(tIdx, bestMatchIdx);
                usedUserIndices.add(bestMatchIdx);
            }
        });

        const extraPenalty = (userGroups.length - usedUserIndices.size) * 25;
        const missingPenalty = (targetGroups.length - usedUserIndices.size) * 25;
        const totalLengthPenalty = extraPenalty + missingPenalty;

        const normalizedScore = (totalScore / Math.max(targetGroups.length, 1));

        return { totalParamScore: Math.max(0, normalizedScore), pairedIndices, totalStatePenalty: totalStatePenalty + totalLengthPenalty };
    }

    /**
     * Scores two meld groups against each other.
     * Anchor is scored strictly. Modifiers are paired greedily, applying commutativity rules
     * to ensure visual identity is preserved even if modifier order changes.
     */
    private static compareGroups(user: MeldGroup, target: MeldGroup): { score: number, penalty: number } {
        let memberScore = 0;
        let penalty = 0;

        // 1. Score Anchor
        const { score: anchorScore, penalty: anchorParamPenalty } = this.compareParams(user.anchor, target.anchor);
        penalty += anchorParamPenalty;

        // State Mismatches (Anchor)
        if ((user.anchor.muted ?? false) !== (target.anchor.muted ?? false)) penalty += 25;
        if ((user.anchor.soloed ?? false) !== (target.anchor.soloed ?? false)) penalty += 25;
        if ((user.anchor.melded ?? false) !== (target.anchor.melded ?? false)) penalty += 25;

        memberScore += anchorScore;

        // 2. Score Modifiers
        const userModifiers = user.members.slice(1);
        const targetModifiers = target.members.slice(1);
        const pairedModifierIndices = new Map<number, number>();
        const usedUserMods = new Set<number>();

        targetModifiers.forEach((tMod, tIdx) => {
            let bestMatchIdx = -1;
            let bestMatchScore = -1;

            userModifiers.forEach((uMod, uIdx) => {
                if (usedUserMods.has(uIdx) || uMod.type !== tMod.type) return;

                const { score, penalty: modParamPenalty } = this.compareParams(uMod, tMod);
                let currentModPenalty = 0;

                // Mismatches (Modifier)
                if ((uMod.muted ?? false) !== (tMod.muted ?? false)) currentModPenalty += 25;
                if ((uMod.soloed ?? false) !== (tMod.soloed ?? false)) currentModPenalty += 25;

                if (score > bestMatchScore) {
                    bestMatchScore = score;
                    bestMatchIdx = uIdx;
                }
            });

            if (bestMatchIdx !== -1) {
                // Determine the penalty of the selected user modifier
                const uMod = userModifiers[bestMatchIdx];
                const { penalty: modParamPenalty } = this.compareParams(uMod, tMod);
                penalty += modParamPenalty;

                if ((uMod.muted ?? false) !== (tMod.muted ?? false)) penalty += 25;
                if ((uMod.soloed ?? false) !== (tMod.soloed ?? false)) penalty += 25;

                memberScore += bestMatchScore;
                pairedModifierIndices.set(tIdx, bestMatchIdx);
                usedUserMods.add(bestMatchIdx);
            }
        });

        // Penalty for missing/extra modifiers should also be global? 
        // No, lengthPenalty handles that well enough in calculateBestFitGroupScore.

        // 3. Internal Group Commutativity
        let structuralScore = 100;
        const penaltyPerViolation = 100;

        for (let i = 0; i < targetModifiers.length; i++) {
            for (let j = i + 1; j < targetModifiers.length; j++) {
                const uIdxI = pairedModifierIndices.get(i);
                const uIdxJ = pairedModifierIndices.get(j);
                if (uIdxI === undefined || uIdxJ === undefined) continue;
                if (uIdxI > uIdxJ) {
                    if (!this.areEffectsCommutative(targetModifiers[i], targetModifiers[j])) {
                        structuralScore -= penaltyPerViolation;
                    }
                }
            }
        }

        const extraModPenalty = (userModifiers.length - usedUserMods.size) * 25;
        const missingModPenalty = (targetModifiers.length - usedUserMods.size) * 25;
        const totalModPenalty = extraModPenalty + missingModPenalty;

        const normalizedParamScore = (memberScore / Math.max(target.members.length, 1));

        // Final Group Score construction (Internal Structural only)
        const internalStructuralPenalty = (100 - Math.max(0, structuralScore)) * 0.6;
        const finalGroupScore = normalizedParamScore - internalStructuralPenalty;

        return { score: Math.max(0, finalGroupScore), penalty: penalty + totalModPenalty };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Order Validity & Commutativity
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Checks if the order of matched groups is legal based on anchor commutativity.
     * Within-group ordering is handled by compareGroups.
     */
    private static checkGroupOrderValidity(targetGroups: MeldGroup[], pairedIndices: Map<number, number>): number {
        let score = 100;
        const penaltyPerViolation = 100;

        for (let i = 0; i < targetGroups.length; i++) {
            for (let j = i + 1; j < targetGroups.length; j++) {
                const userIdxI = pairedIndices.get(i);
                const userIdxJ = pairedIndices.get(j);
                if (userIdxI === undefined || userIdxJ === undefined) continue;
                if (userIdxI > userIdxJ) {
                    if (!this.areEffectsCommutative(targetGroups[i].anchor, targetGroups[j].anchor)) {
                        score -= penaltyPerViolation;
                    }
                }
            }
        }
        return Math.max(0, score);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Spatial Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * General commutativity check for any two effects.
     *
     * Rule 1 — Point Ops vs Spatial: Pure pixel math distributes over all
     *           categorized spatial operations (UV warps, filters, etc).
     * Rule 2 — Non-Intersecting Patterns: Spatially-bounded patterns at different
     *           screen regions commute regardless of type.
     * Rule 3 — Adaptive Ops vs UV Warps: Content-reading ops commute with warps that
     *           don't change what content (luma) is at any given sample point.
     * Rule 4 — Isotropic Filters vs Uniform Warps: Translation invariance theorem.
     * Rule 5 — Uniform Warp vs Uniform Warp: Vector addition is commutative.
     */
    private static areEffectsCommutative(a: EffectConfig, b: EffectConfig): boolean {
        const isPointA = POINT_OPS.has(a.type);
        const isPointB = POINT_OPS.has(b.type);
        const isAdaptiveA = ADAPTIVE_OPS.has(a.type);
        const isAdaptiveB = ADAPTIVE_OPS.has(b.type);
        const isFilterA = ISOTROPIC_FILTERS.has(a.type);
        const isFilterB = ISOTROPIC_FILTERS.has(b.type);
        const isUniformA = UNIFORM_WARPS.has(a.type);
        const isUniformB = UNIFORM_WARPS.has(b.type);
        let isNonUniformA = NON_UNIFORM_WARPS.has(a.type);
        let isNonUniformB = NON_UNIFORM_WARPS.has(b.type);

        // Conditional Commutativity Checks:
        // Bit Crush and Terrain families are only Non-Uniform Warps when their
        // data-altering parameters (Posterize, Extrusion) are 0. Otherwise they are Strict.
        if (isNonUniformA) {
            const posterize = a.params.find(p => p.param === 'Posterize')?.value ?? 0;
            const extrusion = a.params.find(p => p.param === 'Extrusion')?.value ?? 0;
            if (posterize > 0 || extrusion > 0) isNonUniformA = false;
        }

        if (isNonUniformB) {
            const posterize = b.params.find(p => p.param === 'Posterize')?.value ?? 0;
            const extrusion = b.params.find(p => p.param === 'Extrusion')?.value ?? 0;
            if (posterize > 0 || extrusion > 0) isNonUniformB = false;
        }

        const isSpatialA = isFilterA || isUniformA || isNonUniformA;
        const isSpatialB = isFilterB || isUniformB || isNonUniformB;

        // Rule 1: Point Ops commute with all categorized spatial ops.
        if (isPointA && isSpatialB) return true;
        if (isPointB && isSpatialA) return true;

        // Rule 2: Non-intersecting spatial patterns commute.
        if (this.hasSpatialBounds(a.type) && this.hasSpatialBounds(b.type)) {
            return !this.doPatternsIntersect(a, b);
        }

        // Rule 3: Adaptive Ops commute with content-preserving UV Warps.
        if (isAdaptiveA && (isUniformB || isNonUniformB)) return true;
        if (isAdaptiveB && (isUniformA || isNonUniformA)) return true;

        // Rule 4: Isotropic Filters commute with Uniform Warps (translation invariance).
        if ((isFilterA && isUniformB) || (isFilterB && isUniformA)) return true;

        // Rule 5: Uniform Warps commute with each other (vector addition commutes).
        if (isUniformA && isUniformB) return true;

        return false;
    }

    /**
     * Returns true if this effect type has spatial positioning params (Pan X + Scale X)
     * according to EFFECT_METADATA. Derived directly from the schema.
     */
    private static hasSpatialBounds(type: GlitchEffectType): boolean {
        const meta = EFFECT_METADATA[type];
        if (!meta) return false;
        const paramNames = new Set(meta.params.map(p => p.name));
        return paramNames.has('Pan X') && paramNames.has('Scale X');
    }

    /**
     * Calculates spatial intersection between two effects using their runtime param values.
     */
    private static doPatternsIntersect(a: EffectConfig, b: EffectConfig): boolean {
        const getBounds = (effect: EffectConfig) => {
            const get = (name: string, fallback: number) =>
                effect.params.find(p => p.param === name)?.value ?? fallback;
            const panX = get('Pan X', 50);
            const panY = get('Pan Y', 50);
            const scaleX = get('Scale X', 100);
            const scaleY = get('Scale Y', 100);
            return {
                left: panX - scaleX / 2,
                right: panX + scaleX / 2,
                top: panY - scaleY / 2,
                bottom: panY + scaleY / 2,
            };
        };
        const bA = getBounds(a);
        const bB = getBounds(b);
        return !(bA.left > bB.right || bA.right < bB.left || bA.top > bB.bottom || bA.bottom < bB.top);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Effect-Level Param Comparison
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Scores parameter similarity between two effects of the same type.
     * Uses a graded curve: exact matches score higher than near-matches.
     */
    private static compareParams(a: EffectConfig, b: EffectConfig): { score: number, penalty: number } {
        let totalParamScore = 0;
        let penalty = 0;

        a.params.forEach((pA, idx) => {
            const pB = b.params[idx];
            if (!pB) return;

            let paramScore = 0;
            let valDiff = Math.abs(pA.value - pB.value);

            // Handle Cyclic Parameters (e.g. 0 is identical to 100)
            const meta = EFFECT_METADATA[a.type].params.find(m => m.name === pA.param);
            if (meta?.cyclic) {
                valDiff = Math.min(valDiff, 100 - valDiff);
            }

            const minDiff = Math.abs(pA.min - pB.min);

            // 1. Value Matching (Graded)
            if (valDiff === 0) paramScore = 100;
            else if (valDiff <= 5) paramScore = 90;
            else if (valDiff <= 15) paramScore = 80;

            // 2. Frequency Band Matching (Global Penalty)
            if (pA.frequencyBand !== pB.frequencyBand) {
                penalty += 10;
            }

            // 3. Min Matching (Floor)
            // We only care about the 'min' floor if the effect is audio-reactive.
            // If audio is ON, min mismatch is a major structural failure (Visual Floor).
            // If audio is OFF, min is visually irrelevant and should be ignored.
            if (pA.frequencyBand !== 'OFF') {
                if (minDiff > 10) penalty += 10;
            }

            totalParamScore += paramScore;
        });

        const avgScore = totalParamScore / Math.max(a.params.length, 1);
        return { score: avgScore, penalty };
    }
}
