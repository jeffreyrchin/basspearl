import { EffectConfig, GlitchEffectType, MacroMetadata, MacroType, EffectMetadata } from './types';

export const FEEDBACK_FORM_URL = 'https://forms.gle/CBVXwJv9s3ZvXyWr8';

export const EFFECT_METADATA: Record<GlitchEffectType, EffectMetadata> = {
  PIXEL_SORT: {
    label: 'Pixel Sort',
    icon: 'sort',
    category: 'Distort',
    params: [
      { name: 'Streak Length', defaultValue: 20, defaultBand: 'OFF', previewValue: 100, previewBand: 'SUB' },
      { name: 'Trigger Level', defaultValue: 50, defaultBand: 'OFF', previewValue: 35 },
    ],
  },
  CHANNEL_SHIFT: {
    label: 'RGB Shift',
    icon: 'layers',
    category: 'Color',
    params: [
      { name: 'Offset', defaultValue: 20, defaultBand: 'OFF', previewValue: 100, previewBand: 'SUB' },
      { name: 'Vertical Tear', defaultValue: 20, defaultBand: 'OFF', previewValue: 100, previewBand: 'SUB' },
    ],
  },
  DATA_CORRUPTION: {
    label: 'Datamosh',
    icon: 'grid_4x4',
    category: 'Distort',
    params: [
      { name: 'Mosh Length', defaultValue: 20, defaultBand: 'OFF', previewValue: 5 },
      { name: 'Mosh Density', defaultValue: 100, defaultBand: 'OFF', previewValue: 30, previewBand: 'SUB' },
    ],
  },
  DEEP_FRY: {
    label: 'Incinerate',
    icon: 'local_fire_department',
    category: 'Color',
    params: [
      { name: 'Heat', defaultValue: 10, defaultBand: 'OFF', previewValue: 20, previewBand: 'SUB' },
      { name: 'Posterize', defaultValue: 65, defaultBand: 'OFF', previewValue: 50, previewBand: 'SUB' },
    ],
  },
  BIT_CRUSH: {
    label: 'Crush',
    icon: 'developer_board',
    category: 'Distort',
    params: [
      { name: 'Quantize', defaultValue: 0, defaultBand: 'OFF' },
      { name: 'Resample', defaultValue: 20, defaultBand: 'OFF', previewValue: 50, previewBand: 'SUB' },
    ],
  },
  WAVE_DISTORTION: {
    label: 'Wave Distortion',
    icon: 'waves',
    category: 'Distort',
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
      { name: 'Bleed', defaultValue: 40, defaultBand: 'OFF', previewValue: 30, previewBand: 'SUB' },
      { name: 'Ghosting', defaultValue: 18, defaultBand: 'OFF', previewValue: 30, previewBand: 'SUB' },
    ],
  },
  COMPRESSION_HELL: {
    label: 'Artifact',
    icon: 'compress',
    category: 'Distort',
    params: [
      { name: 'Block Size', defaultValue: 4, defaultBand: 'OFF', previewValue: 100, previewBand: 'SUB' },
      { name: 'Artifacting', defaultValue: 80, defaultBand: 'OFF', previewValue: 100, previewBand: 'SUB' },
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
    category: 'Spatial',
    params: [
      { name: 'Width', defaultValue: 60, defaultBand: 'OFF', previewValue: 100, previewBand: 'SUB' },
      { name: 'Height', defaultValue: 60, defaultBand: 'OFF', previewValue: 100, previewBand: 'SUB' },
    ],
  },
  ROTATE: {
    label: 'Rotate',
    icon: 'rotate_right',
    category: 'Spatial',
    params: [
      { name: 'Rotation', defaultValue: 3, defaultBand: 'OFF' },
      { name: 'Speed', defaultValue: 3, defaultBand: 'OFF', previewValue: 30 },
    ],
  },
  SKEW: {
    label: 'Skew',
    icon: 'format_italic',
    category: 'Distort',
    params: [
      { name: 'Skew', defaultValue: 44, defaultBand: 'OFF', previewValue: 70, previewBand: 'SUB' },
    ],
  },
  SCREEN_SHAKE: {
    label: 'Shake',
    icon: 'vibration',
    category: 'Spatial',
    params: [
      { name: 'Displacement', defaultValue: 70, defaultBand: 'OFF' },
      { name: 'Speed', defaultValue: 20, defaultBand: 'OFF' },
    ],
  },
  STARFIELD: {
    label: 'Starfield',
    icon: 'auto_awesome',
    category: 'Pattern',
    params: [
      { name: 'Density', defaultValue: 15, defaultBand: 'OFF' },
      { name: 'Speed', defaultValue: 5, defaultBand: 'OFF' },
    ],
  },
  RETRO_GRID: {
    label: 'Retro Grid',
    icon: 'grid_on',
    category: 'Pattern',
    params: [
      { name: 'Thickness', defaultValue: 100, defaultBand: 'OFF' },
      { name: 'Speed', defaultValue: 10, defaultBand: 'OFF' },
    ],
  },
  TUNNEL_WARP: {
    label: 'Tunnel Warp',
    icon: 'hub',
    category: 'Distort',
    params: [
      { name: 'Scale', defaultValue: 20, defaultBand: 'OFF' },
      { name: 'Speed', defaultValue: 10, defaultBand: 'OFF' },
      { name: 'Twist', defaultValue: 10, defaultBand: 'OFF' },
    ],
  },
  GRAIN: {
    label: 'Grain',
    icon: 'blur_on',
    category: 'Pattern',
    params: [
      { name: 'Width', defaultValue: 100, defaultBand: 'OFF' },
      { name: 'Height', defaultValue: 100, defaultBand: 'OFF' },
      { name: 'X-Freq', defaultValue: 100, defaultBand: 'OFF' },
      { name: 'Y-Freq', defaultValue: 100, defaultBand: 'OFF' },
      { name: 'Density', defaultValue: 100, defaultBand: 'OFF' },
      { name: 'Roundness', defaultValue: 0, defaultBand: 'OFF' },
      { name: 'Blend', defaultValue: 50, defaultBand: 'OFF', previewValue: 100 },
    ],
  },
  SHAPE: {
    label: 'Shape',
    icon: 'category',
    category: 'Pattern',
    params: [
      { name: 'Side Count', defaultValue: 4, defaultBand: 'OFF', previewValue: 4 },
      { name: 'Pointiness', defaultValue: 0, defaultBand: 'OFF' },
      { name: 'Roundness', defaultValue: 0, defaultBand: 'OFF', previewValue: 100, previewBand: 'SUB' },
      { name: 'Size', defaultValue: 20, defaultBand: 'OFF', previewValue: 50, previewBand: 'SUB' },
      { name: 'Feather', defaultValue: 0, defaultBand: 'OFF' },
      { name: 'Blend', defaultValue: 100, defaultBand: 'OFF' },
    ],
  },
  TILE: {
    label: 'Tile',
    icon: 'apps',
    category: 'Pattern',
    params: [
      { name: 'X-Freq', defaultValue: 15, defaultBand: 'OFF' },
      { name: 'Y-Freq', defaultValue: 15, defaultBand: 'OFF' },
      { name: 'Density', defaultValue: 100, defaultBand: 'OFF' },
      { name: 'Jitter', defaultValue: 0, defaultBand: 'OFF' },
    ],
  },
  ORGANIC_NOISE: {
    label: 'Plasma',
    icon: 'cloud',
    category: 'Pattern',
    params: [
      { name: 'Scale', defaultValue: 50, defaultBand: 'OFF', previewValue: 20 },
      { name: 'Complexity', defaultValue: 50, defaultBand: 'OFF' },
      { name: 'Warp', defaultValue: 1, defaultBand: 'OFF' },
      { name: 'Speed', defaultValue: 30, defaultBand: 'OFF' },
      { name: 'Blend', defaultValue: 70, defaultBand: 'OFF', previewValue: 100 },
    ],
  },
  CELLULAR_NOISE: {
    label: 'Cellular Noise',
    icon: 'texture',
    category: 'Pattern',
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
    category: 'Color',
    params: [
      { name: 'Threshold', defaultValue: 50, defaultBand: 'OFF', previewValue: 80, previewMin: 70, previewBand: 'SUB' },
      { name: 'Feather', defaultValue: 15, defaultBand: 'OFF', previewValue: 0 },
      { name: 'Invert', defaultValue: 0, defaultBand: 'OFF' },
    ],
  },
  LUMINANCE_MAP: {
    label: 'Luminance Map',
    icon: 'exposure_plus_1',
    category: 'Color',
    params: [
      { name: 'Threshold', defaultValue: 50, defaultBand: 'OFF', previewValue: 30, previewMin: 20, previewBand: 'SUB' },
      { name: 'Feather', defaultValue: 10, defaultBand: 'OFF' },
      { name: 'Replacement Tone', defaultValue: 0, defaultBand: 'OFF', previewValue: 100 },
      { name: 'Blend', defaultValue: 100, defaultBand: 'OFF' },
    ],
  },
  EDGE_MASK: {
    label: 'Edge Mask',
    icon: 'filter_tilt_shift',
    category: 'Color',
    params: [
      { name: 'Sensitivity', defaultValue: 20, defaultBand: 'OFF', previewValue: 20, previewBand: 'SUB' },
      { name: 'Thickness', defaultValue: 20, defaultBand: 'OFF', previewValue: 20, previewBand: 'SUB' },
      { name: 'Invert', defaultValue: 0, defaultBand: 'OFF' },
    ],
  },
  GRID: {
    label: 'Grid',
    icon: 'grid_3x3',
    category: 'Pattern',
    params: [
      { name: 'Horizontal', defaultValue: 30, defaultBand: 'OFF' },
      { name: 'Vertical', defaultValue: 30, defaultBand: 'OFF' },
      { name: 'Thickness', defaultValue: 5, defaultBand: 'OFF' },
      { name: 'Feather', defaultValue: 0, defaultBand: 'OFF' },
    ],
  },
  SPECTRAL_MAP: {
    label: 'Spectral',
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
    category: 'Distort',
    params: [
      { name: 'Intensity', defaultValue: 30, defaultBand: 'OFF', previewValue: 100, previewBand: 'SUB' },
      { name: 'Radius', defaultValue: 30, defaultBand: 'OFF', previewValue: 50 },
      { name: 'Center X', defaultValue: 50, defaultBand: 'OFF' },
      { name: 'Center Y', defaultValue: 50, defaultBand: 'OFF' },
    ],
  },
  WHITE_HOLE: {
    label: 'White Hole',
    icon: 'brightness_7',
    category: 'Distort',
    params: [
      { name: 'Intensity', defaultValue: 30, defaultBand: 'OFF', previewValue: 50, previewBand: 'SUB' },
      { name: 'Radius', defaultValue: 30, defaultBand: 'OFF', previewBand: 'SUB' },
      { name: 'Center X', defaultValue: 50, defaultBand: 'OFF' },
      { name: 'Center Y', defaultValue: 50, defaultBand: 'OFF' },
    ],
  },
  PAN: {
    label: 'Pan',
    icon: 'open_with',
    category: 'Spatial',
    params: [
      { name: 'Pan X', defaultValue: 10, defaultBand: 'OFF', previewValue: 100, previewBand: 'SUB' },
      { name: 'Pan Y', defaultValue: 10, defaultBand: 'OFF', previewValue: 100, previewBand: 'SUB' },
    ],
  },
  SCROLL: {
    label: 'Scroll',
    icon: 'sync_alt',
    category: 'Spatial',
    params: [
      { name: 'Left Speed', defaultValue: 100, defaultBand: 'SUB' },
      { name: 'Right Speed', defaultValue: 0, defaultBand: 'OFF' },
      { name: 'Up Speed', defaultValue: 0, defaultBand: 'OFF' },
      { name: 'Down Speed', defaultValue: 0, defaultBand: 'OFF' },
    ],
  },
};

