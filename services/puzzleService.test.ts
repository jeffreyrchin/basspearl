import { PuzzleService, PuzzleMatchResult } from './puzzleService';
import { EffectConfig, GlitchEffectType } from '../types';
import { createEffectInstance } from '../constants';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a real effect instance via createEffectInstance (same as the engine),
 * then applies any named param overrides on top.
 * This ensures params match the actual structure from EFFECT_METADATA exactly.
 */
const e = (
    type: GlitchEffectType,
    overrides: Record<string, number> = {}
): EffectConfig => {
    const instance = createEffectInstance(type);
    if (Object.keys(overrides).length > 0) {
        instance.params = instance.params.map(p => ({
            ...p,
            value: overrides[p.param] !== undefined ? overrides[p.param] : p.value,
        }));
    }
    return instance;
};

/**
 * Returns a shallow copy of the effect with melded: true.
 * Use to build meld-group stacks inline in test data.
 */
const meld = (effect: EffectConfig): EffectConfig => ({ ...effect, melded: true });

export interface TestCase {
    name: string;
    description: string;
    user: EffectConfig[];
    target: EffectConfig[];
    expectMatch: boolean;
    expectScoreAbove?: number;   // score must be >= this
    expectScoreBelow?: number;   // score must be <  this
}

export interface TestResult {
    name: string;
    description: string;
    passed: boolean;
    result: PuzzleMatchResult;
    expected: { isMatch: boolean; scoreAbove?: number; scoreBelow?: number };
    reason: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Cases
// ─────────────────────────────────────────────────────────────────────────────

export const TEST_CASES: TestCase[] = [
    // ── Perfect Match ─────────────────────────────────────────────────────────
    {
        name: 'Perfect Match',
        description: 'Identical stacks with default params — should be 100%.',
        user: [e('RGBA'), e('TUNNEL_WARP')],
        target: [e('RGBA'), e('TUNNEL_WARP')],
        expectMatch: true,
        expectScoreAbove: 95,
    },

    // ── Close Parameters ──────────────────────────────────────────────────────
    {
        name: 'Near-Perfect Params',
        description: 'Red overridden to 97 (default is 100). Within 5-unit tolerance — should still win.',
        // Default RGBA: Red=100 Green=100 Blue=100 Opacity=100
        user: [e('RGBA', { Red: 97 })],
        target: [e('RGBA', { Red: 100 })],
        expectMatch: true,
        expectScoreAbove: 90,
    },

    // ── Wrong Parameters ──────────────────────────────────────────────────────
    {
        name: 'Incorrect Params',
        description: 'TUNNEL_WARP Scale overridden to 80 vs default 20. Should fail.',
        // Default TUNNEL_WARP: Scale=20, Speed=10, Twist=10
        user: [e('TUNNEL_WARP', { Scale: 80, Speed: 90, Twist: 90 })],
        target: [e('TUNNEL_WARP')],
        expectMatch: false,
        expectScoreBelow: 50,
    },

    // ── RGBA Passthrough: Legal Swap ──────────────────────────────────────────
    {
        name: 'RGBA Passthrough Swap (Legal)',
        description: 'RGBA before Tunnel Warp in target, reversed in user. RGBA is PASSTHROUGH — should be forgiven.',
        target: [e('RGBA'), e('TUNNEL_WARP')],
        user: [e('TUNNEL_WARP'), e('RGBA')],
        expectMatch: true,
        expectScoreAbove: 90,
    },

    // ── Invert Passthrough: Legal Swap ────────────────────────────────────────
    {
        name: 'Invert Passthrough Swap (Legal)',
        description: 'Invert swapped with Rotate. Should be forgiven.',
        // Default INVERT: Inversion=100; Default ROTATE: Rotation=3, Speed=3
        target: [e('INVERT'), e('ROTATE')],
        user: [e('ROTATE'), e('INVERT')],
        expectMatch: true,
        expectScoreAbove: 90,
    },

    // ── Spectral Map is NOT a Passthrough ─────────────────────────────────────
    {
        name: 'Spectral Swap (Illegal)',
        description: 'Spectral is STRICT — swapping with Tunnel Warp should lose order points.',
        // Default SPECTRAL_MAP: Rainbow Density=50, Color Shift=0, Speed=25, Intensity=100
        target: [e('SPECTRAL_MAP'), e('TUNNEL_WARP')],
        user: [e('TUNNEL_WARP'), e('SPECTRAL_MAP')],
        expectMatch: false,
        expectScoreBelow: 90,
    },

    // ── Non-Intersecting Patterns: Legal Swap ─────────────────────────────────
    {
        name: 'Patterns No-Overlap Swap (Legal)',
        description: 'Two GRIDs far apart spatially — order is irrelevant.',
        // GRID real params: Horizontal, Vertical, Thickness, Feather, Scale X, Scale Y, Pan X, Pan Y, Rotation
        target: [
            e('GRID', { 'Pan X': 5, 'Scale X': 10 }),
            e('GRID', { 'Pan X': 95, 'Scale X': 10 }),
        ],
        user: [
            e('GRID', { 'Pan X': 95, 'Scale X': 10 }),
            e('GRID', { 'Pan X': 5, 'Scale X': 10 }),
        ],
        expectMatch: true,
        expectScoreAbove: 90,
    },

    // ── Intersecting Patterns: Illegal Swap ───────────────────────────────────
    {
        name: 'Patterns Overlapping Swap (Illegal)',
        description: 'Two GRIDs both centered at ~50 — they overlap. Swap should be penalized.',
        target: [
            e('GRID', { 'Pan X': 50, 'Pan Y': 50, 'Scale X': 80, 'Scale Y': 80 }),
            e('GRID', { 'Pan X': 55, 'Pan Y': 50, 'Scale X': 80, 'Scale Y': 80 }),
        ],
        user: [
            e('GRID', { 'Pan X': 55, 'Pan Y': 50, 'Scale X': 80, 'Scale Y': 80 }),
            e('GRID', { 'Pan X': 50, 'Pan Y': 50, 'Scale X': 80, 'Scale Y': 80 }),
        ],
        expectMatch: false,
        expectScoreBelow: 90,
    },

    // ── Extra Effect Added ────────────────────────────────────────────────────
    {
        name: 'Extra Effect in User Stack',
        description: 'User added a BLUR the target does not have. Should penalize.',
        target: [e('RGBA')],
        user: [e('RGBA'), e('BLUR')],
        expectMatch: false,
        expectScoreBelow: 90,
    },

    // ── Missing Effect ────────────────────────────────────────────────────────
    {
        name: 'Missing Effect in User Stack',
        description: 'User is missing a GLOW the target requires. Should penalize.',
        target: [e('RGBA'), e('GLOW')],
        user: [e('RGBA')],
        expectMatch: false,
        expectScoreBelow: 90,
    },

    // ── Empty Stacks ──────────────────────────────────────────────────────────
    {
        name: 'Both Stacks Empty',
        description: 'Edge case: two empty stacks should be a trivial match.',
        target: [],
        user: [],
        expectMatch: true,
        expectScoreAbove: 99,
    },

    // ── Muted Effect Mismatch ─────────────────────────────────────────────────
    {
        name: 'Muted Effect Mismatch',
        description: 'Same types and params, but user has BLUR muted when target does not. Should fail.',
        target: [e('RGBA'), e('BLUR')],
        user: (() => {
            const u = [e('RGBA'), e('BLUR')];
            u[1].muted = true; // Mute the BLUR
            return u;
        })(),
        expectMatch: false,
        expectScoreBelow: 90,
    },

    // ── Soloed Effect Mismatch ───────────────────────────────────────────────
    {
        name: 'Soloed Effect Mismatch',
        description: 'User has RGBA soloed, which isolates it and hides other effects. Should fail.',
        target: [e('RGBA'), e('BLUR')],
        user: (() => {
            const u = [e('RGBA'), e('BLUR')];
            u[0].soloed = true; // Solo the RGBA
            return u;
        })(),
        expectMatch: false,
        expectScoreBelow: 90,
    },

    // ── Greedy Pairer: Same-Type GRID Disambiguation ───────────────────────────────
    {
        name: 'Greedy Pairer: Same-Type GRID Disambiguation',
        description: 'Two GRIDs with very different sizes, in wrong order. They DO overlap → illegal swap. Tests that the pairer pairs small↔small and big↔big correctly.',
        // GRID 1: Pan X=40, Scale X=60 → bounds [10..70]
        // GRID 2: Pan X=60, Scale X=60 → bounds [30..90]
        // Overlap zone: [30..70] → swap is illegal.
        target: [
            e('GRID', { 'Pan X': 40, 'Scale X': 60 }), // bounds [10..70]
            e('GRID', { 'Pan X': 60, 'Scale X': 60 }), // bounds [30..90]
        ],
        user: [
            e('GRID', { 'Pan X': 60, 'Scale X': 60 }), // swapped
            e('GRID', { 'Pan X': 40, 'Scale X': 60 }),
        ],
        expectMatch: false,
        expectScoreBelow: 90,
    },

    // ── Color Sandwich Swap (Illegal) ──────────────────────────────────────────
    {
        name: 'Color Sandwich Swap (Illegal)',
        description: 'RGBA and INVERT both flank a TUNNEL_WARP in the target, and are reversed in the user. Color vs Color is NOT commutative.',
        target: [e('RGBA'), e('TUNNEL_WARP'), e('INVERT')],
        user: [e('INVERT'), e('TUNNEL_WARP'), e('RGBA')],
        expectMatch: false,
        expectScoreBelow: 90,
    },

    // ── Cross-Type Spatial Swap ───────────────────────────────────────────────
    {
        name: 'Cross-Type Spatial Non-Overlap Swap (Legal)',
        description: "A SHAPE on the far left and a CELLULAR_NOISE on the far right — different effect types but both have Pan X + Scale X. They don't intersect → commutative. Tests the generalized hasSpatialBounds() logic.",
        target: [
            e('SHAPE', { 'Pan X': 5, 'Scale X': 10 }),
            e('CELLULAR_NOISE', { 'Pan X': 95, 'Scale X': 10 }),
        ],
        user: [
            e('CELLULAR_NOISE', { 'Pan X': 95, 'Scale X': 10 }),
            e('SHAPE', { 'Pan X': 5, 'Scale X': 10 }),
        ],
        expectMatch: true,
        expectScoreAbove: 90,
    },

    // ── Melded Effect Mismatch ──────────────────────────────────────────
    {
        name: 'Melded Effect Mismatch',
        description: 'Same types and params, but user has GRAIN melded when target does not. Melded changes compositing — should fail.',
        target: [e('RGBA'), e('GRAIN')],
        user: (() => {
            const u = [e('RGBA'), e('GRAIN')];
            u[1].melded = true; // Meld the GRAIN
            return u;
        })(),
        expectMatch: false,
        expectScoreBelow: 90,
    },
    // ── Whole Group Swap (Legal: Non-Overlapping Anchors) ─────────────────────
    {
        name: 'Whole Group Swap Legal (Non-Overlapping)',
        description:
            '[Grid1(melded), RGBA], [Grid2] swapped to [Grid2], [Grid1(melded), RGBA]. ' +
            'Anchors do not spatially overlap → legal whole-group swap.',
        // Grid1 anchor bounds: [0..10]. Grid2 anchor bounds: [90..100]. No overlap.
        target: [
            meld(e('GRID', { 'Pan X': 5, 'Scale X': 10 })), e('RGBA'),
            e('GRID', { 'Pan X': 95, 'Scale X': 10 }),
        ],
        user: [
            e('GRID', { 'Pan X': 95, 'Scale X': 10 }),
            meld(e('GRID', { 'Pan X': 5, 'Scale X': 10 })), e('RGBA'),
        ],
        expectMatch: true,
        expectScoreAbove: 90,
    },

    // ── Whole Group Swap (Illegal: Overlapping Anchors) ─────────────────────
    {
        name: 'Whole Group Swap Illegal (Overlapping)',
        description:
            'Same structure as above but anchors overlap → groups are NOT commutative. Should fail.',
        // Grid1 anchor bounds: [10..70]. Grid2 anchor bounds: [30..90]. Overlap at [30..70].
        target: [
            meld(e('GRID', { 'Pan X': 40, 'Scale X': 60 })), e('RGBA'),
            e('GRID', { 'Pan X': 60, 'Scale X': 60 }),
        ],
        user: [
            e('GRID', { 'Pan X': 60, 'Scale X': 60 }),
            meld(e('GRID', { 'Pan X': 40, 'Scale X': 60 })), e('RGBA'),
        ],
        expectMatch: false,
        expectScoreBelow: 90,
    },

    // ── Within-Group Reorder (Illegal: Anchor Swapped) ───────────────────────
    {
        name: 'Within-Group Reorder (Illegal: Anchor Swapped)',
        description:
            'Target: [GRAIN(melded), RGBA]. User: [RGBA(melded), GRAIN]. ' +
            'Swapping the anchor fundamentally changes the base layer. Should fail.',
        target: [meld(e('GRAIN')), e('RGBA')],
        user: [meld(e('RGBA')), e('GRAIN')],
        expectMatch: false,
        expectScoreBelow: 90,
    },

    // ── Within-Group Reorder (Legal: Commutative Modifiers) ───────────────────
    {
        name: 'Within-Group Reorder (Legal: Commutative Modifiers)',
        description:
            'Target: [GRID(m), RGBA(m), TUNNEL_WARP(!m)]. User: [GRID(m), TUNNEL_WARP(m), RGBA(!m)]. ' +
            'Modifiers inside a group are greedily matched and then verified for commutativity. ' +
            'Since RGBA is passthrough, traversing TUNNEL_WARP is valid.',
        target: [meld(e('GRID')), meld(e('RGBA')), e('TUNNEL_WARP')],
        user: [meld(e('GRID')), meld(e('TUNNEL_WARP')), e('RGBA')],
        expectMatch: true,
        expectScoreAbove: 90,
    },

    // ── Within-Group Reorder (Illegal: Non-Commutative Modifiers) ──────────────
    {
        name: 'Within-Group Reorder (Illegal: Non-Commutative Modifiers)',
        description: 'Swapping two UV modifiers (e.g. SKEW and TUNNEL_WARP) that do not explicitly commute causes a structural penalty even inside a group.',
        target: [meld(e('GRID')), meld(e('SKEW')), e('TUNNEL_WARP')],
        user: [meld(e('GRID')), meld(e('TUNNEL_WARP')), e('SKEW')],
        expectMatch: false,
        expectScoreBelow: 90,
    },

    // ── Group Member Detached (Illegal) ───────────────────────────────────
    {
        name: 'Group Member Detached (Illegal)',
        description:
            'RGBA was melded with Grid1 in the target. In the user it is a standalone ' +
            'group. Breaking the meld chain changes the composite → should fail.',
        target: [
            meld(e('GRID', { 'Pan X': 5, 'Scale X': 10 })), e('RGBA'),  // Group A: GRID(m)+RGBA
            e('GRID', { 'Pan X': 95, 'Scale X': 10 }),                    // Group B: GRID
        ],
        user: [
            e('GRID', { 'Pan X': 5, 'Scale X': 10 }),  // GRID standalone (not melded)
            e('RGBA'),                                    // RGBA standalone (not melded)
            e('GRID', { 'Pan X': 95, 'Scale X': 10 }),  // GRID standalone
        ],
        expectMatch: false,
        expectScoreBelow: 90,
    },
    // ── Deep Meta-Shuffle (Legal) ──────────────────────────────────────────
    {
        name: 'Deep Meta-Shuffle (Legal)',
        description:
            'Target: [G1(m), RGBA(m), TUNNEL_WARP], [G2]. ' +
            'User:   [G2], [G1(m), TUNNEL_WARP(m), RGBA]. ' +
            'Both a whole-group swap AND an internal modifier shuffle. Should pass.',
        // G1 anchor: [0..10]. G2 anchor: [90..100]. Groups are commutative.
        // RGBA (Color) and TUNNEL_WARP (Space) are commutative: internal commute is legal.
        target: [
            meld(e('GRID', { 'Pan X': 5, 'Scale X': 10 })), meld(e('RGBA')), e('TUNNEL_WARP'),
            e('GRID', { 'Pan X': 95, 'Scale X': 10 }),
        ],
        user: [
            e('GRID', { 'Pan X': 95, 'Scale X': 10 }),
            meld(e('GRID', { 'Pan X': 5, 'Scale X': 10 })), meld(e('TUNNEL_WARP')), e('RGBA'),
        ],
        expectMatch: true,
        expectScoreAbove: 90,
    },

    // ── Color vs Color (Illegal) ──────────────────────────────────────────
    {
        name: 'Color vs Color (Illegal)',
        description: 'Swapping two Color effects (RGBA and HUE_ROTATION) is not commutative. Should fail.',
        target: [e('RGBA'), e('HUE_ROTATION')],
        user: [e('HUE_ROTATION'), e('RGBA')],
        expectMatch: false,
        expectScoreBelow: 90,
    },

    // ── Transitive Non-Commutativity (Illegal) ──────────────────────────────
    {
        name: 'Transitive Non-Commutativity (Illegal)',
        description:
            'Target: [RGBA, GRID, TUNNEL]. User: [TUNNEL, GRID, RGBA]. ' +
            'Even though RGBA commutes with both, GRID and TUNNEL do not commute with each other. ' +
            'Their relative order is flipped → should fail.',
        target: [e('RGBA'), e('GRID'), e('TUNNEL_WARP')],
        user: [e('TUNNEL_WARP'), e('GRID'), e('RGBA')],
        expectMatch: false,
        expectScoreBelow: 90,
    },

    // ── Soloed Modifier inside Meld Chain (Illegal) ──────────────────────────
    {
        name: 'Soloed Modifier inside Meld Chain (Illegal)',
        description: 'Soloing a modifier (RGBA) inside a meld chain should incur a major penalty.',
        target: [meld(e('GRID')), e('RGBA')],
        user: (() => {
            const u = [meld(e('GRID')), e('RGBA')];
            u[1].soloed = true; // Solo the child
            return u;
        })(),
        expectMatch: false,
        expectScoreBelow: 90,
    },

    // ── Muted Modifier inside Meld Chain (Illegal) ───────────────────────────
    {
        name: 'Muted Modifier inside Meld Chain (Illegal)',
        description: 'Muting a modifier (RGBA) inside a meld chain should incur a major penalty.',
        target: [meld(e('GRID')), e('RGBA')],
        user: (() => {
            const u = [meld(e('GRID')), e('RGBA')];
            u[1].muted = true; // Mute the child
            return u;
        })(),
        expectMatch: false,
        expectScoreBelow: 90,
    },
];


// ─────────────────────────────────────────────────────────────────────────────
// Runner
// ─────────────────────────────────────────────────────────────────────────────

export function runAllTests(): TestResult[] {
    return TEST_CASES.map((tc) => {
        const result = PuzzleService.evaluate(tc.user, tc.target);

        const matchOk = result.isMatch === tc.expectMatch;
        const aboveOk = tc.expectScoreAbove === undefined || result.score >= tc.expectScoreAbove;
        const belowOk = tc.expectScoreBelow === undefined || result.score < tc.expectScoreBelow;
        const passed = matchOk && aboveOk && belowOk;

        const reasons: string[] = [];
        if (!matchOk) reasons.push(`isMatch was ${result.isMatch}, expected ${tc.expectMatch}`);
        if (!aboveOk) reasons.push(`score ${result.score} < expected min ${tc.expectScoreAbove}`);
        if (!belowOk) reasons.push(`score ${result.score} >= expected max ${tc.expectScoreBelow}`);

        return {
            name: tc.name,
            description: tc.description,
            passed,
            result,
            expected: {
                isMatch: tc.expectMatch,
                scoreAbove: tc.expectScoreAbove,
                scoreBelow: tc.expectScoreBelow,
            },
            reason: reasons.join('; ') || 'All assertions passed.',
        };
    });
}
