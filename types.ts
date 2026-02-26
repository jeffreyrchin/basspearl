export type EffectCategory = 'All' | 'Additive' | 'Color' | 'Glitch' | 'Motion' | 'Mask';

export type GlitchEffectType =
  | 'PIXEL_SORT'
  | 'CHANNEL_SHIFT'
  | 'DATA_CORRUPTION'
  | 'DEEP_FRY'
  | 'SCAN_LINES'
  | 'BIT_CRUSH'
  | 'WAVE_DISTORTION'
  | 'COLOR_BLEED'
  | 'COMPRESSION_HELL'
  | 'RANDOM_CHAOS'
  | 'HUE_ROTATION'
  | 'INVERT'
  | 'ZOOM_PAN'
  | 'SCREEN_SHAKE'
  | 'STARFIELD'
  | 'RETRO_GRID'
  | 'TUNNEL_WARP'
  | 'GRAIN'
  | 'GRID'
  | 'SPECTRAL_MAP'
  | 'SHAPE'
  | 'TRANSFORM'
  | 'TILE'
  | 'ORGANIC_NOISE'
  | 'LUMINANCE_MASK'
  | 'CELLULAR_NOISE'
  | 'EDGE_MASK'
  | 'BLACK_HOLE'
  | 'WHITE_HOLE';

export interface EffectConfig {
  type: GlitchEffectType;
  params: { param: string, value: number, reactive: boolean }[];
  active: boolean;
  seed?: number;
  frequencyBand?: 'SUB' | 'BASS' | 'MID' | 'TREBLE';
}
