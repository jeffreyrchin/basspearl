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
    icon: 'sort',
    category: 'Distort',
    params: [
      p('Streak Length', { v: 20 }, { v: 100, b: 'SUB' }),
      p('Trigger Level', { v: 50 }, { v: 35 }),
    ],
  },
  CHANNEL_SHIFT: {
    label: 'RGB Shift',
    icon: 'layers',
    category: 'Color',
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
    icon: 'grid_4x4',
    category: 'Distort',
    params: [
      p('Mosh Length', { v: 20 }, { v: 5 }),
      p('Mosh Density', { v: 100 }, { v: 30, b: 'SUB' }),
    ],
  },
  DEEP_FRY: {
    label: 'Incinerate',
    icon: 'local_fire_department',
    category: 'Color',
    params: [
      p('Heat', { v: 10 }, { v: 20, b: 'SUB' }),
      p('Posterize', { v: 65 }, { v: 50, b: 'SUB' }),
    ],
  },
  BIT_CRUSH: {
    label: 'Crush',
    icon: 'developer_board',
    category: 'Distort',
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
    icon: 'waves',
    category: 'Distort',
    params: [
      p('Amplitude', { v: 35, m: 11, b: 'BASS' }, { v: 33 }),
      p('Frequency', { v: 3 }, { v: 5 }),
      p('Speed', { v: 50, m: 5, b: 'BASS' }, { v: 5 }),
    ],
  },
  COLOR_BLEED: {
    label: 'Color Bleed',
    icon: 'palette',
    category: 'Color',
    params: [
      p('Bleed', { v: 40 }, { v: 30, b: 'SUB' }),
      p('Ghosting', { v: 18 }, { v: 30, b: 'SUB' }),
    ],
  },
  COMPRESSION_HELL: {
    label: 'Artifact',
    icon: 'compress',
    category: 'Distort',
    params: [
      p('Block Size', { v: 4 }, { v: 100, b: 'SUB' }),
      p('Artifacting', { v: 80 }, { v: 100, b: 'SUB' }),
    ],
  },
  HUE_ROTATION: {
    label: 'Acid Trip',
    icon: 'change_circle',
    category: 'Color',
    params: [
      p('Phase Offset', { v: 10 }),
      p('Speed', { v: 25 }),
      p('Vibrance', { v: 73 }),
    ],
  },
  INVERT: {
    label: 'Invert',
    icon: 'invert_colors',
    category: 'Color',
    params: [
      p('Inversion', { v: 100 }),
    ],
  },
  ROTATE: {
    label: 'Rotate',
    icon: 'rotate_right',
    category: 'Spatial',
    params: [
      p('Rotation', { v: 3 }),
      p('Speed', { v: 3 }, { v: 30 }),
    ],
  },
  SKEW: {
    label: 'Skew',
    icon: 'format_italic',
    category: 'Distort',
    params: [
      p('Skew', { v: 44 }, { v: 70, b: 'SUB' }),
    ],
  },
  SCREEN_SHAKE: {
    label: 'Shake',
    icon: 'vibration',
    category: 'Spatial',
    params: [
      p('Displacement', { v: 70 }),
      p('Speed', { v: 20 }),
    ],
  },
  STARFIELD: {
    label: 'Starfield',
    icon: 'auto_awesome',
    category: 'Pattern',
    params: [
      p('Density', { v: 40 }),
      p('Speed', { v: 40, b: 'SUB' }, { v: 5 }),
    ],
    isColorable: true
  },
  TUNNEL_WARP: {
    label: 'Tunnel Warp',
    icon: 'hub',
    category: 'Distort',
    params: [
      p('Scale', { v: 20 }),
      p('Speed', { v: 10 }),
      p('Twist', { v: 10 }),
    ],
  },
  GRAIN: {
    label: 'Grain',
    icon: 'blur_on',
    category: 'Pattern',
    params: [
      p('Width', { v: 100 }),
      p('Height', { v: 100 }),
      p('X-Freq', { v: 100 }),
      p('Y-Freq', { v: 100 }),
      p('Density', { v: 100 }),
      p('Roundness', { v: 0 }),
      p('Blend', { v: 50 }, { v: 100 }),
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
    icon: 'category',
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
    icon: 'apps',
    category: 'Spatial',
    params: [
      p('Scale X', { v: 15 }),
      p('Scale Y', { v: 15 }),
      p('Pan X', { v: 50 }),
      p('Pan Y', { v: 50 }),
    ],
  },
  ORGANIC_NOISE: {
    label: 'Plasma',
    icon: 'cloud',
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
    icon: 'texture',
    category: 'Pattern',
    params: [
      p('Cell Width', { v: 59 }, { v: 65 }),
      p('Cell Height', { v: 100 }, { v: 65 }),
      p('X-Freq', { v: 35 }),
      p('Y-Freq', { v: 35 }),
      p('Density', { v: 100 }),
      p('Jitter', { v: 100 }),
      p('Speed', { v: 50, b: 'BASS' }),
      p('Blend', { v: 64 }),
    ],
    isColorable: true
  },
  LUMINANCE_MASK: {
    label: 'Luminance Mask',
    icon: 'exposure',
    category: 'Color',
    params: [
      p('Threshold', { v: 50 }, { v: 80, m: 70, b: 'SUB' }),
      p('Feather', { v: 15 }, { v: 0 }),
      p('Invert', { v: 0 }),
    ],
  },
  LUMINANCE_MAP: {
    label: 'Luminance Map',
    icon: 'exposure_plus_1',
    category: 'Color',
    params: [
      p('Threshold', { v: 50 }, { v: 30, m: 20, b: 'SUB' }),
      p('Feather', { v: 10 }),
      p('Tone', { v: 0 }, { v: 100 }),
      p('Blend', { v: 100 }),
    ],
  },
  EDGE_MASK: {
    label: 'Edge Mask',
    icon: 'filter_tilt_shift',
    category: 'Color',
    params: [
      p('Sensitivity', { v: 5 }),
      p('Thickness', { v: 20 }, { b: 'SUB' }),
      p('Invert', { v: 0 }),
    ],
  },
  GRID: {
    label: 'Grid',
    icon: 'grid_3x3',
    category: 'Pattern',
    params: [
      p('Horizontal', { v: 30 }),
      p('Vertical', { v: 30 }),
      p('Thickness', { v: 5 }),
      p('Feather', { v: 0 }),
      p('Scale X', { v: 50 }),
      p('Scale Y', { v: 50 }),
      p('Pan X', { v: 50 }),
      p('Pan Y', { v: 50 }),
      p('Rotation', { v: 0 }),
    ],
    isColorable: true
  },
  SPECTRAL_MAP: {
    label: 'Spectral',
    icon: 'colors',
    category: 'Color',
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
    icon: 'blur_circular',
    category: 'Distort',
    params: [
      p('Intensity', { v: 51, m: 31, b: 'SUB' }, { v: 100, b: 'SUB' }),
      p('Radius', { v: 30 }, { v: 50 }),
      p('Center X', { v: 50 }),
      p('Center Y', { v: 50 }),
    ],
  },
  WHITE_HOLE: {
    label: 'White Hole',
    icon: 'brightness_7',
    category: 'Distort',
    params: [
      p('Intensity', { v: 43, m: 23, b: 'SUB' }, { v: 30, b: 'SUB' }),
      p('Radius', { v: 43, m: 23, b: 'SUB' }, { v: 40, b: 'SUB' }),
      p('Center X', { v: 50 }),
      p('Center Y', { v: 50 }),
    ],
  },
  SCROLL: {
    label: 'Scroll',
    icon: 'sync_alt',
    category: 'Spatial',
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
    icon: 'terrain',
    category: 'Spatial',
    params: [
      p('Scale', { v: 3 }),
      p('Extrusion', { v: 75 }),
      p('Speed', { v: 12 }),
      p('Resolution', { v: 100 }),
      p('Rotate X', { v: 0 }),
      p('Rotate Y', { v: 0 }),
      p('Rotate Z', { v: 0 }),
      p('Elevation', { v: 46 }, { v: 40 }),
      p('Distance', { v: 50 }),
    ],
  },
  CHECKERBOARD: {
    label: 'Checkerboard',
    icon: 'grid_view',
    category: 'Pattern',
    params: [
      p('Freq X', { v: 10 }),
      p('Freq Y', { v: 10 }),
      p('Scale X', { v: 50 }),
      p('Scale Y', { v: 50 }),
      p('Pan X', { v: 50 }),
      p('Pan Y', { v: 50 }),
      p('Rotation', { v: 0 }),
    ],
    isColorable: true
  },
  SCALE_PAN: {
    label: 'Scale-Pan',
    icon: 'open_with',
    category: 'Spatial',
    params: [
      p('Scale X', { v: 50 }),
      p('Scale Y', { v: 50 }),
      p('Pan X', { v: 50 }),
      p('Pan Y', { v: 50 }),
    ],
  },
  RGBA: {
    label: 'Color Select',
    icon: 'palette',
    category: 'Color',
    params: [
      p('Red', { v: 50 }),
      p('Green', { v: 80 }),
      p('Blue', { v: 100 }),
      p('Opacity', { v: 100 }),
    ],
    isColorable: true // added so that the "Color Select" button is not disabled when RGBA is selected
  },
};
