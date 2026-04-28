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
    overrides: Record<string, number | string> = {}
): EffectConfig => {
    const instance = createEffectInstance(type);
    if (Object.keys(overrides).length > 0) {
        instance.params = instance.params.map(p => {
            const val = overrides[p.param];
            const min = overrides[`${p.param}:min` as string];
            const band = overrides[`${p.param}:band` as string];

            return {
                ...p,
                value: typeof val === 'number' ? val : p.value,
                min: typeof min === 'number' ? min : p.min,
                frequencyBand: (typeof band === 'string' ? band : p.frequencyBand) as any,
            };
        });
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

/**
 * Legacy runner for the in-app PuzzleTestPage dashboard.
 * Vitest ignores this, but the browser-based test page requires it.
 */
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
        description: 'Red overridden to 95 (default is 100). Within 10-unit tolerance — should still win.',
        // Default RGBA: Red=100 Green=100 Blue=100 Opacity=100
        user: [e('RGBA', { Red: 95 })],
        target: [e('RGBA', { Red: 100 })],
        expectMatch: true,
        expectScoreAbove: 90,
    },

    // ── Wrong Parameters ──────────────────────────────────────────────────────
    {
        name: 'Incorrect Params',
        description: 'TUNNEL_WARP Scale overridden to 80 vs default 20. Should fail.',
        // Default TUNNEL_WARP: Scale=20
        user: [e('TUNNEL_WARP', { Scale: 80 })],
        target: [e('TUNNEL_WARP')],
        expectMatch: false,
        expectScoreBelow: 80,
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
        description: 'Muting a modifier (RGBA) inside a meld chain occurs a -25 penalty. At 80% threshold, it fails with a 75.',
        target: [meld(e('GRID')), e('RGBA')],
        user: (() => {
            const u = [meld(e('GRID')), e('RGBA')];
            u[1].muted = true;
            return u;
        })(),
        expectMatch: false,
        expectScoreBelow: 80,
    },

    // ── Frequency Band Mismatch (Legal) ──────────────────────────────────────────────
    {
        name: 'Frequency Band Mismatch (Passable)',
        description: 'User has Red set to BASS while target is OFF. Incurs -10 penalty, scores 90. Should pass.',
        target: [e('RGBA')],
        user: [e('RGBA', { 'Red:band': 'BASS' })],
        expectMatch: true,
        expectScoreAbove: 90,
    },

    // ── Frequency Band Match (Legal) ─────────────────────────────────────────
    {
        name: 'Frequency Band Match (Legal)',
        description: 'Target and User both use BASS for Red. Should be a perfect match.',
        target: [e('RGBA', { 'Red:band': 'BASS' })],
        user: [e('RGBA', { 'Red:band': 'BASS' })],
        expectMatch: true,
        expectScoreAbove: 95,
    },

    // ── Multiple Frequency Band Mismatches (Illegal) ─────────────────────────
    {
        name: 'Multiple Frequency Band Mismatches (Illegal)',
        description: 'Three separate parameters have the wrong band setting. Penalties stack to -30, score 70. Should fail.',
        target: [e('RGBA')],
        user: [e('RGBA', { 'Red:band': 'BASS', 'Blue:band': 'TREBLE', 'Green:band': 'BASS' })],
        expectMatch: false,
        expectScoreBelow: 80,
    },

    // ── Frequency Band Mismatch in Melded Group (Legal) ────────────────────
    {
        name: 'Frequency Band Mismatch in Melded Group (Passable)',
        description: 'Inside a meld chain, a single band mismatch on a modifier scores 90. Passes.',
        target: [meld(e('GRID')), e('RGBA')],
        user: [meld(e('GRID')), e('RGBA', { 'Red:band': 'BASS' })],
        expectMatch: true,
        expectScoreAbove: 90,
    },

    // ── Commutative Band Match (Legal) ──────────────────────────────────────
    {
        name: 'Commutative Band Match (Legal)',
        description: 'RGBA (BASS) and ROTATE swapped. Swapping is legal, and BASS matches BASS. Should pass.',
        target: [e('RGBA', { 'Red:band': 'BASS' }), e('ROTATE')],
        user: [e('ROTATE'), e('RGBA', { 'Red:band': 'BASS' })],
        expectMatch: true,
        expectScoreAbove: 95,
    },
    // ── Min Mismatch (Legal) ───────────────────────
    {
        name: 'Min Mismatch (Passable)',
        description: 'Target Min=50 while User Min=0. Incurs -10 penalty, score 90. Passes.',
        target: [e('RGBA', { 'Red:band': 'BASS', 'Red:min': 50, Red: 100 })],
        user: [e('RGBA', { 'Red:band': 'BASS', 'Red:min': 0, Red: 100 })],
        expectMatch: true,
        expectScoreAbove: 90,
    },
    // -- Multiple Min Mismatches (Illegal)
    {
        name: 'Multiple Min Mismatches (Illegal)',
        description: 'Three separate parameters have the wrong min setting. Penalties stack to -30, score 70. Should fail.',
        target: [e('RGBA', { 'Red:band': 'BASS', 'Red:min': 50, Red: 100, 'Blue:band': 'BASS', 'Blue:min': 50, Blue: 100, 'Green:band': 'BASS', 'Green:min': 50, Green: 100 })],
        user: [e('RGBA', { 'Red:band': 'BASS', 'Red:min': 0, Red: 100, 'Blue:band': 'BASS', 'Blue:min': 0, Blue: 100, 'Green:band': 'BASS', 'Green:min': 0, Green: 100 })],
        expectMatch: false,
        expectScoreBelow: 80,
    },
    // -- Min Mismatch in Melded Group (Legal)
    {
        name: 'Min Mismatch in Melded Group (Passable)',
        description: 'Inside a meld chain, a single min mismatch on a modifier scores 90. Passes.',
        target: [meld(e('GRID')), e('RGBA', { 'Red:band': 'BASS', 'Red:min': 50, Red: 100 })],
        user: [meld(e('GRID')), e('RGBA', { 'Red:band': 'BASS', 'Red:min': 0, Red: 100 })],
        expectMatch: true,
        expectScoreAbove: 90,
    },
    // ── Commutative Min Match (Legal) ──────────────────────────────────────
    {
        name: 'Commutative Min Match (Legal)',
        description: 'RGBA (BASS) and ROTATE swapped. Swapping is legal, and Min matches Min. Should pass.',
        target: [e('RGBA', { 'Red:band': 'BASS', 'Red:min': 50, Red: 100 }), e('ROTATE')],
        user: [e('ROTATE'), e('RGBA', { 'Red:band': 'BASS', 'Red:min': 50, Red: 100 })],
        expectMatch: true,
        expectScoreAbove: 95,
    },
    // ─────────────────────────────────────────────────────────────────────────
    // RULE-BASED COMMUTATIVITY TESTS
    // ─────────────────────────────────────────────────────────────────────────

    // ── Rule 1: Point Ops vs ALL Spatial Ops (Legal) ─────────────────────────
    {
        name: 'Point Op vs Non-Uniform Warp Swap (Legal)',
        description:
            'Pure Point Ops (INVERT, RGBA) distribute over all spatial transforms. ' +
            'Inverting then Rotating is identical to Rotating then Inverting.',
        target: [e('INVERT'), e('ROTATE')],
        user: [e('ROTATE'), e('INVERT')],
        expectMatch: true,
        expectScoreAbove: 90,
    },
    {
        name: 'Point Op vs Uniform Warp Swap (Legal)',
        description: 'INVERT and SCROLL (Uniform Warp) should commute perfectly.',
        target: [e('INVERT'), e('SCROLL')],
        user: [e('SCROLL'), e('INVERT')],
        expectMatch: true,
        expectScoreAbove: 90,
    },
    {
        name: 'Point Op vs Isotropic Filter Swap (Legal)',
        description: 'RGBA and BLUR should commute. Linear color math and isotropic convolution are distributive.',
        target: [e('RGBA'), e('BLUR')],
        user: [e('BLUR'), e('RGBA')],
        expectMatch: true,
        expectScoreAbove: 90,
    },
    {
        name: 'Point Op vs Adaptive Op (Illegal)',
        description:
            'Point Ops (INVERT) and Adaptive Ops (LUMINANCE_MASK) do NOT commute. ' +
            'Inverting the image changes which pixels hit the mask threshold.',
        target: [e('INVERT'), e('LUMINANCE_MASK')],
        user: [e('LUMINANCE_MASK'), e('INVERT')],
        expectMatch: false,
        expectScoreBelow: 80,
    },

    // ── Rule 2: Intersecting Patterns ────────────────────────────
    {
        name: 'Non-Intersecting Patterns (Legal)',
        description: 'Two GRIDs far apart spatially — order is irrelevant.',
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
        expectScoreBelow: 80,
    },

    // ── Rule 3: Adaptive Ops vs UV Warps ──────────────
    {
        name: 'Adaptive Op vs Non-Uniform UV Warp Swap (Legal)',
        description:
            'LUMINANCE_MASK reads per-pixel luma. ROTATE is a pure UV warp that never ' +
            'changes luma values, only which pixel is sampled. The same luma ends up ' +
            'at each screen position either way.',
        target: [e('LUMINANCE_MASK'), e('ROTATE')],
        user: [e('ROTATE'), e('LUMINANCE_MASK')],
        expectMatch: true,
        expectScoreAbove: 90,
    },
    {
        name: 'Adaptive Op vs Uniform Warp Swap (Legal)',
        description:
            'LUMINANCE_MASK and SCROLL (Uniform Warp) commute because SCROLL preserves ' +
            'the content of every pixel. A pixel\'s brightness remains the same ' +
            'regardless of where on the screen it is translated.',
        target: [e('LUMINANCE_MASK'), e('SCROLL')],
        user: [e('SCROLL'), e('LUMINANCE_MASK')],
        expectMatch: true,
        expectScoreAbove: 90,
    },
    {
        name: 'Adaptive Op vs Isotropic Filter (Illegal)',
        description:
            'LUMINANCE_MASK and BLUR do NOT commute. If you mask then blur, the black ' +
            'pixels bleed into neighbors. If you blur then mask, the neighbors mix ' +
            'their original brightness before the mask is applied.',
        target: [e('LUMINANCE_MASK'), e('BLUR')],
        user: [e('BLUR'), e('LUMINANCE_MASK')],
        expectMatch: false,
        expectScoreBelow: 80,
    },
    // ── Rule 4: Isotropic Filters vs Uniform Warps (Legal) ────────────────
    {
        name: 'Isotropic Filter vs Uniform Warp Swap (Legal)',
        description:
            'GLOW is an Isotropic Filter (Translation Invariant). SCROLL is a ' +
            'Uniform Warp (Pure Translation). They commute due to translation invariance.',
        target: [e('SCROLL'), e('GLOW')],
        user: [e('GLOW'), e('SCROLL')],
        expectMatch: true,
        expectScoreAbove: 90,
    },

    // ── Isotropic Filters vs Non-Uniform Warps (Illegal) ────────────────
    {
        name: 'Isotropic Filter vs Non-Uniform Warp (Illegal)',
        description:
            'GLOW (Filter) and ROTATE (Non-Uniform Warp) are NOT commutative. ' +
            'Boundary conditions and aspect ratio math make rotation order-dependent.',
        target: [e('GLOW'), e('ROTATE')],
        user: [e('ROTATE'), e('GLOW')],
        expectMatch: false,
        expectScoreBelow: 80,
    },

    // ── Rule 5: Uniform Warp vs Uniform Warp (Legal) ─────────────────────────
    {
        name: 'Uniform Warp vs Uniform Warp Swap (Legal)',
        description: 'Two Uniform Warps (SCROLL + SCREEN_SHAKE) are just vector additions. Addition commutes.',
        target: [e('SCROLL'), e('SCREEN_SHAKE')],
        user: [e('SCREEN_SHAKE'), e('SCROLL')],
        expectMatch: true,
        expectScoreAbove: 90,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // CONDITIONAL COMMUTATIVITY (Parameter-Aware)
    // ─────────────────────────────────────────────────────────────────────────

    // ── BIT_CRUSH vs POINT_OPS ────────────────────────────────
    {
        name: 'Bit Crush (Warp Only) vs Invert (Legal)',
        description:
            'BIT_CRUSH with Posterize=0 is a pure UV warp (Pixelation). ' +
            'It should commute with Point Ops like INVERT.',
        target: [e('BIT_CRUSH', { Posterize: 0 }), e('INVERT')],
        user: [e('INVERT'), e('BIT_CRUSH', { Posterize: 0 })],
        expectMatch: true,
        expectScoreAbove: 90,
    },
    {
        name: 'Bit Crush (with Posterize) vs Invert (Illegal)',
        description:
            'BIT_CRUSH with Posterize=50 is a data-altering Point Op. ' +
            'It no longer commutes with other Point Ops (Invert).',
        target: [e('BIT_CRUSH', { Posterize: 50 }), e('INVERT')],
        user: [e('INVERT'), e('BIT_CRUSH', { Posterize: 50 })],
        expectMatch: false,
        expectScoreBelow: 80,
    },

    // ── BIT_CRUSH vs ADAPTIVE_OPS ────────────────────────────────────────────
    {
        name: 'Bit Crush (Warp Only) vs Adaptive Op (Legal)',
        description:
            'BIT_CRUSH with Posterize=0 preserves pixel content. ' +
            'It should commute with Adaptive Ops like LUMINANCE_MASK.',
        target: [e('BIT_CRUSH', { Posterize: 0 }), e('LUMINANCE_MASK')],
        user: [e('LUMINANCE_MASK'), e('BIT_CRUSH', { Posterize: 0 })],
        expectMatch: true,
        expectScoreAbove: 90,
    },
    {
        name: 'Bit Crush (with Posterize) vs Adaptive Op (Illegal)',
        description:
            'BIT_CRUSH with Posterize=50 alters pixel luma. This changes ' +
            'what the mask sees, making the order-dependent swap illegal.',
        target: [e('BIT_CRUSH', { Posterize: 50 }), e('LUMINANCE_MASK')],
        user: [e('LUMINANCE_MASK'), e('BIT_CRUSH', { Posterize: 50 })],
        expectMatch: false,
        expectScoreBelow: 80,
    },

    // ── TERRAIN vs POINT_OPS ──────────────────────────────────
    {
        name: 'Terrain (Warp Only) vs RGBA (Legal)',
        description:
            'TERRAIN with Extrusion=0 is a pure coordinate displacement. ' +
            'It should commute with Point Ops like RGBA.',
        target: [e('TERRAIN', { Extrusion: 0 }), e('RGBA')],
        user: [e('RGBA'), e('TERRAIN', { Extrusion: 0 })],
        expectMatch: true,
        expectScoreAbove: 90,
    },
    {
        name: 'Terrain (with Extrusion) vs RGBA (Illegal)',
        description:
            'TERRAIN with Extrusion=10 generates new lighting/3D data. ' +
            'It becomes Strict and no longer commutes with Point Ops.',
        target: [e('TERRAIN', { Extrusion: 10 }), e('RGBA')],
        user: [e('RGBA'), e('TERRAIN', { Extrusion: 10 })],
        expectMatch: false,
        expectScoreBelow: 80,
    },

    // ── TERRAIN vs ADAPTIVE_OPS ──────────────────────────────────
    {
        name: 'Terrain (Warp Only) vs Adaptive Op (Legal)',
        description:
            'TERRAIN with Extrusion=0 preserves pixel content. ' +
            'It should commute with Adaptive Ops like LUMINANCE_MASK.',
        target: [e('TERRAIN', { Extrusion: 0 }), e('LUMINANCE_MASK')],
        user: [e('LUMINANCE_MASK'), e('TERRAIN', { Extrusion: 0 })],
        expectMatch: true,
        expectScoreAbove: 90,
    },
    {
        name: 'Terrain (with Extrusion) vs Adaptive Op (Illegal)',
        description:
            'TERRAIN with Extrusion=10 generates new lighting/3D data. ' +
            'It becomes Strict and no longer commutes with Adaptive Ops.',
        target: [e('TERRAIN', { Extrusion: 10 }), e('LUMINANCE_MASK')],
        user: [e('LUMINANCE_MASK'), e('TERRAIN', { Extrusion: 10 })],
        expectMatch: false,
        expectScoreBelow: 80,
    },

    // ─────────────────────────────────────────────────────────────────────────────
    // CYCLIC PARAMETERS
    // ─────────────────────────────────────────────────────────────────────────────

    {
        name: 'Cyclic Parameter Identity (0 vs 100)',
        description: 'Rotation is cyclic. 0 and 100 are visually identical. Should score 100.',
        target: [e('ROTATE', { Rotation: 0 })],
        user: [e('ROTATE', { Rotation: 100 })],
        expectMatch: true,
        expectScoreAbove: 99,
    },
    {
        name: 'Cyclic Parameter Proximity (5 vs 95)',
        description: 'On a 0-100 loop, 5 and 95 are only 10 units apart. Should pass.',
        target: [e('ROTATE', { Rotation: 5 })],
        user: [e('ROTATE', { Rotation: 95 })],
        expectMatch: true,
        expectScoreAbove: 90,
    },
];


// ─────────────────────────────────────────────────────────────────────────────
// Vitest Suite
// ─────────────────────────────────────────────────────────────────────────────
//
// Each entry in TEST_CASES becomes its own named test.
// We wrap this in a check so the browser doesn't crash when importing this file.
//
if (typeof describe !== 'undefined') {
    describe('PuzzleService.evaluate', () => {
        describe('Score & Match assertions', () => {
            for (const tc of TEST_CASES) {
                it(tc.name, () => {
                    const result = PuzzleService.evaluate(tc.user, tc.target);

                    // isMatch must be exactly what the test case expects
                    expect(result.isMatch).toBe(tc.expectMatch);

                    // Score lower bound (if specified)
                    if (tc.expectScoreAbove !== undefined) {
                        expect(result.score).toBeGreaterThanOrEqual(tc.expectScoreAbove);
                    }

                    // Score upper bound (if specified)
                    if (tc.expectScoreBelow !== undefined) {
                        expect(result.score).toBeLessThan(tc.expectScoreBelow);
                    }
                });
            }
        });

        describe('Edge cases', () => {
            it('returns a numeric score between 0 and 100 for any input', () => {
                const result = PuzzleService.evaluate([e('RGBA')], [e('TUNNEL_WARP')]);
                expect(result.score).toBeGreaterThanOrEqual(0);
                expect(result.score).toBeLessThanOrEqual(100);
            });

            it('provides non-empty feedback for every result', () => {
                const result = PuzzleService.evaluate([e('RGBA')], [e('RGBA')]);
                expect(result.feedback).toBeTruthy();
            });
        });
    });
}
