import { PuzzleConfig } from '../types';

export const PUZZLES: PuzzleConfig[] = [
    {
        difficulty: 'Easy',
        macro: 'SPIRAL_GLOW',
        allowedEffects: [
            'SPIRAL_GRADIENT', 'SPECTRAL_MAP', 'GLOW'
        ]
    },
    {
        difficulty: 'Easy',
        macro: 'AURORA',
        allowedEffects: [
            'ORGANIC_NOISE', 'SPECTRAL_MAP', 'GLOW'
        ]
    },
    {
        difficulty: 'Easy',
        macro: 'TEETH',
        allowedEffects: [
            'CELLULAR_NOISE', 'TERRAIN'
        ]
    },
    {
        difficulty: 'Easy',
        macro: 'SEARCHLIGHTS',
        allowedEffects: [
            'SPIRAL_GRADIENT', 'SCROLL', 'SPECTRAL_MAP', 'GLOW'
        ]
    },
    {
        difficulty: 'Easy',
        macro: 'GRAIN_TUNNEL',
        allowedEffects: [
            'GRAIN', 'HUE_ROTATION', 'TUNNEL_WARP'
        ]
    },
    {
        difficulty: 'Medium',
        macro: 'RUSH_HOUR',
        allowedEffects: [
            'GRAIN', 'HUE_ROTATION', 'GLOW', 'SCROLL', 'INFINITE_ZOOM'
        ]
    },
    {
        difficulty: 'Medium',
        macro: 'STREAKS',
        allowedEffects: [
            'GRID', 'WAVE_DISTORTION', 'TUNNEL_WARP', 'HUE_ROTATION'
        ]
    },
    {
        difficulty: 'Medium',
        macro: 'CRYOGENIC_FLUID',
        allowedEffects: [
            'SHAPE', 'ORGANIC_NOISE', 'TERRAIN'
        ]
    },
    {
        difficulty: 'Medium',
        macro: 'ARCS',
        allowedEffects: [
            'GRAIN', 'HUE_ROTATION', 'GLOW', 'TUNNEL_WARP'
        ]
    },
    {
        difficulty: 'Medium',
        macro: 'LANDSCAPE',
        allowedEffects: [
            'GRAIN', 'TERRAIN', 'RGBA'
        ]
    },
    {
        difficulty: 'Medium',
        macro: 'STORM',
        allowedEffects: [
            'ORGANIC_NOISE', 'SPIRAL_GRADIENT', 'TERRAIN'
        ]
    },
    {
        difficulty: 'Medium',
        macro: 'SQUARE_RIPPLES',
        allowedEffects: [
            'RADIAL_GRADIENT', 'BIT_CRUSH', 'TERRAIN', 'RGBA'
        ]
    },
    {
        difficulty: 'Hard',
        macro: 'DISCO_BALL',
        allowedEffects: [
            'TERRAIN_SPHERE', 'SPECTRAL_MAP', 'GLOW', 'GRAIN'
        ]
    },
    {
        difficulty: 'Hard',
        macro: 'FLAMES',
        allowedEffects: [
            'ORGANIC_NOISE', 'PARTICLES', 'RGBA', 'LUMINANCE_MASK', 'GLOW'
        ]
    },
    {
        difficulty: 'Hard',
        macro: 'WAXY_STARS',
        allowedEffects: [
            'SHAPE', 'TILE', 'SPECTRAL_MAP', 'TERRAIN'
        ]
    }
];
