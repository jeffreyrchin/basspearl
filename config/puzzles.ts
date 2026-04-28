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
        difficulty: 'Hard',
        macro: 'DISCO_BALL',
        allowedEffects: [
            'TERRAIN_SPHERE', 'SPECTRAL_MAP', 'GLOW', 'GRAIN'
        ]
    },
    {
        locked: false,
        difficulty: 'Medium',
        macro: 'LIQUID',
        allowedEffects: [
            'ORGANIC_NOISE', 'TERRAIN', 'SPECTRAL_MAP', 'GLOW'
        ]
    }
];
