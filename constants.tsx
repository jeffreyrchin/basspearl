
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

export const EFFECT_METADATA: Record<GlitchEffectType, { label: string; subLabel: string; icon: string }> = {
  PIXEL_SORT: { label: 'Pixel Sort', subLabel: 'VERTICAL SCAN', icon: 'sort' },
  CHANNEL_SHIFT: { label: 'RGB Shift', subLabel: 'CHROMATIC ABERRATION', icon: 'layers' },
  DATA_CORRUPTION: { label: 'Data Mosh', subLabel: 'DELTA COMPRESSION', icon: 'grid_4x4' },
  DEEP_FRY: { label: 'Deep Fry', subLabel: 'SATURATION HELL', icon: 'local_fire_department' },
  SCAN_LINES: { label: 'Scan Lines', subLabel: 'CRT SIMULATION', icon: 'reorder' },
  BIT_CRUSH: { label: 'Bit Crush', subLabel: '8-BIT DECIMATION', icon: 'developer_board' },
  WAVE_DISTORTION: { label: 'Wave Distortion', subLabel: 'SINE WAVE MAP', icon: 'waves' },
  COLOR_BLEED: { label: 'Color Bleed', subLabel: 'HORIZONTAL SMEAR', icon: 'palette' },
  COMPRESSION_HELL: { label: 'Compression Hell', subLabel: 'JPEG ARTIFACTS', icon: 'compress' },
  RANDOM_CHAOS: { label: 'Random Chaos', subLabel: 'SYSTEM COLLAPSE', icon: 'bolt' },
};

export const PRESETS: Record<string, EffectConfig[]> = {
  'RESET': INITIAL_EFFECTS.map(e => ({ ...e, active: false })),
  'CYBERPUNK': INITIAL_EFFECTS.map(e => {
    if (e.type === 'PIXEL_SORT') return { ...e, active: true, intensity: 80, threshold: 25 };
    if (e.type === 'CHANNEL_SHIFT') return { ...e, active: true, intensity: 60 };
    if (e.type === 'SCAN_LINES') return { ...e, active: true, intensity: 30 };
    return { ...e, active: false };
  }),
  'VAPORWAVE': INITIAL_EFFECTS.map(e => {
    if (e.type === 'SCAN_LINES') return { ...e, active: true, intensity: 60 };
    if (e.type === 'WAVE_DISTORTION') return { ...e, active: true, intensity: 40 };
    if (e.type === 'CHANNEL_SHIFT') return { ...e, active: true, intensity: 40 };
    return { ...e, active: false };
  }),
  'DEEP_FRIED': INITIAL_EFFECTS.map(e => {
    if (e.type === 'DEEP_FRY') return { ...e, active: true, intensity: 70 };
    if (e.type === 'DATA_CORRUPTION') return { ...e, active: true, intensity: 40 };
    if (e.type === 'COMPRESSION_HELL') return { ...e, active: true, intensity: 80 };
    return { ...e, active: false };
  }),
  'GLITCH_ART': INITIAL_EFFECTS.map(e => {
    if (e.type === 'PIXEL_SORT') return { ...e, active: true, intensity: 40, threshold: 60 };
    if (e.type === 'DATA_CORRUPTION') return { ...e, active: true, intensity: 30 };
    if (e.type === 'BIT_CRUSH') return { ...e, active: true, intensity: 50 };
    return { ...e, active: false };
  })
};
