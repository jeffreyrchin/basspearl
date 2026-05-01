export type EffectCategory = 'Pattern' | 'Macro' | 'Modifier';

export type GlitchEffectType =
  | 'CHANNEL_SHIFT'
  | 'DATA_CORRUPTION'
  | 'DEEP_FRY'
  | 'BIT_CRUSH'
  | 'WAVE_DISTORTION'
  | 'COLOR_BLEED'
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
  | 'TERRAIN_RING'
  | 'TRANSFORM'
  | 'CHECKERBOARD'
  | 'RGBA'
  | 'LINEAR_GRADIENT'
  | 'RADIAL_GRADIENT'
  | 'INFINITE_ZOOM'
  | 'BLUR'
  | 'GLOW'
  | 'TRI_CRUSH'
  | 'HEX_CRUSH'
  | 'SPIRAL_GRADIENT'
  | 'IMAGE'
  | 'PARTICLES';

export type FrequencyBand = 'OFF' | 'SUB' | 'BASS' | 'MID' | 'TREBLE';

export interface EffectConfig {
  id: string;
  type: GlitchEffectType;
  params: { param: string, value: number, min: number, frequencyBand: FrequencyBand }[];
  muted?: boolean;
  soloed?: boolean;
  melded?: boolean;
  seed?: number;
  assetUrl?: string;
  assetName?: string;
  aspectLocked?: boolean;
  aspectRatio?: number;
}

export interface EffectParamMetadata {
  name: string;
  defaultValue: number;
  defaultMin?: number;
  defaultBand: FrequencyBand;
  previewValue?: number;
  previewMin?: number;
  previewBand?: FrequencyBand;
  cyclic?: boolean;
}

export interface EffectMetadata {
  label: string;
  category: EffectCategory;
  params: EffectParamMetadata[];
  defaultAspectLocked?: boolean;
}

export type MacroType =
  'FOG_VORTEX' |
  'RUBBER_BAND' |
  'METRO' |
  'LANDSCAPE' |
  'LIQUID' |
  'RODS' |
  'RINGS' |
  'PLUME' |
  'CELL_MESH' |
  'SPIKY_BALL' |
  'CRYOGENIC_FLUID' |
  'DISCO_BALL' |
  'STREAKS' |
  'PAINT_MORPH' |
  'INFINITE_DANCEFLOOR' |
  'CLUSTER' |
  'GLOBE' |
  'SHARDS' |
  'ARCS' |
  'GRAIN_TUNNEL' |
  'LIGHT_TUNNEL' |
  'CLOUDS' |
  'QUAD_FRACTAL' |
  'ATOMS' |
  'CELLULAR_MATRIX' |
  'SMOKE' |
  'CRUSHED_RAIN' |
  'RIPPLES' |
  'CORRIDOR' |
  'SQUARE_RIPPLES' |
  'ANGULAR' |
  'SEARCHLIGHTS' |
  'WAXY_STARS' |
  'SPIRAL_GLOW' |
  'RUSH_HOUR' |
  'STEEL_LATTICE' |
  'CRYSTAL_RAIN' |
  'STORM' |
  'TEETH' |
  'HEXAGON_TUNNEL' |
  'AURORA' |
  'STARFIELD_3D' |
  'FLAMES';

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
  requiredPuzzleCompletedToUnlock?: PuzzleType;
}

export type TransitionType =
  'none' |
  'crossfade' |
  'fade_to_black' |
  'flash' |
  'zoom_fade';

export type PuzzleType =
  'SPIRAL_GLOW' |
  'AURORA' |
  'TEETH' |
  'SEARCHLIGHTS' |
  'GRAIN_TUNNEL' |
  'RUSH_HOUR' |
  'STREAKS' |
  'CRYOGENIC_FLUID' |
  'ARCS' |
  'LANDSCAPE' |
  'STORM' |
  'SQUARE_RIPPLES' |
  'DISCO_BALL' |
  'FLAMES' |
  'WAXY_STARS';

export interface PuzzleMetadata {
  difficulty: 'Easy' | 'Medium' | 'Hard';
  macro: MacroType;
  allowedEffects?: GlitchEffectType[];
}
