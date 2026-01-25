
export enum AppView {
  LANDING = 'LANDING',
  EDITOR = 'EDITOR',
  GALLERY = 'GALLERY',
  PROCESSING = 'PROCESSING'
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
  | 'RANDOM_CHAOS';

export interface EffectConfig {
  type: GlitchEffectType;
  intensity: number; // 0 to 100
  threshold: number; // 0 to 100
  active: boolean;
  seed?: number;
}

export interface GlitchInfo {
  effects: EffectConfig[];
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
}
