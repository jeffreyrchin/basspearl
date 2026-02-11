
import { GlitchEffectType, EffectConfig } from './types';

export const EFFECT_METADATA: Record<GlitchEffectType, {
  label: string;
  subLabel: string;
  icon: string;
  paramNames: { name: string }[];
}> = {
  PIXEL_SORT: { label: 'Pixel Sort', subLabel: 'VERTICAL SCAN', icon: 'sort', paramNames: [{ name: 'Streak Length' }, { name: 'Trigger Level' }] },
  CHANNEL_SHIFT: { label: 'RGB Shift', subLabel: 'CHROMATIC ABERRATION', icon: 'layers', paramNames: [{ name: 'Offset' }, { name: 'Vertical Tear' }] },
  DATA_CORRUPTION: { label: 'Datamosh', subLabel: 'DELTA COMPRESSION', icon: 'grid_4x4', paramNames: [{ name: 'Mosh Length' }, { name: 'Mosh Density' }] },
  DEEP_FRY: { label: 'Deep Fry', subLabel: 'SATURATION HELL', icon: 'local_fire_department', paramNames: [{ name: 'Heat' }, { name: 'Posterize' }] },
  SCAN_LINES: { label: 'Scan Lines', subLabel: 'CRT SIMULATION', icon: 'reorder', paramNames: [{ name: 'Opacity' }, { name: 'Line Spacing' }] },
  BIT_CRUSH: { label: 'Bit Crush', subLabel: '8-BIT DECIMATION', icon: 'developer_board', paramNames: [{ name: 'Quantize' }, { name: 'Resample' }] },
  WAVE_DISTORTION: { label: 'Wave Distortion', subLabel: 'SINE WAVE MAP', icon: 'waves', paramNames: [{ name: 'Amplitude' }, { name: 'Frequency' }] },
  COLOR_BLEED: { label: 'Color Bleed', subLabel: 'HORIZONTAL SMEAR', icon: 'palette', paramNames: [{ name: 'Bleed' }, { name: 'Ghosting' }] },
  COMPRESSION_HELL: { label: 'Compression Hell', subLabel: 'JPEG ARTIFACTS', icon: 'compress', paramNames: [{ name: 'Block Size' }, { name: 'Artifacting' }] },
  RANDOM_CHAOS: { label: 'Random Chaos', subLabel: 'SYSTEM COLLAPSE', icon: 'bolt', paramNames: [{ name: 'Entropy' }, { name: 'Jitter' }] },
  ANALOG_NOISE: { label: 'Analog Noise', subLabel: 'FILM GRAIN', icon: 'grain', paramNames: [{ name: 'Gain' }, { name: 'Greyscale' }] },
  HUE_ROTATION: { label: 'Acid Trip', subLabel: 'COLOR CYCLING', icon: 'change_circle', paramNames: [{ name: 'Spectrum' }, { name: 'Vibrance' }] },
  INVERT_GHOST: { label: 'Spectral', subLabel: 'NEGATIVE MIX', icon: 'invert_colors', paramNames: [{ name: 'Inversion' }] },
  ZOOM_PAN: { label: 'Zoom Pulse', subLabel: 'RADIAL SCALE', icon: 'zoom_in', paramNames: [{ name: 'Scale' }, { name: 'Pan' }] },
  SCREEN_SHAKE: { label: 'Shake', subLabel: 'CAMERA JITTER', icon: 'vibration', paramNames: [{ name: 'Intensity' }, { name: 'Roughness' }] },
};

const buildParams = (
  type: GlitchEffectType,
  values: number[],
  reactive: boolean
) => {
  const meta = EFFECT_METADATA[type];

  return meta.paramNames.map((p, i) => ({
    param: p.name,
    value: values[i] ?? 0,
    reactive,
  }));
};

const buildEffects = (
  config: {
    type: GlitchEffectType;
    values: number[];
    active?: boolean;
    reactive?: boolean;
    frequencyBand?: EffectConfig['frequencyBand'];
  }[]
): EffectConfig[] =>
  config.map((e, index) => ({
    type: e.type,
    params: buildParams(e.type, e.values, !!e.reactive),
    active: !!e.active,
    seed: index, // index used as seed
    ...(e.frequencyBand ? { frequencyBand: e.frequencyBand } : {}),
  }));

export const INITIAL_EFFECTS: EffectConfig[] = buildEffects([
  { type: 'PIXEL_SORT', values: [72, 85], active: true },
  { type: 'CHANNEL_SHIFT', values: [30, 50] },
  { type: 'DATA_CORRUPTION', values: [20, 80] },
  { type: 'DEEP_FRY', values: [50, 50] },
  { type: 'SCAN_LINES', values: [40, 50] },
  { type: 'BIT_CRUSH', values: [25, 50] },
  { type: 'WAVE_DISTORTION', values: [15, 50] },
  { type: 'COLOR_BLEED', values: [35, 50] },
  { type: 'COMPRESSION_HELL', values: [16, 78] },
  { type: 'RANDOM_CHAOS', values: [16, 0] },
  { type: 'ANALOG_NOISE', values: [40, 50] },
  { type: 'HUE_ROTATION', values: [20, 80] },
  { type: 'INVERT_GHOST', values: [80] },
  { type: 'ZOOM_PAN', values: [0, 0] },
  { type: 'SCREEN_SHAKE', values: [0, 0] },
]);

