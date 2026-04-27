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
    isMatch: boolean;
    score: number; // 0 to 100
    message: string;
}

interface MeldGroup {
    anchor: EffectConfig;
    members: EffectConfig[];
}

// Effects that only modify pixel colors (Point Operations).
// They commute with UV effects, but NOT with other Color effects.
const COLOR_EFFECTS = new Set<string>(['RGBA', 'INVERT', 'HUE_ROTATION']);

// Effects that warp UV coordinates or sample neighboring pixels (Spatial Operations).
const UV_EFFECTS = new Set<GlitchEffectType>([
    'TUNNEL_WARP', 'ROTATE', 'SKEW', 'TILE', 'TRANSFORM', 'SCROLL',
    'BIT_CRUSH', 'TRI_CRUSH', 'HEX_CRUSH', 'SCREEN_SHAKE', 'BLACK_HOLE',
    'WHITE_HOLE', 'WAVE_DISTORTION', 'BLUR'
]);

export class PuzzleService {

    static evaluate(userEffects: EffectConfig[], targetEffects: EffectConfig[]): PuzzleMatchResult {
        if (userEffects.length === 0 && targetEffects.length === 0) {
            return { isMatch: true, score: 100, message: 'Empty Match' };
        }

        const userGroups = this.parseGroups(userEffects);
        const targetGroups = this.parseGroups(targetEffects);

        const { totalParamScore, pairedIndices } = this.calculateBestFitGroupScore(userGroups, targetGroups);
        const structuralScore = this.checkGroupOrderValidity(targetGroups, pairedIndices);

        const finalScore = (totalParamScore * 0.7) + (structuralScore * 0.3);
        const threshold = 90;

        return {
            isMatch: finalScore >= threshold,
            score: Math.round(finalScore),
            message: this.getFeedbackMessage(finalScore),
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
        const pairedIndices = new Map<number, number>();
        const usedUserIndices = new Set<number>();

        targetGroups.forEach((target, tIdx) => {
            let bestMatchIdx = -1;
            let bestMatchScore = -1;

            userGroups.forEach((user, uIdx) => {
                if (usedUserIndices.has(uIdx) || user.anchor.type !== target.anchor.type) return;

                const score = this.compareGroups(user, target);
                if (score > bestMatchScore) {
                    bestMatchScore = score;
                    bestMatchIdx = uIdx;
                }
            });

            if (bestMatchIdx !== -1) {
                totalScore += bestMatchScore;
                pairedIndices.set(tIdx, bestMatchIdx);
                usedUserIndices.add(bestMatchIdx);
            }
        });

        const lengthPenalty = Math.abs(userGroups.length - targetGroups.length) * 20;
        const normalizedScore = (totalScore / Math.max(targetGroups.length, 1)) - lengthPenalty;

        return { totalParamScore: Math.max(0, normalizedScore), pairedIndices };
    }

    /**
     * Scores two meld groups against each other.
     * Anchor is scored strictly. Modifiers are paired greedily, applying commutativity rules
     * to ensure visual identity is preserved even if modifier order changes.
     */
    private static compareGroups(user: MeldGroup, target: MeldGroup): number {
        let memberScore = 0;

        // 1. Score Anchor
        let anchorScore = this.compareParams(user.anchor, target.anchor);
        const anchorMutedMismatch  = (user.anchor.muted  ?? false) !== (target.anchor.muted  ?? false);
        const anchorMeldedMismatch = (user.anchor.melded ?? false) !== (target.anchor.melded ?? false);
        const anchorSoloedMismatch = (user.anchor.soloed ?? false) !== (target.anchor.soloed ?? false);

        if (anchorMutedMismatch || anchorMeldedMismatch || anchorSoloedMismatch) {
            anchorScore = Math.max(0, anchorScore - 60);
        }
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
                let score = this.compareParams(uMod, tMod);
                
                const mutedMismatch  = (uMod.muted  ?? false) !== (tMod.muted  ?? false);
                const soloedMismatch = (uMod.soloed ?? false) !== (tMod.soloed ?? false);

                if (mutedMismatch || soloedMismatch) {
                    score = Math.max(0, score - 60);
                }
                
                if (score > bestMatchScore) {
                    bestMatchScore = score;
                    bestMatchIdx = uIdx;
                }
            });

            if (bestMatchIdx !== -1) {
                memberScore += bestMatchScore;
                pairedModifierIndices.set(tIdx, bestMatchIdx);
                usedUserMods.add(bestMatchIdx);
            }
        });

        // 3. Internal Group Commutativity
        let structuralScore = 100;
        const penaltyPerViolation = 50;

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

        const lengthPenalty = Math.abs(userModifiers.length - targetModifiers.length) * 20;
        const normalizedParamScore = (memberScore / Math.max(target.members.length, 1)) - lengthPenalty;
        const finalGroupScore = normalizedParamScore - ((100 - Math.max(0, structuralScore)) * 0.6);

        return Math.max(0, finalGroupScore);
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
        const penaltyPerViolation = 50;

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
     * Rule 1 — Color vs Space: Point-ops (color math) commute with spatial transforms.
     * Rule 2 — Spatial Non-Intersection: Spatially-bounded patterns that do not
     *   overlap can be freely swapped without changing the visual.
     * 
     * Note: Color-vs-Color effects (e.g. Invert and RGBA) are NOT commutative.
     */
    private static areEffectsCommutative(a: EffectConfig, b: EffectConfig): boolean {
        const isColorA = COLOR_EFFECTS.has(a.type);
        const isColorB = COLOR_EFFECTS.has(b.type);
        const isSpaceA = UV_EFFECTS.has(a.type) || this.hasSpatialBounds(a.type);
        const isSpaceB = UV_EFFECTS.has(b.type) || this.hasSpatialBounds(b.type);

        // Color vs Space -> COMMUTE
        if (isColorA && isSpaceB) return true;
        if (isColorB && isSpaceA) return true;

        // Space (Pattern) vs Space -> COMMUTE if no overlap
        if (this.hasSpatialBounds(a.type) && this.hasSpatialBounds(b.type)) {
            return !this.doPatternsIntersect(a, b);
        }

        // Color vs Color -> DO NOT COMMUTE
        // Space vs Space -> DO NOT COMMUTE
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
    private static compareParams(a: EffectConfig, b: EffectConfig): number {
        let matchCount = 0;
        a.params.forEach((pA, idx) => {
            const pB = b.params[idx];
            if (!pB) return;
            const diff = Math.abs(pA.value - pB.value);
            if (diff === 0) matchCount += 100;
            else if (diff <= 5) matchCount += 75;
            else if (diff <= 15) matchCount += 50;
        });
        return matchCount / a.params.length;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Feedback
    // ─────────────────────────────────────────────────────────────────────────

    private static getFeedbackMessage(score: number): string {
        if (score >= 95) return 'Perfect Reconstruction!';
        if (score >= 90) return 'Match Confirmed. Well done.';
        if (score >= 70) return "You're close, but the math isn't quite there.";
        if (score >= 40) return 'The essence is correct, but check your parameters.';
        return 'Not quite. Hold W to study the Goal again.';
    }
}
