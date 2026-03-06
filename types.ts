export type EffectCategory = 'All' | 'Pattern' | 'Color' | 'Spatial' | 'Distort' | 'Macro';

export type GlitchEffectType =
  | 'PIXEL_SORT'
  | 'CHANNEL_SHIFT'
  | 'DATA_CORRUPTION'
  | 'DEEP_FRY'
  | 'BIT_CRUSH'
  | 'WAVE_DISTORTION'
  | 'COLOR_BLEED'
  | 'COMPRESSION_HELL'
  | 'HUE_ROTATION'
  | 'INVERT'
  | 'SCALE'
  | 'ROTATE'
  | 'SKEW'
  | 'SCREEN_SHAKE'
  | 'STARFIELD'
  | 'RETRO_GRID'
  | 'TUNNEL_WARP'
  | 'GRAIN'
  | 'GRID'
  | 'SPECTRAL_MAP'
  | 'SHAPE'
  | 'TILE'
  | 'ORGANIC_NOISE'
  | 'LUMINANCE_MASK'
  | 'CELLULAR_NOISE'
  | 'EDGE_MASK'
  | 'BLACK_HOLE'
  | 'WHITE_HOLE'
  | 'PAN'
  | 'SCROLL'
  | 'LUMINANCE_MAP';

export type FrequencyBand = 'OFF' | 'SUB' | 'BASS' | 'MID' | 'TREBLE';

export interface EffectConfig {
  id: string;
  type: GlitchEffectType;
  params: { param: string, value: number, min: number, frequencyBand: FrequencyBand }[];
  muted?: boolean;
  soloed?: boolean;
  melded?: boolean;
  seed?: number;
}

export interface EffectParamMetadata {
  name: string;
  defaultValue: number;
  defaultMin?: number;
  defaultBand: FrequencyBand;
  previewValue?: number;
  previewMin?: number;
  previewBand?: FrequencyBand;
}

export interface EffectMetadata {
  label: string;
  icon: string;
  category: EffectCategory;
  params: EffectParamMetadata[];
}

export type MacroType = 'FOG_VORTEX' | 'RAINBOW_DOT' | 'RUBBER_BAND';

export interface MacroEffectOverrideItem {
  type: GlitchEffectType;
  params?: {
    param: string;
    value?: number;
    min?: number;
    frequencyBand?: FrequencyBand;
  }[];
}

export interface MacroMetadata {
  id: MacroType;
  label: string;
  effects: MacroEffectOverrideItem[];
}
