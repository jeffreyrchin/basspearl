
export enum AppView {
  LANDING = 'LANDING',
  EDITOR = 'EDITOR',
  GALLERY = 'GALLERY',
  PROCESSING = 'PROCESSING',
  AUDIO_REACTIVE = 'AUDIO_REACTIVE'
}

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

export interface GlitchInfo {
  effects: EffectConfig[];
}

export interface CropState {
  aspectRatio: number | null;
  aspectLabel: string | null;
  scale: number;
  x: number;
  y: number;
  targetWidth?: number;
  targetHeight?: number;
}

export interface AudioMetadata {
  duration: number;
  format: string;
}

export interface GlitchState {
  originalImage: string | null;  // Full Resolution Master
  previewImage: string | null;   // 1280px Proxy for Editor
  processedImage: string | null;
  processedImagePreview?: string | null;  // 640px preview for display
  history: GlitchInfo[];
  historyIndex: number;
  effects: EffectConfig[];
  currentEffectIndex: number;
  crop: CropState;
  audioMetadata?: AudioMetadata | null; // If source was audio file
}
