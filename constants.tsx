import { GlitchEffectType, EffectConfig, EffectCategory, FrequencyBand } from './types';

export const FEEDBACK_FORM_URL = 'https://forms.gle/CBVXwJv9s3ZvXyWr8';

export const EFFECT_METADATA: Record<GlitchEffectType, {
  label: string;
  icon: string;
  category: EffectCategory;
  params: { name: string; defaultValue: number; defaultMin?: number; defaultBand: FrequencyBand }[];
}> = {
  PIXEL_SORT: {
    label: 'Pixel Sort',
    icon: 'sort',
    category: 'Glitch',
    params: [
      { name: 'Streak Length', defaultValue: 20, defaultBand: 'OFF' },
      { name: 'Trigger Level', defaultValue: 50, defaultBand: 'OFF' },
    ],
  },
  CHANNEL_SHIFT: {
    label: 'RGB Shift',
    icon: 'layers',
    category: 'Color',
    params: [
      { name: 'Offset', defaultValue: 20, defaultBand: 'OFF' },
      { name: 'Vertical Tear', defaultValue: 20, defaultBand: 'OFF' },
    ],
  },
  DATA_CORRUPTION: {
    label: 'Datamosh',
    icon: 'grid_4x4',
    category: 'Glitch',
    params: [
      { name: 'Mosh Length', defaultValue: 20, defaultBand: 'OFF' },
      { name: 'Mosh Density', defaultValue: 100, defaultBand: 'OFF' },
    ],
  },
  DEEP_FRY: {
    label: 'Deep Fry',
    icon: 'local_fire_department',
    category: 'Color',
    params: [
      { name: 'Heat', defaultValue: 10, defaultBand: 'OFF' },
      { name: 'Posterize', defaultValue: 65, defaultBand: 'OFF' },
    ],
  },
  BIT_CRUSH: {
    label: 'Bit Crush',
    icon: 'developer_board',
    category: 'Glitch',
    params: [
      { name: 'Quantize', defaultValue: 0, defaultBand: 'OFF' },
      { name: 'Resample', defaultValue: 20, defaultBand: 'OFF' },
    ],
  },
  WAVE_DISTORTION: {
    label: 'Wave Distortion',
    icon: 'waves',
    category: 'Motion',
    params: [
      { name: 'Amplitude', defaultValue: 33, defaultBand: 'OFF' },
      { name: 'Frequency', defaultValue: 5, defaultBand: 'OFF' },
      { name: 'Speed', defaultValue: 5, defaultBand: 'OFF' },
    ],
  },
  COLOR_BLEED: {
    label: 'Color Bleed',
    icon: 'palette',
    category: 'Color',
    params: [
      { name: 'Bleed', defaultValue: 40, defaultBand: 'OFF' },
      { name: 'Ghosting', defaultValue: 18, defaultBand: 'OFF' },
    ],
  },
  COMPRESSION_HELL: {
    label: 'Compression Hell',
    icon: 'compress',
    category: 'Glitch',
    params: [
      { name: 'Block Size', defaultValue: 4, defaultBand: 'OFF' },
      { name: 'Artifacting', defaultValue: 80, defaultBand: 'OFF' },
    ],
  },
  HUE_ROTATION: {
    label: 'Acid Trip',
    icon: 'change_circle',
    category: 'Color',
    params: [
      { name: 'Phase Offset', defaultValue: 10, defaultBand: 'OFF' },
      { name: 'Speed', defaultValue: 25, defaultBand: 'OFF' },
      { name: 'Vibrance', defaultValue: 73, defaultBand: 'OFF' },
    ],
  },
  INVERT: {
    label: 'Invert',
    icon: 'invert_colors',
    category: 'Color',
    params: [
      { name: 'Inversion', defaultValue: 100, defaultBand: 'OFF' },
    ],
  },
  SCALE: {
    label: 'Scale',
    icon: 'aspect_ratio',
    category: 'Motion',
    params: [
      { name: 'Width', defaultValue: 60, defaultBand: 'OFF' },
      { name: 'Height', defaultValue: 60, defaultBand: 'OFF' },
    ],
  },
  ROTATE: {
    label: 'Rotate',
    icon: 'rotate_right',
    category: 'Motion',
    params: [
      { name: 'Rotation', defaultValue: 3, defaultBand: 'OFF' },
      { name: 'Speed', defaultValue: 3, defaultBand: 'OFF' },
    ],
  },
  SKEW: {
    label: 'Skew',
    icon: 'format_italic',
    category: 'Motion',
    params: [
      { name: 'Skew', defaultValue: 44, defaultBand: 'OFF' },
    ],
  },
  SCREEN_SHAKE: {
    label: 'Shake',
    icon: 'vibration',
    category: 'Motion',
    params: [
      { name: 'Displacement', defaultValue: 70, defaultBand: 'OFF' },
      { name: 'Speed', defaultValue: 20, defaultBand: 'OFF' },
    ],
  },
  STARFIELD: {
    label: 'Starfield',
    icon: 'auto_awesome',
    category: 'Additive',
    params: [
      { name: 'Density', defaultValue: 15, defaultBand: 'OFF' },
      { name: 'Speed', defaultValue: 5, defaultBand: 'OFF' },
    ],
  },
  RETRO_GRID: {
    label: 'Retro Grid',
    icon: 'grid_on',
    category: 'Additive',
    params: [
      { name: 'Thickness', defaultValue: 20, defaultBand: 'OFF' },
      { name: 'Speed', defaultValue: 50, defaultBand: 'OFF' },
    ],
  },
  TUNNEL_WARP: {
    label: 'Tunnel Warp',
    icon: 'hub',
    category: 'Motion',
    params: [
      { name: 'Scale', defaultValue: 20, defaultBand: 'OFF' },
      { name: 'Speed', defaultValue: 10, defaultBand: 'OFF' },
      { name: 'Twist', defaultValue: 10, defaultBand: 'OFF' },
    ],
  },
  GRAIN: {
    label: 'Grain',
    icon: 'blur_on',
    category: 'Additive',
    params: [
      { name: 'Width', defaultValue: 100, defaultBand: 'OFF' },
      { name: 'Height', defaultValue: 100, defaultBand: 'OFF' },
      { name: 'X-Freq', defaultValue: 100, defaultBand: 'OFF' },
      { name: 'Y-Freq', defaultValue: 100, defaultBand: 'OFF' },
      { name: 'Density', defaultValue: 100, defaultBand: 'OFF' },
      { name: 'Roundness', defaultValue: 0, defaultBand: 'OFF' },
      { name: 'Blend', defaultValue: 50, defaultBand: 'OFF' },
    ],
  },
  SHAPE: {
    label: 'Shape',
    icon: 'category',
    category: 'Additive',
    params: [
      { name: 'Side Count', defaultValue: 3, defaultBand: 'OFF' },
      { name: 'Pointiness', defaultValue: 0, defaultBand: 'OFF' },
      { name: 'Roundness', defaultValue: 0, defaultBand: 'OFF' },
      { name: 'Size', defaultValue: 20, defaultBand: 'OFF' },
      { name: 'Feather', defaultValue: 0, defaultBand: 'OFF' },
      { name: 'Blend', defaultValue: 100, defaultBand: 'OFF' },
    ],
  },
  TILE: {
    label: 'Tile',
    icon: 'apps',
    category: 'Motion',
    params: [
      { name: 'X-Freq', defaultValue: 15, defaultBand: 'OFF' },
      { name: 'Y-Freq', defaultValue: 15, defaultBand: 'OFF' },
      { name: 'Density', defaultValue: 100, defaultBand: 'OFF' },
      { name: 'Jitter', defaultValue: 0, defaultBand: 'OFF' },
    ],
  },
  ORGANIC_NOISE: {
    label: 'Organic Noise',
    icon: 'cloud',
    category: 'Additive',
    params: [
      { name: 'Scale', defaultValue: 50, defaultBand: 'OFF' },
      { name: 'Complexity', defaultValue: 50, defaultBand: 'OFF' },
      { name: 'Warp', defaultValue: 1, defaultBand: 'OFF' },
      { name: 'Speed', defaultValue: 8, defaultBand: 'OFF' },
      { name: 'Blend', defaultValue: 70, defaultBand: 'OFF' },
    ],
  },
  CELLULAR_NOISE: {
    label: 'Cellular Noise',
    icon: 'texture',
    category: 'Additive',
    params: [
      { name: 'Cell Width', defaultValue: 80, defaultBand: 'OFF' },
      { name: 'Cell Height', defaultValue: 80, defaultBand: 'OFF' },
      { name: 'X-Freq', defaultValue: 35, defaultBand: 'OFF' },
      { name: 'Y-Freq', defaultValue: 35, defaultBand: 'OFF' },
      { name: 'Density', defaultValue: 100, defaultBand: 'OFF' },
      { name: 'Jitter', defaultValue: 100, defaultBand: 'OFF' },
      { name: 'Speed', defaultValue: 64, defaultBand: 'OFF' },
      { name: 'Blend', defaultValue: 64, defaultBand: 'OFF' },
    ],
  },
  LUMINANCE_MASK: {
    label: 'Luminance Mask',
    icon: 'exposure',
    category: 'Mask',
    params: [
      { name: 'Threshold', defaultValue: 50, defaultBand: 'OFF' },
      { name: 'Feather', defaultValue: 15, defaultBand: 'OFF' },
      { name: 'Invert', defaultValue: 0, defaultBand: 'OFF' },
    ],
  },
  LUMINANCE_MAP: {
    label: 'Luminance Map',
    icon: 'exposure_plus_1',
    category: 'Mask',
    params: [
      { name: 'Threshold', defaultValue: 50, defaultBand: 'OFF' },
      { name: 'Feather', defaultValue: 10, defaultBand: 'OFF' },
      { name: 'Replacement Tone', defaultValue: 0, defaultBand: 'OFF' },
      { name: 'Blend', defaultValue: 100, defaultBand: 'OFF' },
    ],
  },
  EDGE_MASK: {
    label: 'Edge Mask',
    icon: 'filter_tilt_shift',
    category: 'Mask',
    params: [
      { name: 'Sensitivity', defaultValue: 20, defaultBand: 'OFF' },
      { name: 'Thickness', defaultValue: 20, defaultBand: 'OFF' },
      { name: 'Invert', defaultValue: 0, defaultBand: 'OFF' },
    ],
  },
  GRID: {
    label: 'Grid',
    icon: 'grid_3x3',
    category: 'Additive',
    params: [
      { name: 'Horizontal', defaultValue: 10, defaultBand: 'OFF' },
      { name: 'Vertical', defaultValue: 10, defaultBand: 'OFF' },
      { name: 'Thickness', defaultValue: 5, defaultBand: 'OFF' },
      { name: 'Feather', defaultValue: 2, defaultBand: 'OFF' },
    ],
  },
  SPECTRAL_MAP: {
    label: 'Spectral Map',
    icon: 'colors',
    category: 'Color',
    params: [
      { name: 'Resolution', defaultValue: 50, defaultBand: 'OFF' },
      { name: 'Phase Offset', defaultValue: 0, defaultBand: 'OFF' },
      { name: 'Speed', defaultValue: 25, defaultBand: 'OFF' },
      { name: 'Strength', defaultValue: 100, defaultBand: 'OFF' },
    ],
  },
  BLACK_HOLE: {
    label: 'Black Hole',
    icon: 'blur_circular',
    category: 'Motion',
    params: [
      { name: 'Intensity', defaultValue: 30, defaultBand: 'OFF' },
      { name: 'Radius', defaultValue: 30, defaultBand: 'OFF' },
      { name: 'Center X', defaultValue: 50, defaultBand: 'OFF' },
      { name: 'Center Y', defaultValue: 50, defaultBand: 'OFF' },
    ],
  },
  WHITE_HOLE: {
    label: 'White Hole',
    icon: 'brightness_7',
    category: 'Motion',
    params: [
      { name: 'Intensity', defaultValue: 30, defaultBand: 'OFF' },
      { name: 'Radius', defaultValue: 30, defaultBand: 'OFF' },
      { name: 'Center X', defaultValue: 50, defaultBand: 'OFF' },
      { name: 'Center Y', defaultValue: 50, defaultBand: 'OFF' },
    ],
  },
  PAN: {
    label: 'Pan',
    icon: 'open_with',
    category: 'Motion',
    params: [
      { name: 'Pan X', defaultValue: 10, defaultBand: 'OFF' },
      { name: 'Pan Y', defaultValue: 10, defaultBand: 'OFF' },
    ],
  },
  SCROLL: {
    label: 'Scroll',
    icon: 'sync_alt',
    category: 'Motion',
    params: [
      { name: 'Left Speed', defaultValue: 100, defaultBand: 'SUB' },
      { name: 'Right Speed', defaultValue: 0, defaultBand: 'OFF' },
      { name: 'Up Speed', defaultValue: 0, defaultBand: 'OFF' },
      { name: 'Down Speed', defaultValue: 0, defaultBand: 'OFF' },
    ],
  },
};