export const MACRO_METADATA: Record<MacroType, MacroMetadata> = {
  FOG_VORTEX: {
    id: 'FOG_VORTEX',
    label: 'Fog Vortex',
    effects: [
      {
        type: 'ORGANIC_NOISE',
        params: [
          { param: 'Scale', value: 4, frequencyBand: 'OFF' },
          { param: 'Complexity', value: 97, frequencyBand: 'OFF' },
          { param: 'Warp', value: 3, frequencyBand: 'OFF' },
          { param: 'Speed', value: 100, frequencyBand: 'SUB' },
          { param: 'Blend', value: 100, frequencyBand: 'OFF' },
        ]
      },
      {
        type: 'LUMINANCE_MASK',
        params: [
          { param: 'Threshold', value: 60, frequencyBand: 'OFF' },
          { param: 'Feather', value: 10, frequencyBand: 'OFF' },
          { param: 'Invert', value: 0, frequencyBand: 'OFF' },
        ]
      },
      {
        type: 'TUNNEL_WARP',
        params: [
          { param: 'Scale', value: 20, frequencyBand: 'OFF' },
          { param: 'Speed', value: 100, frequencyBand: 'SUB' },
          { param: 'Twist', value: 10, frequencyBand: 'OFF' },
        ]
      }
    ]
  },
  RAINBOW_DOT: {
    id: 'RAINBOW_DOT',
    label: 'Rainbow Dot',
    effects: [
      {
        type: 'SHAPE',
        params: [
          { param: 'Side Count', value: 100, frequencyBand: 'OFF' },
          { param: 'Pointiness', value: 0, frequencyBand: 'OFF' },
          { param: 'Roundness', value: 0, frequencyBand: 'OFF' },
          { param: 'Size', value: 40, frequencyBand: 'SUB' },
          { param: 'Feather', value: 15, frequencyBand: 'OFF' },
          { param: 'Blend', value: 100, frequencyBand: 'OFF' },
        ]
      },
      {
        type: 'SPECTRAL_MAP',
        params: [
          { param: 'Resolution', value: 0, frequencyBand: 'OFF' },
          { param: 'Phase Offset', value: 0, frequencyBand: 'OFF' },
          { param: 'Speed', value: 100, frequencyBand: 'SUB' },
          { param: 'Strength', value: 100, frequencyBand: 'OFF' },
        ]
      }
    ]
  }
};

