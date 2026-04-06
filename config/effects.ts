import { GlitchEffectType, EffectMetadata, EffectParamMetadata, FrequencyBand } from '../types';

// Helper to slim down the effect parameter definitions
export const p = (
  name: string,
  d: { v: number; m?: number; b?: FrequencyBand }, // Default values
  p?: { v?: number; m?: number; b?: FrequencyBand } // Preview Overrides
): EffectParamMetadata => ({
  name,
  defaultValue: d.v,
  defaultMin: d.m,
  defaultBand: d.b || 'OFF',
  ...(p && {
    previewValue: p.v,
    previewMin: p.m,
    previewBand: p.b
  })
});

export const EFFECT_METADATA: Record<GlitchEffectType, EffectMetadata> = {
  PIXEL_SORT: {
    label: 'Pixel Sort',
    category: 'Modifier',
    params: [
      p('Streak Length', { v: 20 }, { v: 100, b: 'SUB' }),
      p('Trigger Level', { v: 50 }, { v: 75 }),
    ],
  },
  CHANNEL_SHIFT: {
    label: 'RGB Shift',
    category: 'Modifier',
    params: [
      p('Offset', { v: 20 }, { v: 100, b: 'SUB' }),
      p('Vertical Tear', { v: 20 }, { v: 100, b: 'SUB' }),
      p('Scale X', { v: 50 }),
      p('Scale Y', { v: 50 }),
      p('Pan X', { v: 50 }),
      p('Pan Y', { v: 50 }),
    ],
  },
  DATA_CORRUPTION: {
    label: 'Datamosh',
    category: 'Modifier',
    params: [
      p('Mosh Length', { v: 20 }, { v: 30, b: 'SUB' }),
      p('Mosh Density', { v: 100 }, { v: 50, b: 'SUB' }),
    ],
  },
  DEEP_FRY: {
    label: 'Incinerate',
    category: 'Modifier',
    params: [
      p('Heat', { v: 10 }, { v: 20, b: 'SUB' }),
      p('Posterize', { v: 65 }, { v: 50, b: 'SUB' }),
    ],
  },
  BIT_CRUSH: {
    label: 'Bitcrusher',
    category: 'Modifier',
    params: [
      p('Quantize', { v: 0 }),
      p('Resample', { v: 20 }, { v: 50, b: 'SUB' }),
      p('Scale X', { v: 50 }),
      p('Scale Y', { v: 50 }),
      p('Pan X', { v: 50 }),
      p('Pan Y', { v: 50 }),
    ],
  },
  WAVE_DISTORTION: {
    label: 'Wave Distortion',
    category: 'Modifier',
    params: [
      p('Amplitude', { v: 35, m: 11, b: 'BASS' }, { v: 33 }),
      p('Frequency', { v: 3 }, { v: 5 }),
      p('Speed', { v: 50, m: 5, b: 'BASS' }, { v: 5 }),
    ],
  },
  COLOR_BLEED: {
    label: 'Color Bleed',
    category: 'Modifier',
    params: [
      p('Bleed', { v: 40 }, { v: 30, b: 'SUB' }),
      p('Ghosting', { v: 18 }, { v: 30, b: 'SUB' }),
    ],
  },
  COMPRESSION_HELL: {
    label: 'Lossy',
    category: 'Modifier',
    params: [
      p('Block Size', { v: 4 }, { v: 100, b: 'SUB' }),
      p('Artifacting', { v: 80 }, { v: 100, b: 'SUB' }),
    ],
  },
  HUE_ROTATION: {
    label: 'Acid Trip',
    category: 'Modifier',
    params: [
      p('Phase Offset', { v: 10 }),
      p('Speed', { v: 25 }),
      p('Vibrance', { v: 73 }),
    ],
  },
  INVERT: {
    label: 'Invert',
    category: 'Modifier',
    params: [
      p('Inversion', { v: 100 }),
    ],
  },
  ROTATE: {
    label: 'Rotate',
    category: 'Modifier',
    params: [
      p('Rotation', { v: 3 }),
      p('Speed', { v: 3 }, { v: 30 }),
    ],
  },
  SKEW: {
    label: 'Skew',
    category: 'Modifier',
    params: [
      p('Skew', { v: 44 }, { v: 70, b: 'SUB' }),
    ],
  },
  SCREEN_SHAKE: {
    label: 'Shake',
    category: 'Modifier',
    params: [
      p('Displacement', { v: 70 }),
      p('Speed', { v: 20 }),
    ],
  },
  STARFIELD: {
    label: 'Starfield',
    category: 'Pattern',
    params: [
      p('Density', { v: 50 }),
      p('Speed', { v: 40, b: 'SUB' }, { v: 5 }),
    ],
    isColorable: true
  },
  TUNNEL_WARP: {
    label: 'Tunnel Warp',
    category: 'Modifier',
    params: [
      p('Scale', { v: 20 }),
      p('Speed', { v: 10 }),
      p('Twist', { v: 10 }),
    ],
  },
  GRAIN: {
    label: 'Grain',
    category: 'Pattern',
    params: [
      p('Width', { v: 100 }),
      p('Height', { v: 100 }),
      p('X-Freq', { v: 50 }),
      p('Y-Freq', { v: 50 }),
      p('Density', { v: 100 }, { v: 100, b: 'SUB' }),
      p('Roundness', { v: 0 }),
      p('Blend', { v: 100 }),
      p('Scale X', { v: 50 }),
      p('Scale Y', { v: 50 }),
      p('Pan X', { v: 50 }),
      p('Pan Y', { v: 50 }),
      p('Rotation', { v: 0 }),
    ],
    isColorable: true
  },
  SHAPE: {
    label: 'Shape',
    category: 'Pattern',
    params: [
      p('Side Count', { v: 4 }, { v: 4 }),
      p('Pointiness', { v: 0 }),
      p('Roundness', { v: 100 }),
      p('Feather', { v: 0 }),
      p('Blend', { v: 100 }),
      p('Scale X', { v: 25 }, { b: 'SUB' }),
      p('Scale Y', { v: 25 }, { b: 'SUB' }),
      p('Pan X', { v: 50 }),
      p('Pan Y', { v: 50 }),
      p('Rotation', { v: 0 }),
    ],
    isColorable: true
  },
  TILE: {
    label: 'Tile',
    category: 'Modifier',
    params: [
      p('Scale X', { v: 15 }, { v: 10, m: 30, b: 'SUB' }),
      p('Scale Y', { v: 15 }, { v: 10, m: 30, b: 'SUB' }),
      p('Pan X', { v: 50 }),
      p('Pan Y', { v: 50 }),
    ],
  },
  ORGANIC_NOISE: {
    label: 'Plasma',
    category: 'Pattern',
    params: [
      p('Scale', { v: 15 }),
      p('Complexity', { v: 10 }),
      p('Warp', { v: 8 }, { v: 3 }),
      p('Speed', { v: 74, b: 'BASS' }, { v: 20 }),
      p('Blend', { v: 100 }),
    ],
    isColorable: true
  },
  CELLULAR_NOISE: {
    label: 'Cellular Noise',
    category: 'Pattern',
    params: [
      p('Cell Width', { v: 59 }, { v: 65 }),
      p('Cell Height', { v: 100 }, { v: 65 }),
      p('X-Freq', { v: 35 }),
      p('Y-Freq', { v: 35 }),
      p('Density', { v: 100 }),
      p('Jitter', { v: 100 }),
      p('Speed', { v: 30, b: 'BASS' }, { v: 20, b: 'BASS' }),
      p('Blend', { v: 100 }),
    ],
    isColorable: true
  },
  LUMINANCE_MASK: {
    label: 'Luminance Mask',
    category: 'Modifier',
    params: [
      p('Threshold', { v: 50 }, { v: 80, b: 'SUB' }),
      p('Feather', { v: 15 }, { v: 0 }),
      p('Invert', { v: 0 }),
    ],
  },
  LUMINANCE_MAP: {
    label: 'Luminance Map',
    category: 'Modifier',
    params: [
      p('Threshold', { v: 50 }, { v: 30, m: 20, b: 'SUB' }),
      p('Feather', { v: 10 }),
      p('Tone', { v: 0 }, { v: 100 }),
      p('Blend', { v: 100 }),
    ],
  },
  EDGE_MASK: {
    label: 'Edge Mask',
    category: 'Modifier',
    params: [
      p('Sensitivity', { v: 5 }),
      p('Thickness', { v: 20 }, { b: 'SUB' }),
      p('Invert', { v: 0 }),
    ],
  },
  GRID: {
    label: 'Grid',
    category: 'Pattern',
    params: [
      p('Horizontal', { v: 25 }),
      p('Vertical', { v: 25 }),
      p('Thickness', { v: 25 }),
      p('Feather', { v: 25 }),
      p('Scale X', { v: 50 }, { v: 100, m: 50, b: 'SUB' }),
      p('Scale Y', { v: 50 }, { v: 100, m: 50, b: 'SUB' }),
      p('Pan X', { v: 50 }),
      p('Pan Y', { v: 50 }),
      p('Rotation', { v: 0 }),
    ],
    isColorable: true
  },
  SPECTRAL_MAP: {
    label: 'Spectral',
    category: 'Modifier',
    params: [
      p('Resolution', { v: 50 }),
      p('Phase Offset', { v: 0 }),
      p('Speed', { v: 25 }),
      p('Strength', { v: 100 }),
      p('Scale X', { v: 50 }),
      p('Scale Y', { v: 50 }),
      p('Pan X', { v: 50 }),
      p('Pan Y', { v: 50 }),
    ],
  },
  BLACK_HOLE: {
    label: 'Black Hole',
    category: 'Modifier',
    params: [
      p('Intensity', { v: 51, m: 31, b: 'SUB' }, { v: 100, b: 'SUB' }),
      p('Radius', { v: 30 }, { v: 50 }),
      p('Center X', { v: 50 }),
      p('Center Y', { v: 50 }),
    ],
  },
  WHITE_HOLE: {
    label: 'White Hole',
    category: 'Modifier',
    params: [
      p('Intensity', { v: 43, m: 23, b: 'SUB' }, { v: 30, b: 'SUB' }),
      p('Radius', { v: 43, m: 23, b: 'SUB' }, { v: 40, b: 'SUB' }),
      p('Center X', { v: 50 }),
      p('Center Y', { v: 50 }),
    ],
  },
  SCROLL: {
    label: 'Scroll',
    category: 'Modifier',
    params: [
      p('Left Speed', { v: 100 }),
      p('Right Speed', { v: 0 }),
      p('Up Speed', { v: 0 }),
      p('Down Speed', { v: 0 }),
      p('Ghost X', { v: 100 }),
      p('Ghost Y', { v: 0 }),
    ],
  },
  TERRAIN: {
    label: 'Terrain',
    category: 'Modifier',
    params: [
      p('Scale', { v: 2 }),
      p('Extrusion', { v: 25 }, { v: 50 }),
      p('Speed', { v: 12 }),
      p('Resolution', { v: 100 }),
      p('Rotate X', { v: 0 }),
      p('Rotate Y', { v: 0 }),
      p('Rotate Z', { v: 0 }),
      p('Elevation', { v: 46 }, { v: 40 }),
      p('Distance', { v: 50 }),
    ],
  },
  TERRAIN_SPHERE: {
    label: 'Terrain Sphere',
    category: 'Modifier',
    params: [
      p('Extrusion', { v: 10 }),
      p('Resolution', { v: 100 }),
      p('Distance', { v: 75 }),
      p('Offset X', { v: 0 }),
      p('Offset Y', { v: 0 }),
      p('Offset Z', { v: 25 }),
      p('Spin Speed X', { v: 25 }),
      p('Spin Speed Y', { v: 0 }),
      p('Spin Speed Z', { v: 0 }),
    ],
  },
  CHECKERBOARD: {
    label: 'Checkerboard',
    category: 'Pattern',
    params: [
      p('Freq X', { v: 10 }),
      p('Freq Y', { v: 10 }),
      p('Scale X', { v: 50 }, { v: 100, m: 50, b: 'SUB' }),
      p('Scale Y', { v: 50 }, { v: 100, m: 50, b: 'SUB' }),
      p('Pan X', { v: 50 }),
      p('Pan Y', { v: 50 }),
      p('Rotation', { v: 0 }),
    ],
    isColorable: true
  },
  TRANSFORM: {
    label: 'Transform',
    category: 'Modifier',
    params: [
      p('Scale X', { v: 50 }, { v: 100, m: 50, b: 'SUB' }),
      p('Scale Y', { v: 50 }, { v: 100, m: 50, b: 'SUB' }),
      p('Pan X', { v: 50 }),
      p('Pan Y', { v: 50 }),
      p('Rotation', { v: 0 }),
    ],
  },
  RGBA: {
    label: 'Color Select',
    category: 'Modifier',
    params: [
      p('Red', { v: 100 }),
      p('Green', { v: 100 }, { v: 50 }),
      p('Blue', { v: 100 }),
      p('Opacity', { v: 100 }),
    ],
  },
  LINEAR_GRADIENT: {
    label: 'Gradient',
    category: 'Pattern',
    params: [
      p('Feather', { v: 50 }),
      p('Rotation', { v: 50 }),
      p('Pan', { v: 50 }, { b: 'SUB' }),
    ],
  },
  RADIAL_GRADIENT: {
    label: 'Radial Gradient',
    category: 'Pattern',
    params: [
      p('Feather', { v: 50 }),
      p('Frequency', { v: 25 }),
      p('Speed', { v: 100, b: 'TREBLE' }, { v: 30 }),
      p('Pan X', { v: 50 }),
      p('Pan Y', { v: 50 }),
    ],
  },
  INFINITE_ZOOM: {
    label: 'Infinite Zoom',
    category: 'Modifier',
    params: [
      p('Speed', { v: 50, m: 0, b: 'SUB' }, { v: 10 }),
      p('Depth', { v: 25 }),
      p('Spacing', { v: 30 }),
      p('Plane Count', { v: 20 }),
      p('Edge Feather', { v: 10 }),
      p('Fade Buffer', { v: 100 }),
    ],
  },
  BLUR: {
    label: 'Blur',
    category: 'Modifier',
    params: [
      p('Intensity', { v: 50 }, { v: 50, m: 0, b: 'SUB' }),
      p('Blend', { v: 100 }),
    ],
  },
  GLOW: {
    label: 'Glow',
    category: 'Modifier',
    params: [
      p('Sensitivity', { v: 0 }),
      p('Distance', { v: 5 }),
      p('Strength', { v: 100 }, { v: 100, b: 'SUB' }),
    ],
  },
};