export const createEffectInstance = (type: GlitchEffectType): EffectConfig => {
  const metadata = EFFECT_METADATA[type];
  if (!metadata) {
    throw new Error(`Effect type ${type} not found`);
  }

  return {
    id: crypto.randomUUID(),
    type,
    params: metadata.params.map(p => ({
      param: p.name,
      value: p.defaultValue,
      min: 0,
      frequencyBand: p.defaultBand,
    })),
    muted: false,
    soloed: false,
    seed: Math.floor(Math.random() * 10000),
  };
};

export const INITIAL_REACTIVE_EFFECTS: EffectConfig[] = [createEffectInstance('STARFIELD')];

export interface Preset {
  id: string;
  label: string;
  image: string;
  audio: string;
  effects: EffectConfig[];
}

export const PRESETS: Preset[] = [
  {
    id: 'sunset',
    label: '🌅',
    image: '/presets/sunset.jpeg',
    audio: '/presets/sampler testing 11_20_21.mp3',
    effects: [
      {
        id: 'sunset-starfield',
        type: 'STARFIELD',
        params: [
          { param: 'Density', value: 15, min: 0, frequencyBand: 'SUB' },
          { param: 'Speed', value: 100, min: 0, frequencyBand: 'SUB' },
        ],
        muted: false,
        soloed: false,
        seed: 0,
      },
      {
        id: 'sunset-shift',
        type: 'CHANNEL_SHIFT',
        params: [
          { param: 'Offset', value: 18, min: 0, frequencyBand: 'SUB' },
          { param: 'Vertical Tear', value: 0, min: 0, frequencyBand: 'SUB' },
        ],
        muted: false,
        soloed: false,
        seed: 1,
      },
      {
        id: 'sunset-zoom',
        type: 'SCALE',
        params: [
          { param: 'Width', value: 75, min: 50, frequencyBand: 'SUB' },
          { param: 'Height', value: 75, min: 50, frequencyBand: 'SUB' },
        ],
        muted: false,
        soloed: false,
        seed: 2,
      },
    ],
  },
  {
    id: 'underwater',
    label: '🌊',
    image: '/presets/underwater.png',
    audio: '/presets/1_17_22 new instrument.mp3',
    effects: [
      {
        id: 'underwater-crush',
        type: 'BIT_CRUSH',
        params: [
          { param: 'Quantize', value: 0, min: 0, frequencyBand: 'SUB' },
          { param: 'Resample', value: 27, min: 0, frequencyBand: 'SUB' },
        ],
        muted: false,
        soloed: false,
        seed: 0,
      },
      {
        id: 'underwater-invert',
        type: 'INVERT',
        params: [
          { param: 'Inversion', value: 100, min: 0, frequencyBand: 'MID' },
        ],
        muted: false,
        soloed: false,
        seed: 1,
      },
      {
        id: 'underwater-mosh',
        type: 'DATA_CORRUPTION',
        params: [
          { param: 'Mosh Length', value: 11, min: 0, frequencyBand: 'SUB' },
          { param: 'Mosh Density', value: 100, min: 0, frequencyBand: 'SUB' },
        ],
        muted: false,
        soloed: false,
        seed: 2,
      },
      {
        id: 'underwater-hue',
        type: 'HUE_ROTATION',
        params: [
          { param: 'Phase Offset', value: 8, min: 0, frequencyBand: 'BASS' },
          { param: 'Speed', value: 0, min: 0, frequencyBand: 'BASS' },
          { param: 'Vibrance', value: 73, min: 0, frequencyBand: 'BASS' },
        ],
        muted: false,
        soloed: false,
        seed: 3,
      },
      {
        id: 'underwater-zoom',
        type: 'SCALE',
        params: [
          { param: 'Width', value: 100, min: 50, frequencyBand: 'SUB' },
          { param: 'Height', value: 100, min: 50, frequencyBand: 'SUB' },
        ],
        muted: false,
        soloed: false,
        seed: 4,
      },
    ],
  },
];