export const INITIAL_REACTIVE_EFFECTS: EffectConfig[] = buildEffects([
  { type: 'CHANNEL_SHIFT', values: [50, 50], active: true, reactive: true, frequencyBand: 'BASS' },
  { type: 'WAVE_DISTORTION', values: [4, 24], reactive: true, frequencyBand: 'MID' },
  { type: 'SCAN_LINES', values: [60, 40], reactive: true, frequencyBand: 'MID' },
  { type: 'PIXEL_SORT', values: [50, 80], reactive: true, frequencyBand: 'ENERGY' },
  { type: 'BIT_CRUSH', values: [0, 40], reactive: true, frequencyBand: 'MID' },
  { type: 'ANALOG_NOISE', values: [100, 50], reactive: true, frequencyBand: 'ENERGY' },
  { type: 'INVERT_GHOST', values: [15], reactive: true, frequencyBand: 'BASS' },
  { type: 'DATA_CORRUPTION', values: [40, 100], reactive: true, frequencyBand: 'MID' },
  { type: 'COLOR_BLEED', values: [59, 23], reactive: true, frequencyBand: 'MID' },
  { type: 'RANDOM_CHAOS', values: [7, 11], reactive: true, frequencyBand: 'ENERGY' },
  { type: 'HUE_ROTATION', values: [8, 73], reactive: true, frequencyBand: 'ENERGY' },
  { type: 'COMPRESSION_HELL', values: [33, 55], reactive: true, frequencyBand: 'MID' },
  { type: 'DEEP_FRY', values: [15, 88], reactive: true, frequencyBand: 'ENERGY' },
  { type: 'ZOOM_PAN', values: [63, 0], active: true, reactive: true, frequencyBand: 'ENERGY' },
  { type: 'SCREEN_SHAKE', values: [30, 0], reactive: true, frequencyBand: 'BASS' },
]);

// presets for non-reactive effects
const applyPreset = (
  overrides: Partial<Record<GlitchEffectType, number[]>>
): EffectConfig[] =>
  INITIAL_EFFECTS.map((effect, index) => {
    const values = overrides[effect.type];

    if (!values) {
      return { ...effect, active: false, seed: index };
    }

    return {
      ...effect,
      active: true,
      params: buildParams(effect.type, values, false),
      seed: index,
    };
  });

export const PRESETS: Record<string, EffectConfig[]> = {
  RESET: INITIAL_EFFECTS.map((e, i) => ({
    ...e,
    active: false,
    seed: i,
  })),

  GLITCH_RAIN: applyPreset({
    PIXEL_SORT: [78, 86],
    COLOR_BLEED: [10, 5],
    SCAN_LINES: [27, 0],
    BIT_CRUSH: [0, 3],
  }),

  CYBERPUNK: applyPreset({
    PIXEL_SORT: [80, 30],
    CHANNEL_SHIFT: [50, 20],
    SCAN_LINES: [40, 20],
  }),

  VAPORWAVE: applyPreset({
    SCAN_LINES: [30, 40],
    WAVE_DISTORTION: [25, 15],
    CHANNEL_SHIFT: [30, 0],
    COLOR_BLEED: [60, 30],
  }),

  DEEP_FRIED: applyPreset({
    DEEP_FRY: [60, 40],
    ANALOG_NOISE: [50, 0],
    WAVE_DISTORTION: [20, 0],
  }),

  SYSTEM_FAILURE: applyPreset({
    DATA_CORRUPTION: [70, 30],
    PIXEL_SORT: [40, 70],
    RANDOM_CHAOS: [40, 60],
    CHANNEL_SHIFT: [30, 30],
  }),

  VHS_RETRO: applyPreset({
    SCAN_LINES: [40, 30],
    ANALOG_NOISE: [30, 80],
    WAVE_DISTORTION: [30, 5],
    CHANNEL_SHIFT: [40, 0],
    COLOR_BLEED: [50, 60],
  }),

  ACID_TRIP: applyPreset({
    HUE_ROTATION: [50, 50],
    WAVE_DISTORTION: [70, 20],
    COLOR_BLEED: [60, 40],
  }),

  GHOST_MACHINE: applyPreset({
    INVERT_GHOST: [60],
    PIXEL_SORT: [40, 20],
    COLOR_BLEED: [50, 80],
  }),
};

export const FEEDBACK_FORM_URL = 'https://forms.gle/CBVXwJv9s3ZvXyWr8';
