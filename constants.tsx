
import React from 'react';
import { GlitchEffectType, EffectConfig } from './types';

export const INITIAL_EFFECTS = [
  { type: 'PIXEL_SORT' as GlitchEffectType, intensity: 72, threshold: 40, active: true },
  { type: 'CHANNEL_SHIFT' as GlitchEffectType, intensity: 30, threshold: 50, active: false },
  { type: 'DATA_CORRUPTION' as GlitchEffectType, intensity: 20, threshold: 80, active: false },
  { type: 'DEEP_FRY' as GlitchEffectType, intensity: 50, threshold: 50, active: false },
  { type: 'SCAN_LINES' as GlitchEffectType, intensity: 40, threshold: 50, active: false },
  { type: 'BIT_CRUSH' as GlitchEffectType, intensity: 25, threshold: 50, active: false },
  { type: 'WAVE_DISTORTION' as GlitchEffectType, intensity: 15, threshold: 50, active: false },
  { type: 'COLOR_BLEED' as GlitchEffectType, intensity: 35, threshold: 50, active: false },
  { type: 'COMPRESSION_HELL' as GlitchEffectType, intensity: 60, threshold: 50, active: false },
  { type: 'RANDOM_CHAOS' as GlitchEffectType, intensity: 10, threshold: 50, active: false },
];

export const EFFECT_METADATA: Record<GlitchEffectType, {
  label: string;
  subLabel: string;
  icon: string;
  intensityLabel?: string;
  thresholdLabel?: string;
  showThreshold?: boolean;
}> = {
  PIXEL_SORT: { label: 'Pixel Sort', subLabel: 'VERTICAL SCAN', icon: 'sort', intensityLabel: 'Streak Length', thresholdLabel: 'Trigger Level', showThreshold: true },
  CHANNEL_SHIFT: { label: 'RGB Shift', subLabel: 'CHROMATIC ABERRATION', icon: 'layers', intensityLabel: 'Offset', thresholdLabel: 'Vertical Tear', showThreshold: true },
  DATA_CORRUPTION: { label: 'Data Mosh', subLabel: 'DELTA COMPRESSION', icon: 'grid_4x4', intensityLabel: 'Mosh Length', thresholdLabel: 'Mosh Density', showThreshold: true },
  DEEP_FRY: { label: 'Deep Fry', subLabel: 'SATURATION HELL', icon: 'local_fire_department', intensityLabel: 'Heat', thresholdLabel: 'Posterize', showThreshold: true },
  SCAN_LINES: { label: 'Scan Lines', subLabel: 'CRT SIMULATION', icon: 'reorder', intensityLabel: 'Opacity', thresholdLabel: 'Line Spacing', showThreshold: true },
  BIT_CRUSH: { label: 'Bit Crush', subLabel: '8-BIT DECIMATION', icon: 'developer_board', intensityLabel: 'Quantize', thresholdLabel: 'Resample', showThreshold: true },
  WAVE_DISTORTION: { label: 'Wave Distortion', subLabel: 'SINE WAVE MAP', icon: 'waves', intensityLabel: 'Amplitude', thresholdLabel: 'Frequency', showThreshold: true },
  COLOR_BLEED: { label: 'Color Bleed', subLabel: 'HORIZONTAL SMEAR', icon: 'palette', intensityLabel: 'Bleed', thresholdLabel: 'Ghosting', showThreshold: true },
  COMPRESSION_HELL: { label: 'Compression Hell', subLabel: 'JPEG ARTIFACTS', icon: 'compress', intensityLabel: 'Block Size', thresholdLabel: 'Artifacting', showThreshold: true },
  RANDOM_CHAOS: { label: 'Random Chaos', subLabel: 'SYSTEM COLLAPSE', icon: 'bolt', intensityLabel: 'Entropy', thresholdLabel: 'Jitter', showThreshold: true },
};

export const PRESETS: Record<string, EffectConfig[]> = {
  'RESET': INITIAL_EFFECTS.map(e => ({ ...e, active: false })),
  'CYBERPUNK': INITIAL_EFFECTS.map(e => {
    if (e.type === 'PIXEL_SORT') return { ...e, active: true, intensity: 80, threshold: 30 }; // Long streaks
    if (e.type === 'CHANNEL_SHIFT') return { ...e, active: true, intensity: 50, threshold: 20 }; // Aberration + slight tear
    if (e.type === 'SCAN_LINES') return { ...e, active: true, intensity: 40, threshold: 20 }; // Classic CRT
    return { ...e, active: false };
  }),
  'VAPORWAVE': INITIAL_EFFECTS.map(e => {
    if (e.type === 'SCAN_LINES') return { ...e, active: true, intensity: 30, threshold: 40 }; // Soft lines
    if (e.type === 'WAVE_DISTORTION') return { ...e, active: true, intensity: 25, threshold: 15 }; // Gentle slow waves
    if (e.type === 'CHANNEL_SHIFT') return { ...e, active: true, intensity: 30, threshold: 0 }; // Subtle RGB shift
    if (e.type === 'COLOR_BLEED') return { ...e, active: true, intensity: 60, threshold: 30 }; // Dreamy smear
    return { ...e, active: false };
  }),
  'DEEP_FRIED': INITIAL_EFFECTS.map(e => {
    if (e.type === 'DEEP_FRY') return { ...e, active: true, intensity: 80, threshold: 70 }; // High heat + heavy posterize
    if (e.type === 'DATA_CORRUPTION') return { ...e, active: true, intensity: 30, threshold: 20 }; // Mosh streaks
    if (e.type === 'COMPRESSION_HELL') return { ...e, active: true, intensity: 70, threshold: 80 }; // Heavy JPEG artifacts
    return { ...e, active: false };
  }),
  'GLITCH_ART': INITIAL_EFFECTS.map(e => {
    if (e.type === 'PIXEL_SORT') return { ...e, active: true, intensity: 50, threshold: 60 }; // Chaotic sorting
    if (e.type === 'BIT_CRUSH') return { ...e, active: true, intensity: 60, threshold: 40 }; // Pixelated + quantized
    if (e.type === 'RANDOM_CHAOS') return { ...e, active: true, intensity: 30, threshold: 50 }; // Entropy specks
    if (e.type === 'DATA_CORRUPTION') return { ...e, active: true, intensity: 60, threshold: 40 }; // Heavy mosh
    return { ...e, active: false };
  })
};
