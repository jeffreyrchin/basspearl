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
  | 'ANALOG_NOISE'
  | 'HUE_ROTATION'
  | 'INVERT_GHOST'
  | 'ZOOM_PAN'
  | 'SCREEN_SHAKE';

export interface EffectConfig {
  type: GlitchEffectType;
  params: { param: string, value: number, reactive: boolean }[];
  active: boolean;
  seed?: number;
  frequencyBand?: 'BASS' | 'MID' | 'TREBLE' | 'ENERGY';
}
