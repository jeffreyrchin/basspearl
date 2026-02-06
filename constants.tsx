
import React from 'react';
import { GlitchEffectType, EffectConfig } from './types';

export const INITIAL_EFFECTS = [
  { type: 'PIXEL_SORT' as GlitchEffectType, intensity: 72, threshold: 85, active: true, seed: 123456 },
  { type: 'CHANNEL_SHIFT' as GlitchEffectType, intensity: 30, threshold: 50, active: false, seed: 234567 },
  { type: 'DATA_CORRUPTION' as GlitchEffectType, intensity: 20, threshold: 80, active: false, seed: 345678 },
  { type: 'DEEP_FRY' as GlitchEffectType, intensity: 50, threshold: 50, active: false, seed: 456789 },
  { type: 'SCAN_LINES' as GlitchEffectType, intensity: 40, threshold: 50, active: false, seed: 567890 },
  { type: 'BIT_CRUSH' as GlitchEffectType, intensity: 25, threshold: 50, active: false, seed: 678901 },
  { type: 'WAVE_DISTORTION' as GlitchEffectType, intensity: 15, threshold: 50, active: false, seed: 789012 },
  { type: 'COLOR_BLEED' as GlitchEffectType, intensity: 35, threshold: 50, active: false, seed: 890123 },
  { type: 'COMPRESSION_HELL' as GlitchEffectType, intensity: 16, threshold: 78, active: false, seed: 901234 },
  { type: 'RANDOM_CHAOS' as GlitchEffectType, intensity: 16, threshold: 0, active: false, seed: 111222 },
  { type: 'ANALOG_NOISE' as GlitchEffectType, intensity: 40, threshold: 50, active: false, seed: 222333 },
  { type: 'HUE_ROTATION' as GlitchEffectType, intensity: 20, threshold: 80, active: false, seed: 333444 },
  { type: 'INVERT_GHOST' as GlitchEffectType, intensity: 80, threshold: 0, active: false, seed: 444555 },
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
  DATA_CORRUPTION: { label: 'Datamosh', subLabel: 'DELTA COMPRESSION', icon: 'grid_4x4', intensityLabel: 'Mosh Length', thresholdLabel: 'Mosh Density', showThreshold: true },
  DEEP_FRY: { label: 'Deep Fry', subLabel: 'SATURATION HELL', icon: 'local_fire_department', intensityLabel: 'Heat', thresholdLabel: 'Posterize', showThreshold: true },
  SCAN_LINES: { label: 'Scan Lines', subLabel: 'CRT SIMULATION', icon: 'reorder', intensityLabel: 'Opacity', thresholdLabel: 'Line Spacing', showThreshold: true },
  BIT_CRUSH: { label: 'Bit Crush', subLabel: '8-BIT DECIMATION', icon: 'developer_board', intensityLabel: 'Quantize', thresholdLabel: 'Resample', showThreshold: true },
  WAVE_DISTORTION: { label: 'Wave Distortion', subLabel: 'SINE WAVE MAP', icon: 'waves', intensityLabel: 'Amplitude', thresholdLabel: 'Frequency', showThreshold: true },
  COLOR_BLEED: { label: 'Color Bleed', subLabel: 'HORIZONTAL SMEAR', icon: 'palette', intensityLabel: 'Bleed', thresholdLabel: 'Ghosting', showThreshold: true },
  COMPRESSION_HELL: { label: 'Compression Hell', subLabel: 'JPEG ARTIFACTS', icon: 'compress', intensityLabel: 'Block Size', thresholdLabel: 'Artifacting', showThreshold: true },
  RANDOM_CHAOS: { label: 'Random Chaos', subLabel: 'SYSTEM COLLAPSE', icon: 'bolt', intensityLabel: 'Entropy', thresholdLabel: 'Jitter', showThreshold: true },
  ANALOG_NOISE: { label: 'Analog Noise', subLabel: 'FILM GRAIN', icon: 'grain', intensityLabel: 'Gain', thresholdLabel: 'Greyscale', showThreshold: true },
  HUE_ROTATION: { label: 'Acid Trip', subLabel: 'COLOR CYCLING', icon: 'change_circle', intensityLabel: 'Spectrum', thresholdLabel: 'Vibrance', showThreshold: true },
  INVERT_GHOST: { label: 'Spectral', subLabel: 'NEGATIVE MIX', icon: 'invert_colors', intensityLabel: 'Inversion', thresholdLabel: '', showThreshold: false },
};

