import { PuzzleConfig } from '../types';

export const PUZZLES: PuzzleConfig[] = [
    {
        locked: false,
        difficulty: 'Easy',
        macro: 'SPIRAL_GLOW',
        allowedEffects: [
            'SPIRAL_GRADIENT', 'SPECTRAL_MAP', 'GLOW'
        ]
    },
    {
        locked: false,
        difficulty: 'Easy',
        macro: 'AURORA',
        allowedEffects: [
            'ORGANIC_NOISE', 'SPECTRAL_MAP', 'GLOW'
        ]
    },
    {
        locked: false,
        difficulty: 'Easy',
        macro: 'TEETH',
        allowedEffects: [
            'CELLULAR_NOISE', 'TERRAIN'
        ]
    },
    {
        locked: false,
        difficulty: 'Easy',
        macro: 'SEARCHLIGHTS',
        allowedEffects: [
            'SPIRAL_GRADIENT', 'SCROLL', 'SPECTRAL_MAP', 'GLOW'
        ]
    },
    {
        locked: false,
        difficulty: 'Easy',
        macro: 'GRAIN_TUNNEL',
        allowedEffects: [
            'GRAIN', 'HUE_ROTATION', 'TUNNEL_WARP'
        ]
    },
    {
        locked: false,
        difficulty: 'Medium',
        macro: 'RUSH_HOUR',
        allowedEffects: [
            'GRAIN', 'HUE_ROTATION', 'GLOW', 'SCROLL', 'INFINITE_ZOOM'
        ]
    },
    {
        locked: false,
        difficulty: 'Medium',
        macro: 'STREAKS',
        allowedEffects: [
            'GRID', 'WAVE_DISTORTION', 'TUNNEL_WARP', 'HUE_ROTATION'
        ]
    },
    {
        locked: false,
        difficulty: 'Medium',
        macro: 'CRYOGENIC_FLUID',
        allowedEffects: [
            'SHAPE', 'ORGANIC_NOISE', 'TERRAIN'
        ]
    },
    {
        locked: false,
        difficulty: 'Medium',
        macro: 'ARCS',
        allowedEffects: [
            'GRAIN', 'HUE_ROTATION', 'GLOW', 'TUNNEL_WARP'
        ]
    },
    {
        locked: false,
        difficulty: 'Medium',
        macro: 'LANDSCAPE',
        allowedEffects: [
            'GRAIN', 'TERRAIN', 'RGBA'
        ]
    },
    {
        locked: false,
        difficulty: 'Medium',
        macro: 'STORM',
        allowedEffects: [
            'ORGANIC_NOISE', 'SPIRAL_GRADIENT', 'TERRAIN'
        ]
    },
    {
        locked: false,
        difficulty: 'Medium',
        macro: 'SQUARE_RIPPLES',
        allowedEffects: [
            'RADIAL_GRADIENT', 'BIT_CRUSH', 'TERRAIN', 'RGBA'
        ]
    },
    {
        locked: false,
        difficulty: 'Hard',
        macro: 'DISCO_BALL',
        allowedEffects: [
            'TERRAIN_SPHERE', 'SPECTRAL_MAP', 'GLOW', 'GRAIN'
        ]
    },
    {
        locked: false,
        difficulty: 'Hard',
        macro: 'FLAMES',
        allowedEffects: [
            'ORGANIC_NOISE', 'PARTICLES', 'RGBA', 'LUMINANCE_MASK', 'GLOW'
        ]
    },
    {
        locked: false,
        difficulty: 'Hard',
        macro: 'WAXY_STARS',
        allowedEffects: [
            'SHAPE', 'TILE', 'SPECTRAL_MAP', 'TERRAIN'
        ]
    }
];
