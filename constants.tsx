
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
  SCAN_LINES: { label: 'Scan Lines', subLabel: 'CRT SIMULATION', icon: 'reorder', category: 'Additive', paramNames: [{ name: 'Opacity' }, { name: 'Line Spacing' }] },
  BIT_CRUSH: { label: 'Bit Crush', subLabel: '8-BIT DECIMATION', icon: 'developer_board', category: 'Glitch', paramNames: [{ name: 'Quantize' }, { name: 'Resample' }] },
  WAVE_DISTORTION: { label: 'Wave Distortion', subLabel: 'SINE WAVE MAP', icon: 'waves', category: 'Motion', paramNames: [{ name: 'Amplitude' }, { name: 'Frequency' }, { name: 'Speed' }] },
  COLOR_BLEED: { label: 'Color Bleed', subLabel: 'HORIZONTAL SMEAR', icon: 'palette', category: 'Color', paramNames: [{ name: 'Bleed' }, { name: 'Ghosting' }] },
  COMPRESSION_HELL: { label: 'Compression Hell', subLabel: 'JPEG ARTIFACTS', icon: 'compress', category: 'Glitch', paramNames: [{ name: 'Block Size' }, { name: 'Artifacting' }] },
  RANDOM_CHAOS: { label: 'Random Chaos', subLabel: 'SYSTEM COLLAPSE', icon: 'bolt', category: 'Additive', paramNames: [{ name: 'Entropy' }, { name: 'Jitter' }] },
  HUE_ROTATION: { label: 'Acid Trip', subLabel: 'COLOR CYCLING', icon: 'change_circle', category: 'Color', paramNames: [{ name: 'Spectrum' }, { name: 'Vibrance' }] },
  INVERT_GHOST: { label: 'Spectral', subLabel: 'NEGATIVE MIX', icon: 'invert_colors', category: 'Color', paramNames: [{ name: 'Inversion' }] },
  ZOOM_PAN: { label: 'Zoom Pulse', subLabel: 'RADIAL SCALE', icon: 'zoom_in', category: 'Motion', paramNames: [{ name: 'Scale' }, { name: 'Pan' }] },
  SCREEN_SHAKE: { label: 'Shake', subLabel: 'CAMERA JITTER', icon: 'vibration', category: 'Motion', paramNames: [{ name: 'Displacement' }, { name: 'Speed' }] },
  STARFIELD: { label: 'Starfield', subLabel: 'WARP SPEED', icon: 'auto_awesome', category: 'Additive', paramNames: [{ name: 'Density' }, { name: 'Speed' }] },
  RETRO_GRID: { label: 'Retro Grid', subLabel: 'SYNTHWAVE FLOOR', icon: 'grid_on', category: 'Additive', paramNames: [{ name: 'Thickness' }, { name: 'Speed' }] },
  TUNNEL_WARP: { label: 'Tunnel Warp', subLabel: 'TUNNEL WARP', icon: 'hub', category: 'Motion', paramNames: [{ name: 'Scale' }, { name: 'Speed' }, { name: 'Twist' }] },
  NOISE: { label: 'Noise', subLabel: 'NOISE', icon: 'blur_on', category: 'Additive', paramNames: [{ name: 'Horizontal' }, { name: 'Vertical' }, { name: 'Density' }] },
  BEAM: { label: 'Beam', subLabel: 'BEAM', icon: 'lens_blur', category: 'Additive', paramNames: [{ name: 'Radius' }, { name: 'Intensity' }] },
  GRID: { label: 'Grid', subLabel: 'GRID', icon: 'grid_3x3', category: 'Additive', paramNames: [{ name: 'Horizontal' }, { name: 'Vertical' }, { name: 'Thickness' }, { name: 'Feather' }] },
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
  { type: 'CHANNEL_SHIFT', values: [50, 50], reactive: true, frequencyBand: 'BASS' },
  { type: 'WAVE_DISTORTION', values: [18, 24, 50], reactive: true, frequencyBand: 'SUB' },
  { type: 'SCAN_LINES', values: [37, 3], reactive: false, frequencyBand: 'BASS' },
  { type: 'PIXEL_SORT', values: [50, 50], reactive: true, frequencyBand: 'SUB' },
  { type: 'BIT_CRUSH', values: [0, 24], reactive: true, frequencyBand: 'BASS' },
  { type: 'INVERT_GHOST', values: [15], reactive: true, frequencyBand: 'BASS' },
  { type: 'DATA_CORRUPTION', values: [40, 77], reactive: true, frequencyBand: 'BASS' },
  { type: 'COLOR_BLEED', values: [59, 23], reactive: true, frequencyBand: 'MID' },
  { type: 'RANDOM_CHAOS', values: [51, 10], reactive: true, frequencyBand: 'SUB' },
  { type: 'HUE_ROTATION', values: [8, 73], reactive: true, frequencyBand: 'BASS' },
  { type: 'COMPRESSION_HELL', values: [33, 55], reactive: true, frequencyBand: 'BASS' },
  { type: 'DEEP_FRY', values: [15, 88], reactive: true, frequencyBand: 'SUB' },
  { type: 'ZOOM_PAN', values: [63, 0], reactive: true, frequencyBand: 'SUB' },
  { type: 'SCREEN_SHAKE', values: [50, 50], reactive: false, frequencyBand: 'BASS' },
  { type: 'STARFIELD', values: [80, 53], active: true, reactive: true, frequencyBand: 'BASS' },
  { type: 'RETRO_GRID', values: [30, 60], reactive: true, frequencyBand: 'SUB' },
  { type: 'TUNNEL_WARP', values: [50, 50, 0], reactive: true, frequencyBand: 'SUB' },
  { type: 'NOISE', values: [100, 100, 50], reactive: false, frequencyBand: 'TREBLE' },
  { type: 'BEAM', values: [40, 80], reactive: true, frequencyBand: 'BASS' },
  { type: 'GRID', values: [24, 24, 4, 16], reactive: false, frequencyBand: 'MID' },
]);

export const FEEDBACK_FORM_URL = 'https://forms.gle/CBVXwJv9s3ZvXyWr8';

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
    effects: buildEffects([
      { type: 'STARFIELD', values: [50, 100], active: true, reactive: true, frequencyBand: 'SUB' },
      { type: 'CHANNEL_SHIFT', values: [18, 0], active: true, reactive: true, frequencyBand: 'SUB' },
      { type: 'ZOOM_PAN', values: [50, 0], active: true, reactive: true, frequencyBand: 'SUB' },
    ])
  },
  {
    id: 'underwater',
    label: '🌊',
    image: '/presets/underwater.png',
    audio: '/presets/1_17_22 new instrument.mp3',
    effects: buildEffects([
      { type: 'BIT_CRUSH', values: [0, 27], active: true, reactive: true, frequencyBand: 'SUB' },
      { type: 'INVERT_GHOST', values: [100], active: true, reactive: true, frequencyBand: 'MID' },
      { type: 'DATA_CORRUPTION', values: [11, 100], active: true, reactive: true, frequencyBand: 'SUB' },
      { type: 'HUE_ROTATION', values: [8, 73], active: true, reactive: true, frequencyBand: 'BASS' },
      { type: 'ZOOM_PAN', values: [100, 0], active: true, reactive: true, frequencyBand: 'SUB' },
    ])
  }
];
