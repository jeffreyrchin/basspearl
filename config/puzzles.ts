import { PuzzleConfig } from '../types';

export const PUZZLES: PuzzleConfig[] = [
    {
        locked: false,
        difficulty: 'Easy',
        macro: 'SPIRAL_GLOW',
        allowedEffects: [
            // The Solution
            'SPIRAL_GRADIENT', 'SPECTRAL_MAP', 'GLOW',

            // Red Herrings (Patterns)
            'RADIAL_GRADIENT', 'LINEAR_GRADIENT', 'GRID',
            // Red Herrings (Colors)
            'RGBA', 'INVERT',
            // Red Herrings (Modifiers)
            'BLUR', 'WAVE_DISTORTION', 'TUNNEL_WARP'
        ]
    }
];
