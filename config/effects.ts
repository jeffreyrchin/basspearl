import { GlitchEffectType, EffectMetadata, EffectParamMetadata, FrequencyBand } from '../types';

// Helper to slim down the effect parameter definitions
export const p = (
  name: string,
  d: { v: number; m?: number; b?: FrequencyBand }, // Default values
  p?: { v?: number; m?: number; b?: FrequencyBand }, // Preview Overrides
  cyclic?: boolean
): EffectParamMetadata => ({
  name,
  defaultValue: d.v,
  defaultMin: d.m,
  defaultBand: d.b || 'OFF',
  ...(p && {
    previewValue: p.v,
    previewMin: p.m,
    previewBand: p.b
  }),
  cyclic: cyclic || false,
});

export const EFFECT_METADATA: Record<GlitchEffectType, EffectMetadata> = {
  CHANNEL_SHIFT: {
    label: 'Color Separate',
    category: 'Modifier',
    params: [
      p('Offset', { v: 20 }, { v: 100, b: 'SUB' }),
      p('Vertical Tear', { v: 20 }, { v: 100, b: 'SUB' }),
    ],
  },
  DATA_CORRUPTION: {
    label: 'Datamosh',
    category: 'Modifier',
    params: [
      p('Displacement', { v: 20 }, { v: 30, b: 'SUB' }),
      p('Mosh Level', { v: 100 }, { v: 50, b: 'SUB' }),
    ],
  },
  DEEP_FRY: {
    label: 'Color Burn',
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
      p('Block Size', { v: 20 }, { v: 50, b: 'SUB' }),
      p('Posterize', { v: 0 }),
      p('Noise', { v: 0 }),
    ],
  },
  WAVE_DISTORTION: {
    label: 'Wave Distortion',
    category: 'Modifier',
    params: [
      p('Amplitude', { v: 20 }, { v: 33 }),
      p('Frequency', { v: 3 }, { v: 5 }),
      p('Speed', { v: 15 }, { v: 5 }),
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
  HUE_ROTATION: {
    label: 'Color Rotate',
    category: 'Modifier',
    params: [
      p('Color Shift', { v: 10 }, undefined, true),
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
      p('Rotation', { v: 3 }, undefined, true),
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
      p('Speed', { v: 5 }),
    ],
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
      p('Freq X', { v: 60 }),
      p('Freq Y', { v: 60 }),
      p('Density', { v: 100 }, { v: 100, b: 'SUB' }),
      p('Roundness', { v: 0 }),
      p('Blend', { v: 100 }),
      p('Scale X', { v: 54 }),
      p('Scale Y', { v: 96 }),
      p('Pan X', { v: 50 }),
      p('Pan Y', { v: 50 }),
      p('Rotation', { v: 0 }, undefined, true),
    ],
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
      p('Scale X', { v: 18 }),
      p('Scale Y', { v: 32 }),
      p('Pan X', { v: 50 }),
      p('Pan Y', { v: 50 }),
      p('Rotation', { v: 0 }, undefined, true),
    ],
  },
  TILE: {
    label: 'Tile',
    category: 'Modifier',
    params: [
      p('Scale X', { v: 9 }, { v: 9, m: 18, b: 'SUB' }),
      p('Scale Y', { v: 16 }, { v: 16, m: 32, b: 'SUB' }),
      p('Pan X', { v: 50 }),
      p('Pan Y', { v: 50 }),
    ],
  },
  ORGANIC_NOISE: {
    label: 'Plasma',
    category: 'Pattern',
    params: [
      p('Scale', { v: 50 }),
      p('Detail Level', { v: 100 }),
      p('Warp Amount', { v: 1 }),
      p('Warp Speed', { v: 25 }, { v: 50 }),
      p('Warp Direction', { v: 0 }, undefined, true),
      p('Blend', { v: 100 }),
    ],
  },
  CELLULAR_NOISE: {
    label: 'Cells',
    category: 'Pattern',
    params: [
      p('Cell Width', { v: 100 }),
      p('Cell Height', { v: 100 }),
      p('Freq X', { v: 35 }),
      p('Freq Y', { v: 35 }),
      p('Density', { v: 100 }),
      p('Jitter', { v: 100 }),
      p('Speed', { v: 15 }, { v: 20, b: 'BASS' }),
      p('Blend', { v: 100 }),
      p('Scale X', { v: 54 }),
      p('Scale Y', { v: 96 }),
      p('Pan X', { v: 50 }),
      p('Pan Y', { v: 50 }),
      p('Rotation', { v: 0 }, undefined, true),
    ],
  },
  LUMINANCE_MASK: {
    label: 'Stencil',
    category: 'Modifier',
    params: [
      p('Threshold', { v: 50 }, { v: 80, b: 'SUB' }),
      p('Feather', { v: 15 }, { v: 0 }),
      p('Invert', { v: 0 }),
    ],
  },
  LUMINANCE_MAP: {
    label: 'B/W Tint',
    category: 'Modifier',
    params: [
      p('Threshold', { v: 50 }, { v: 30, m: 20, b: 'SUB' }),
      p('Feather', { v: 10 }),
      p('Tone', { v: 0 }, { v: 100 }),
      p('Blend', { v: 100 }),
    ],
  },
  EDGE_MASK: {
    label: 'Outline',
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
      p('Horizontal', { v: 22 }),
      p('Vertical', { v: 22 }),
      p('Thickness', { v: 25 }),
      p('Feather', { v: 25 }),
      p('Scale X', { v: 54 }),
      p('Scale Y', { v: 96 }),
      p('Pan X', { v: 50 }),
      p('Pan Y', { v: 50 }),
      p('Rotation', { v: 0 }, undefined, true),
    ],
  },
  SPECTRAL_MAP: {
    label: 'Rainbow Cycler',
    category: 'Modifier',
    params: [
      p('Rainbow Density', { v: 50 }),
      p('Color Shift', { v: 0 }, undefined, true),
      p('Speed', { v: 25 }),
      p('Intensity', { v: 100 }),
    ],
  },
  BLACK_HOLE: {
    label: 'Black Hole',
    category: 'Modifier',
    params: [
      p('Intensity', { v: 30 }, { v: 100, b: 'SUB' }),
      p('Radius', { v: 30 }, { v: 50 }),
      p('Center X', { v: 50 }),
      p('Center Y', { v: 50 }),
    ],
  },
  WHITE_HOLE: {
    label: 'White Hole',
    category: 'Modifier',
    params: [
      p('Intensity', { v: 30 }, { v: 30, b: 'SUB' }),
      p('Radius', { v: 40 }, { v: 40, b: 'SUB' }),
      p('Center X', { v: 50 }),
      p('Center Y', { v: 50 }),
    ],
  },
  SCROLL: {
    label: 'Scroll',
    category: 'Modifier',
    params: [
      p('Left Speed', { v: 25 }),
      p('Right Speed', { v: 0 }),
      p('Up Speed', { v: 0 }),
      p('Down Speed', { v: 0 }),
      p('Overlap X', { v: 100 }),
      p('Overlap Y', { v: 0 }),
    ],
  },
  TERRAIN: {
    label: 'Terrain',
    category: 'Modifier',
    params: [
      p('Extrusion', { v: 5 }, { v: 15 }),
      p('Detail Level', { v: 100 }),
      p('Tile Width', { v: 100 }),
      p('Tile Height', { v: 100 }),
      p('Rotate X', { v: 0 }, undefined, true),
      p('Rotate Y', { v: 0 }, undefined, true),
      p('Rotate Z', { v: 0 }, undefined, true),
      p('Elevation', { v: 50 }),
      p('Distance', { v: 50 }),
      p('Tile Blend', { v: 0 }),
      p('Speed X', { v: 0 }),
      p('Speed Y', { v: 0 }),
    ],
  },
  TERRAIN_SPHERE: {
    label: 'Ball Warp',
    category: 'Modifier',
    params: [
      p('Extrusion', { v: 10 }),
      p('Detail Level', { v: 100 }),
      p('Size', { v: 50 }),
      p('Offset X', { v: 0 }, undefined, true),
      p('Offset Y', { v: 0 }, undefined, true),
      p('Offset Z', { v: 25 }, undefined, true),
      p('Spin Speed X', { v: 25 }),
      p('Spin Speed Y', { v: 0 }),
      p('Spin Speed Z', { v: 0 }),
    ],
  },
  TERRAIN_RING: {
    label: 'Ring Warp',
    category: 'Modifier',
    params: [
      p('Extrusion', { v: 10 }),
      p('Detail Level', { v: 100 }),
      p('Size', { v: 40 }),
      p('Offset X', { v: 0 }, undefined, true),
      p('Offset Y', { v: 0 }, undefined, true),
      p('Offset Z', { v: 25 }, undefined, true),
      p('Spin Speed X', { v: 25 }),
      p('Spin Speed Y', { v: 0 }),
      p('Spin Speed Z', { v: 0 }),
      p('Tube Width', { v: 30 }),
    ],
  },
  CHECKERBOARD: {
    label: 'Checkerboard',
    category: 'Pattern',
    params: [
      p('Freq X', { v: 10 }),
      p('Freq Y', { v: 10 }),
      p('Feather', { v: 0 }),
      p('Scale X', { v: 54 }),
      p('Scale Y', { v: 96 }),
      p('Pan X', { v: 50 }),
      p('Pan Y', { v: 50 }),
      p('Rotation', { v: 0 }, undefined, true),
    ],
  },
  TRANSFORM: {
    label: 'Move-Scale',
    category: 'Modifier',
    params: [
      p('Scale X', { v: 50 }, { v: 100, m: 50, b: 'SUB' }),
      p('Scale Y', { v: 50 }, { v: 100, m: 50, b: 'SUB' }),
      p('Pan X', { v: 50 }),
      p('Pan Y', { v: 50 }),
      p('Rotation', { v: 0 }, undefined, true),
    ],
  },
  RGBA: {
    label: 'Color',
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
      p('Rotation', { v: 50 }, undefined, true),
      p('Pan', { v: 50 }, { b: 'SUB' }),
    ],
  },
  RADIAL_GRADIENT: {
    label: 'Radial Gradient',
    category: 'Pattern',
    params: [
      p('Feather', { v: 50 }),
      p('Frequency', { v: 25 }),
      p('Speed', { v: 30 }),
      p('Pan X', { v: 50 }),
      p('Pan Y', { v: 50 }),
    ],
  },
  SPIRAL_GRADIENT: {
    label: 'Spiral Gradient',
    category: 'Pattern',
    params: [
      p('Feather', { v: 50 }),
      p('Frequency', { v: 3 }),
      p('Twist', { v: 25 }),
      p('Speed', { v: 10 }),
      p('Pan X', { v: 50 }),
      p('Pan Y', { v: 50 }),
    ],
  },
  INFINITE_ZOOM: {
    label: 'Infinite Zoom',
    category: 'Modifier',
    params: [
      p('Speed', { v: 10 }),
      p('Depth', { v: 25 }),
      p('Spacing', { v: 30 }),
      p('Plane Count', { v: 20 }),
      p('Edge Feather', { v: 70 }),
      p('Zoom Fade', { v: 100 }),
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
  TRI_CRUSH: {
    label: 'Triangulate',
    category: 'Modifier',
    params: [
      p('Width', { v: 20 }, { v: 100, b: 'SUB' }),
      p('Height', { v: 20 }, { v: 100, b: 'SUB' }),
      p('Shear', { v: 50 }),
      p('Posterize', { v: 0 }),
    ],
  },
  HEX_CRUSH: {
    label: 'Hextile',
    category: 'Modifier',
    params: [
      p('Width', { v: 100 }, { v: 100, b: 'SUB' }),
      p('Height', { v: 60 }, { v: 60, b: 'SUB' }),
      p('Posterize', { v: 0 }),
    ],
  },
  IMAGE: {
    label: 'Image',
    category: 'Pattern',
    params: [
      p('Opacity', { v: 100 }),
      p('Scale X', { v: 54 }),
      p('Scale Y', { v: 96 }),
      p('Pan X', { v: 50 }),
      p('Pan Y', { v: 50 }),
      p('Rotation', { v: 0 }, undefined, true),
    ],
  },
  PARTICLES: {
    label: 'Particles',
    category: 'Pattern',
    params: [
      p('Count', { v: 20 }),
      p('Size', { v: 20 }),
      p('Spread', { v: 10 }),
      p('Drift', { v: 20 }),
      p('Drift Speed', { v: 20 }),
      p('Zoom Speed', { v: 0 }),
      p('Blend', { v: 100 }),
    ],
  },
};
