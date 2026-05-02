export const FEEDBACK_FORM_URL = 'https://forms.gle/CBVXwJv9s3ZvXyWr8';
export const INITIAL_REACTIVE_EFFECTS: any[] = [];
export const MAX_PIXELS = 3840 * 2160;
export const THUMBNAIL_SIZE = 512;
export const INITIAL_SCENE_COUNT = 9;
export const CONTACT_EMAIL = 'legato196@gmail.com';

export const DEFAULT_TRANSITION_DURATION = 0.2;

export const MASTER_ASPECT_RATIO = 16 / 9;
export const DEFAULT_TARGET_WIDTH = 1440;
export const MIN_TARGET_WIDTH = 960;

export const MIN_PUZZLE_COMPLETION_SCORE = 80;

export const MAX_FREE_SCENES = 16;

export const DIFFICULTY_TRACKS = {
  Easy: { url: '/air.mp3', label: 'Demo Track 1' },
  Medium: { url: '/trip.mp3', label: 'Demo Track 2' },
  Hard: { url: '/dark_wind.mp3', label: 'Demo Track 3' },
} as const;

export const TRANSITION_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Crossfade', value: 'crossfade' },
  { label: 'Fade to Black', value: 'fade_to_black' },
  { label: 'Flash', value: 'flash' },
  { label: 'Zoom Fade', value: 'zoom_fade' }
] as const;

// Re-export Data
export * from './config/effects';
export * from './config/macros';

import { GlitchEffectType, MacroType, EffectConfig } from './types';
import { EFFECT_METADATA } from './config/effects';
import { MACRO_METADATA } from './config/macros';

export const createEffectInstance = (type: GlitchEffectType, isPreview?: boolean): EffectConfig => {
  const metadata = EFFECT_METADATA[type];
  if (!metadata) {
    throw new Error(`Effect type ${type} not found`);
  }

  let seed = isPreview ? 1 : Math.floor(Math.random() * 10000);

  return {
    id: crypto.randomUUID(),
    type,
    params: metadata.params.map(p => ({
      param: p.name,
      value: isPreview && p.previewValue !== undefined ? p.previewValue : p.defaultValue,
      min: isPreview && p.previewMin !== undefined ? p.previewMin : (p.defaultMin ?? 0),
      frequencyBand: isPreview && p.previewBand !== undefined ? p.previewBand : p.defaultBand,
    })),
    muted: false,
    soloed: false,
    seed,
    aspectLocked: metadata.defaultAspectLocked,
  };
};

export const createMacroInstance = (macroType: MacroType, isPreview?: boolean): EffectConfig[] => {
  const macro = MACRO_METADATA[macroType];
  if (!macro) return [];

  return macro.effects.map((effect, index) => {
    // We create a base instance from metadata to get all required params
    const instance = createEffectInstance(effect.type, isPreview);

    // Apply specific overrides from the macro definition
    if (effect.params) {
      effect.params.forEach((override: any) => {
        const pIdx = instance.params.findIndex((p: any) => p.param === override.param);
        if (pIdx !== -1) {
          if (override.value !== undefined) instance.params[pIdx].value = override.value;
          if (override.previewValue !== undefined && isPreview) instance.params[pIdx].value = override.previewValue;
          if (override.min !== undefined) instance.params[pIdx].min = override.min;
          if (override.previewMin !== undefined && isPreview) instance.params[pIdx].min = override.previewMin;
          if (override.frequencyBand !== undefined) instance.params[pIdx].frequencyBand = override.frequencyBand;
          if (override.previewBand !== undefined && isPreview) instance.params[pIdx].frequencyBand = override.previewBand;
        }
      });
    }

    if (index === macro.effects.length - 1) {
      instance.melded = false;
    } else {
      instance.melded = effect.melded;
    }

    return instance;
  });
};