export const createEffectInstance = (type: GlitchEffectType, isPreview?: boolean): EffectConfig => {
  const metadata = EFFECT_METADATA[type];
  if (!metadata) {
    throw new Error(`Effect type ${type} not found`);
  }

  let seed = isPreview ? 1 : Math.floor(Math.random() * 10000);

  return {
    id: crypto.randomUUID(),
    type,
    params: metadata.params.map(p => ({
      param: p.name,
      value: isPreview && p.previewValue !== undefined ? p.previewValue : p.defaultValue,
      min: isPreview && p.previewMin !== undefined ? p.previewMin : (p.defaultMin ?? 0),
      frequencyBand: isPreview && p.previewBand !== undefined ? p.previewBand : p.defaultBand,
    })),
    muted: false,
    soloed: false,
    seed,
  };
};

export const createMacroInstance = (macroType: MacroType, isPreview?: boolean): EffectConfig[] => {
  const macro = MACRO_METADATA[macroType];
  if (!macro) return [];

  return macro.effects.map((effect, index) => {
    // We create a base instance from metadata to get all required params
    const instance = createEffectInstance(effect.type, isPreview);

    // Apply specific overrides from the macro definition
    if (effect.params) {
      effect.params.forEach(override => {
        const pIdx = instance.params.findIndex(p => p.param === override.param);
        if (pIdx !== -1) {
          if (override.value !== undefined) instance.params[pIdx].value = override.value;
          if (override.min !== undefined) instance.params[pIdx].min = override.min;
          if (override.frequencyBand !== undefined) instance.params[pIdx].frequencyBand = override.frequencyBand;
        }
      });
    }

    // Automatically meld all but the last one to keep them grouped
    instance.melded = index < macro.effects.length - 1;
    return instance;
  });
};

export const INITIAL_REACTIVE_EFFECTS: EffectConfig[] = [
  createEffectInstance('STARFIELD'),
  ...createMacroInstance('RAINBOW_DOT')
];

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
