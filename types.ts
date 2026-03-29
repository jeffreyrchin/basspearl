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
  | 'ROTATE'
  | 'SKEW'
  | 'SCREEN_SHAKE'
  | 'STARFIELD'
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
  | 'SCROLL'
  | 'LUMINANCE_MAP'
  | 'TERRAIN'
  | 'TERRAIN_SPHERE'
  | 'TRANSFORM'
  | 'CHECKERBOARD'
  | 'RGBA'
  | 'LINEAR_GRADIENT'
  | 'RADIAL_GRADIENT';

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
  isColorable?: boolean;
}

export type MacroType =
  'FOG_VORTEX' |
  'RAINBOW_DOT' |
  'RUBBER_BAND' |
  'METRO' |
  'LANDSCAPE' |
  'GRID_PLANE' |
  'LIQUID' |
  'PLANE_MESH' |
  'SPEED_TUNNEL' |
  'RINGS' |
  'PLUME' |
  'CELL_MASS' |
  'SPIKY_WORLD' |
  'CRYOGENIC_FLUID' |
  'WATERCOLOR' |
  'DISCO_BALL';

export interface MacroEffectOverrideItem {
  type: GlitchEffectType;
  params?: {
    param: string;
    value?: number;
    min?: number;
    frequencyBand?: FrequencyBand;
    previewValue?: number;
    previewMin?: number;
    previewBand?: FrequencyBand;
  }[];
  melded: boolean;
}

export interface MacroMetadata {
  id: MacroType;
  label: string;
  effects: MacroEffectOverrideItem[];
}
