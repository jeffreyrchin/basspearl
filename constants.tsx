
import { GlitchEffectType, EffectConfig, EffectCategory } from './types';

export const EFFECT_METADATA: Record<GlitchEffectType, {
  label: string;
  subLabel: string;
  icon: string;
  category: EffectCategory;
  paramNames: { name: string }[];
}> = {
  PIXEL_SORT: { label: 'Pixel Sort', subLabel: 'VERTICAL SCAN', icon: 'sort', category: 'Glitch', paramNames: [{ name: 'Streak Length' }, { name: 'Trigger Level' }] },
  CHANNEL_SHIFT: { label: 'RGB Shift', subLabel: 'CHROMATIC ABERRATION', icon: 'layers', category: 'Color', paramNames: [{ name: 'Offset' }, { name: 'Vertical Tear' }] },
  DATA_CORRUPTION: { label: 'Datamosh', subLabel: 'DELTA COMPRESSION', icon: 'grid_4x4', category: 'Glitch', paramNames: [{ name: 'Mosh Length' }, { name: 'Mosh Density' }] },
  DEEP_FRY: { label: 'Deep Fry', subLabel: 'SATURATION HELL', icon: 'local_fire_department', category: 'Color', paramNames: [{ name: 'Heat' }, { name: 'Posterize' }] },
  SCAN_LINES: { label: 'Scan Lines', subLabel: 'CRT SIMULATION', icon: 'reorder', category: 'Retro', paramNames: [{ name: 'Opacity' }, { name: 'Line Spacing' }] },
  BIT_CRUSH: { label: 'Bit Crush', subLabel: '8-BIT DECIMATION', icon: 'developer_board', category: 'Glitch', paramNames: [{ name: 'Quantize' }, { name: 'Resample' }] },
  WAVE_DISTORTION: { label: 'Wave Distortion', subLabel: 'SINE WAVE MAP', icon: 'waves', category: 'Motion', paramNames: [{ name: 'Amplitude' }, { name: 'Frequency' }] },
  COLOR_BLEED: { label: 'Color Bleed', subLabel: 'HORIZONTAL SMEAR', icon: 'palette', category: 'Color', paramNames: [{ name: 'Bleed' }, { name: 'Ghosting' }] },
  COMPRESSION_HELL: { label: 'Compression Hell', subLabel: 'JPEG ARTIFACTS', icon: 'compress', category: 'Glitch', paramNames: [{ name: 'Block Size' }, { name: 'Artifacting' }] },
  RANDOM_CHAOS: { label: 'Random Chaos', subLabel: 'SYSTEM COLLAPSE', icon: 'bolt', category: 'Particles', paramNames: [{ name: 'Entropy' }, { name: 'Jitter' }] },
  ANALOG_NOISE: { label: 'Analog Noise', subLabel: 'FILM GRAIN', icon: 'grain', category: 'Retro', paramNames: [{ name: 'Gain' }, { name: 'Greyscale' }] },
  HUE_ROTATION: { label: 'Acid Trip', subLabel: 'COLOR CYCLING', icon: 'change_circle', category: 'Color', paramNames: [{ name: 'Spectrum' }, { name: 'Vibrance' }] },
  INVERT_GHOST: { label: 'Spectral', subLabel: 'NEGATIVE MIX', icon: 'invert_colors', category: 'Color', paramNames: [{ name: 'Inversion' }] },
  ZOOM_PAN: { label: 'Zoom Pulse', subLabel: 'RADIAL SCALE', icon: 'zoom_in', category: 'Motion', paramNames: [{ name: 'Scale' }, { name: 'Pan' }] },
  SCREEN_SHAKE: { label: 'Shake', subLabel: 'CAMERA JITTER', icon: 'vibration', category: 'Motion', paramNames: [{ name: 'Displacement' }, { name: 'Speed' }] },
  STARFIELD: { label: 'Starfield', subLabel: 'WARP SPEED', icon: 'auto_awesome', category: 'Particles', paramNames: [{ name: 'Density' }, { name: 'Speed' }] },
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
  { type: 'SCREEN_SHAKE', values: [50, 50], reactive: false, frequencyBand: 'BASS' },
  { type: 'STARFIELD', values: [80, 10], active: true, reactive: false, frequencyBand: 'BASS' },
]);

export const FEEDBACK_FORM_URL = 'https://forms.gle/CBVXwJv9s3ZvXyWr8';
