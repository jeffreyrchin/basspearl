
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
  HUE_ROTATION: { label: 'Acid Trip', subLabel: 'COLOR CYCLING', icon: 'change_circle', category: 'Color', paramNames: [{ name: 'Phase Offset' }, { name: 'Speed' }, { name: 'Vibrance' }] },
  INVERT: { label: 'Invert', subLabel: 'NEGATIVE MIX', icon: 'invert_colors', category: 'Color', paramNames: [{ name: 'Inversion' }] },
  ZOOM_PAN: { label: 'Zoom Pulse', subLabel: 'RADIAL SCALE', icon: 'zoom_in', category: 'Motion', paramNames: [{ name: 'Scale' }, { name: 'Pan' }] },
  SCREEN_SHAKE: { label: 'Shake', subLabel: 'CAMERA JITTER', icon: 'vibration', category: 'Motion', paramNames: [{ name: 'Displacement' }, { name: 'Speed' }] },
  STARFIELD: { label: 'Starfield', subLabel: 'WARP SPEED', icon: 'auto_awesome', category: 'Additive', paramNames: [{ name: 'Density' }, { name: 'Speed' }] },
  RETRO_GRID: { label: 'Retro Grid', subLabel: 'SYNTHWAVE FLOOR', icon: 'grid_on', category: 'Additive', paramNames: [{ name: 'Thickness' }, { name: 'Speed' }] },
  TUNNEL_WARP: { label: 'Tunnel Warp', subLabel: 'TUNNEL WARP', icon: 'hub', category: 'Motion', paramNames: [{ name: 'Scale' }, { name: 'Speed' }, { name: 'Twist' }] },
  GRAIN: { label: 'Grain', subLabel: 'GRAIN', icon: 'blur_on', category: 'Additive', paramNames: [{ name: 'Width' }, { name: 'Height' }, { name: 'X-Freq' }, { name: 'Y-Freq' }, { name: 'Density' }, { name: 'Roundness' }] },
  SHAPE: { label: 'Shape', subLabel: 'SHAPE', icon: 'category', category: 'Additive', paramNames: [{ name: 'Side Count' }, { name: 'Pointiness' }, { name: 'Roundness' }, { name: 'Size' }, { name: 'Blend' }] },
  TRANSFORM: { label: 'Transform', subLabel: 'TRANSFORM', icon: 'transform', category: 'Motion', paramNames: [{ name: 'Width' }, { name: 'Height' }, { name: 'Rotation' }, { name: 'Rotation Speed' }, { name: 'Skew' }] },
  TILE: { label: 'Tile', subLabel: 'TILE', icon: 'apps', category: 'Motion', paramNames: [{ name: 'X-Freq' }, { name: 'Y-Freq' }, { name: 'Density' }, { name: 'Jitter' }] },
  ORGANIC_NOISE: { label: 'Organic Noise', subLabel: 'PERLIN FLOW', icon: 'cloud', category: 'Additive', paramNames: [{ name: 'Scale' }, { name: 'Complexity' }, { name: 'Warp' }, { name: 'Speed' }, { name: 'Blend' }] },
  CELLULAR_NOISE: { label: 'Cellular Noise', subLabel: 'WORLEY CELLS', icon: 'texture', category: 'Additive', paramNames: [{ name: 'Cell Width' }, { name: 'Cell Height' }, { name: 'X-Freq' }, { name: 'Y-Freq' }, { name: 'Density' }, { name: 'Jitter' }, { name: 'Speed' }, { name: 'Blend' }] },
  LUMINANCE_MASK: { label: 'Luminance Mask', subLabel: 'LUMINANCE MASK', icon: 'exposure', category: 'Mask', paramNames: [{ name: 'Threshold' }, { name: 'Feather' }, { name: 'Invert' }] },
  EDGE_MASK: { label: 'Edge Mask', subLabel: 'GLITCH OUTLINE', icon: 'filter_tilt_shift', category: 'Mask', paramNames: [{ name: 'Sensitivity' }, { name: 'Thickness' }, { name: 'Invert' }] },
  GRID: { label: 'Grid', subLabel: 'GRID', icon: 'grid_3x3', category: 'Additive', paramNames: [{ name: 'Horizontal' }, { name: 'Vertical' }, { name: 'Thickness' }, { name: 'Feather' }] },
  SPECTRAL_MAP: { label: 'Spectral Map', subLabel: 'SPECTRAL MAP', icon: 'colors', category: 'Color', paramNames: [{ name: 'Resolution' }, { name: 'Phase Offset' }, { name: 'Speed' }, { name: 'Strength' }] },
  BLACK_HOLE: { label: 'Black Hole', subLabel: 'VOID PINCH', icon: 'blur_circular', category: 'Motion', paramNames: [{ name: 'Intensity' }, { name: 'Radius' }, { name: 'Center X' }, { name: 'Center Y' }] },
  WHITE_HOLE: { label: 'White Hole', subLabel: 'VOID EXPLOSION', icon: 'brightness_7', category: 'Motion', paramNames: [{ name: 'Intensity' }, { name: 'Radius' }, { name: 'Center X' }, { name: 'Center Y' }] },
  PAN: { label: 'Pan', subLabel: 'X/Y PAN', icon: 'open_with', category: 'Motion', paramNames: [{ name: 'Pan X' }, { name: 'Pan Y' }] },
  SCROLL: { label: 'Scroll', subLabel: '4-WAY SCROLL', icon: 'sync_alt', category: 'Motion', paramNames: [{ name: 'Left Speed' }, { name: 'Right Speed' }, { name: 'Up Speed' }, { name: 'Down Speed' }] },
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
  { type: 'INVERT', values: [15], reactive: true, frequencyBand: 'BASS' },
  { type: 'DATA_CORRUPTION', values: [40, 77], reactive: true, frequencyBand: 'BASS' },
  { type: 'COLOR_BLEED', values: [59, 23], reactive: true, frequencyBand: 'MID' },
  { type: 'HUE_ROTATION', values: [8, 15, 73], reactive: true, frequencyBand: 'BASS' },
  { type: 'COMPRESSION_HELL', values: [33, 55], reactive: true, frequencyBand: 'BASS' },
  { type: 'DEEP_FRY', values: [15, 88], reactive: true, frequencyBand: 'SUB' },
  { type: 'ZOOM_PAN', values: [63, 0], reactive: true, frequencyBand: 'SUB' },
  { type: 'SCREEN_SHAKE', values: [50, 50], reactive: false, frequencyBand: 'BASS' },
  { type: 'STARFIELD', values: [40, 53], active: true, reactive: true, frequencyBand: 'BASS' },
  { type: 'RETRO_GRID', values: [30, 60], reactive: true, frequencyBand: 'SUB' },
  { type: 'TUNNEL_WARP', values: [50, 50, 0], reactive: true, frequencyBand: 'SUB' },
  { type: 'GRAIN', values: [100, 100, 50, 50, 100, 0], reactive: false, frequencyBand: 'TREBLE' },
  { type: 'ORGANIC_NOISE', values: [20, 100, 5, 30, 50], active: false, reactive: false, frequencyBand: 'BASS' },
  { type: 'CELLULAR_NOISE', values: [30, 30, 30, 30, 100, 100, 50, 50], active: false, reactive: false, frequencyBand: 'BASS' },
  { type: 'LUMINANCE_MASK', values: [50, 5, 0], active: false, reactive: false, frequencyBand: 'MID' },
  { type: 'EDGE_MASK', values: [50, 10, 0], active: false, reactive: false, frequencyBand: 'MID' },
  { type: 'GRID', values: [24, 24, 4, 16], reactive: false, frequencyBand: 'MID' },
  { type: 'SPECTRAL_MAP', values: [10, 0, 25, 100], reactive: false, frequencyBand: 'SUB' },
  { type: 'TRANSFORM', values: [60, 60, 0, 0, 50], reactive: false, frequencyBand: 'SUB' },
  { type: 'TILE', values: [14, 14, 100, 0], reactive: false, frequencyBand: 'MID' },
  { type: 'SHAPE', values: [3, 0, 0, 30, 100], reactive: false, frequencyBand: 'MID' },
  { type: 'BLACK_HOLE', values: [50, 50, 50, 50], reactive: false, frequencyBand: 'SUB' },
  { type: 'WHITE_HOLE', values: [50, 50, 50, 50], reactive: false, frequencyBand: 'SUB' },
  { type: 'PAN', values: [0, 0], active: false, reactive: false, frequencyBand: 'SUB' },
  { type: 'SCROLL', values: [15, 0, 0, 0], active: false, reactive: true, frequencyBand: 'SUB' },
]);

export const createEffectInstance = (type: GlitchEffectType): EffectConfig => {
  const template = INITIAL_REACTIVE_EFFECTS.find(e => e.type === type);
  if (template) {
    return { ...template, active: true, seed: Math.floor(Math.random() * 10000) };
  }
  return {
    type,
    params: EFFECT_METADATA[type].paramNames.map(p => ({ param: p.name, value: 50, reactive: false })),
    active: true,
    frequencyBand: 'BASS',
  };
};

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
      { type: 'STARFIELD', values: [15, 100], active: true, reactive: true, frequencyBand: 'SUB' },
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
      { type: 'INVERT', values: [100], active: true, reactive: true, frequencyBand: 'MID' },
      { type: 'DATA_CORRUPTION', values: [11, 100], active: true, reactive: true, frequencyBand: 'SUB' },
      { type: 'HUE_ROTATION', values: [8, 0, 73], active: true, reactive: true, frequencyBand: 'BASS' },
      { type: 'ZOOM_PAN', values: [100, 0], active: true, reactive: true, frequencyBand: 'SUB' },
    ])
  }
];
