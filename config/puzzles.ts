import { PuzzleType, PuzzleMetadata } from '../types';

export const PUZZLE_ORDER: PuzzleType[] = [
    'TEETH',
    'AURORA',
    'SPIRAL_GLOW',
    'SEARCHLIGHTS',
    'GRAIN_TUNNEL',
    'RUSH_HOUR',
    'STREAKS',
    'CRYOGENIC_FLUID',
    'ARCS',
    'LANDSCAPE',
    'STORM',
    'SQUARE_RIPPLES',
    'STAR_MORPH',
    'FIRE_RING',
    'WAXY_STARS'
];

export const PUZZLES: Record<PuzzleType, PuzzleMetadata> = {
    SPIRAL_GLOW: {
        difficulty: 'Easy',
        macro: 'SPIRAL_GLOW',
        allowedEffects: [
            'SPIRAL_GRADIENT', 'SPECTRAL_MAP', 'GLOW'
        ]
    },
    AURORA: {
        difficulty: 'Easy',
        macro: 'AURORA',
        allowedEffects: [
            'ORGANIC_NOISE', 'SPECTRAL_MAP', 'GLOW'
        ]
    },
    TEETH: {
        difficulty: 'Easy',
        macro: 'TEETH',
        allowedEffects: [
            'CELLULAR_NOISE', 'TERRAIN'
        ]
    },
    SEARCHLIGHTS: {
        difficulty: 'Easy',
        macro: 'SEARCHLIGHTS',
        allowedEffects: [
            'SPIRAL_GRADIENT', 'SCROLL', 'SPECTRAL_MAP', 'GLOW'
        ]
    },
    GRAIN_TUNNEL: {
        difficulty: 'Easy',
        macro: 'GRAIN_TUNNEL',
        allowedEffects: [
            'GRAIN', 'HUE_ROTATION', 'TUNNEL_WARP'
        ]
    },
    RUSH_HOUR: {
        difficulty: 'Medium',
        macro: 'RUSH_HOUR',
        allowedEffects: [
            'GRAIN', 'HUE_ROTATION', 'GLOW', 'SCROLL', 'INFINITE_ZOOM'
        ]
    },
    STREAKS: {
        difficulty: 'Medium',
        macro: 'STREAKS',
        allowedEffects: [
            'GRID', 'WAVE_DISTORTION', 'TUNNEL_WARP', 'HUE_ROTATION'
        ]
    },
    CRYOGENIC_FLUID: {
        difficulty: 'Medium',
        macro: 'CRYOGENIC_FLUID',
        allowedEffects: [
            'SHAPE', 'ORGANIC_NOISE', 'TERRAIN'
        ]
    },
    ARCS: {
        difficulty: 'Medium',
        macro: 'ARCS',
        allowedEffects: [
            'GRAIN', 'HUE_ROTATION', 'GLOW', 'TUNNEL_WARP'
        ]
    },
    LANDSCAPE: {
        difficulty: 'Medium',
        macro: 'LANDSCAPE',
        allowedEffects: [
            'GRAIN', 'TERRAIN', 'RGBA'
        ]
    },
    STORM: {
        difficulty: 'Medium',
        macro: 'STORM',
        allowedEffects: [
            'ORGANIC_NOISE', 'SPIRAL_GRADIENT', 'TERRAIN'
        ]
    },
    SQUARE_RIPPLES: {
        difficulty: 'Medium',
        macro: 'SQUARE_RIPPLES',
        allowedEffects: [
            'RADIAL_GRADIENT', 'BIT_CRUSH', 'TERRAIN', 'RGBA'
        ]
    },
    STAR_MORPH: {
        difficulty: 'Hard',
        macro: 'STAR_MORPH',
        allowedEffects: [
            'GRAIN', 'KALEIDOSCOPE', 'SPECTRAL_MAP', 'GLOW'
        ]
    },
    FIRE_RING: {
        difficulty: 'Hard',
        macro: 'FIRE_RING',
        allowedEffects: [
            'ORGANIC_NOISE', 'SPECTRAL_MAP', 'TERRAIN_RING', 'GLOW'
        ]
    },
    WAXY_STARS: {
        difficulty: 'Hard',
        macro: 'WAXY_STARS',
        allowedEffects: [
            'SHAPE', 'TILE', 'SPECTRAL_MAP', 'TERRAIN'
        ]
    }
};