export const PRESETS: Record<string, EffectConfig[]> = {
  'RESET': INITIAL_EFFECTS.map(e => ({ ...e, active: false })),
  'GLITCH_RAIN': INITIAL_EFFECTS.map(e => {
    if (e.type === 'PIXEL_SORT') return { ...e, active: true, intensity: 78, threshold: 86 }; // Vertical code rain
    if (e.type === 'COLOR_BLEED') return { ...e, active: true, intensity: 10, threshold: 5 }; // Slight tint/shift
    if (e.type === 'SCAN_LINES') return { ...e, active: true, intensity: 27, threshold: 0 }; // CRT feel
    if (e.type === 'BIT_CRUSH') return { ...e, active: true, intensity: 0, threshold: 3 }; // Digital artifacts
    return { ...e, active: false };
  }),
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
    if (e.type === 'DEEP_FRY') return { ...e, active: true, intensity: 60, threshold: 40 }; // Lower saturation/contrast
    if (e.type === 'ANALOG_NOISE') return { ...e, active: true, intensity: 50, threshold: 0 }; // Moderate color noise
    if (e.type === 'WAVE_DISTORTION') return { ...e, active: true, intensity: 20, threshold: 0 }; // Slight warp instead of blocks
    return { ...e, active: false };
  }),
  'SYSTEM_FAILURE': INITIAL_EFFECTS.map(e => {
    if (e.type === 'DATA_CORRUPTION') return { ...e, active: true, intensity: 70, threshold: 30 }; // Broken blocks
    if (e.type === 'PIXEL_SORT') return { ...e, active: true, intensity: 40, threshold: 70 }; // Glitchy streaks
    if (e.type === 'RANDOM_CHAOS') return { ...e, active: true, intensity: 40, threshold: 60 }; // Noise
    if (e.type === 'CHANNEL_SHIFT') return { ...e, active: true, intensity: 30, threshold: 30 }; // Misalignment
    return { ...e, active: false };
  }),
  'VHS_RETRO': INITIAL_EFFECTS.map(e => {
    if (e.type === 'SCAN_LINES') return { ...e, active: true, intensity: 40, threshold: 30 }; // Lines
    if (e.type === 'ANALOG_NOISE') return { ...e, active: true, intensity: 30, threshold: 80 }; // Mono Static
    if (e.type === 'WAVE_DISTORTION') return { ...e, active: true, intensity: 30, threshold: 5 }; // Tracking
    if (e.type === 'CHANNEL_SHIFT') return { ...e, active: true, intensity: 40, threshold: 0 }; // Aberration
    if (e.type === 'COLOR_BLEED') return { ...e, active: true, intensity: 50, threshold: 60 }; // Smear
    return { ...e, active: false };
  }),
  'ACID_TRIP': INITIAL_EFFECTS.map(e => {
    if (e.type === 'HUE_ROTATION') return { ...e, active: true, intensity: 50, threshold: 50 }; // Color Cycle
    if (e.type === 'WAVE_DISTORTION') return { ...e, active: true, intensity: 70, threshold: 20 }; // Melting
    if (e.type === 'COLOR_BLEED') return { ...e, active: true, intensity: 60, threshold: 40 }; // Trails
    return { ...e, active: false };
  }),
  'GHOST_MACHINE': INITIAL_EFFECTS.map(e => {
    if (e.type === 'INVERT_GHOST') return { ...e, active: true, intensity: 60, threshold: 50 }; // Negative
    if (e.type === 'PIXEL_SORT') return { ...e, active: true, intensity: 40, threshold: 20 }; // Ethereal lines
    if (e.type === 'COLOR_BLEED') return { ...e, active: true, intensity: 50, threshold: 80 }; // Glow
    return { ...e, active: false };
  })
};

export const FEEDBACK_FORM_URL = 'https://forms.gle/CBVXwJv9s3ZvXyWr8';
