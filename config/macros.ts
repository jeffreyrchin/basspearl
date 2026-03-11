import { MacroMetadata, MacroType, FrequencyBand } from '../types';

// Helper to slim down macro override definitions
export const o = (
  param: string,
  d: { v?: number; m?: number; b?: FrequencyBand }, // Target values
  p?: { v?: number; m?: number; b?: FrequencyBand } // Preview Overrides
) => {
  const obj: any = { param };
  if (d.v !== undefined) obj.value = d.v;
  if (d.m !== undefined) obj.min = d.m;
  if (d.b !== undefined) obj.frequencyBand = d.b;
  if (p?.v !== undefined) obj.previewValue = p.v;
  if (p?.m !== undefined) obj.previewMin = p.m;
  if (p?.b !== undefined) obj.previewBand = p.b;
  return obj;
};

export const MACRO_METADATA: Record<MacroType, MacroMetadata> = {
  FOG_VORTEX: {
    id: 'FOG_VORTEX',
    label: 'Fog Vortex',
    effects: [
      {
        type: 'ORGANIC_NOISE',
        params: [
          o('Scale', { v: 4, b: 'OFF' }),
          o('Complexity', { v: 97, b: 'OFF' }),
          o('Warp', { v: 3, b: 'OFF' }),
          o('Speed', { v: 100, b: 'SUB' }),
          o('Blend', { v: 100, b: 'OFF' }),
        ]
      },
      {
        type: 'LUMINANCE_MASK',
        params: [
          o('Threshold', { v: 60, b: 'OFF' }),
          o('Feather', { v: 10, b: 'OFF' }),
          o('Invert', { v: 0, b: 'OFF' }),
        ]
      },
      {
        type: 'TUNNEL_WARP',
        params: [
          o('Scale', { v: 20, b: 'OFF' }),
          o('Speed', { v: 100, b: 'SUB' }),
          o('Twist', { v: 10, b: 'OFF' }),
        ]
      }
    ]
  },
  RAINBOW_DOT: {
    id: 'RAINBOW_DOT',
    label: 'Rainbow Dot',
    effects: [
      {
        type: 'SHAPE',
        params: [
          o('Side Count', { v: 100, b: 'OFF' }),
          o('Pointiness', { v: 0, b: 'OFF' }),
          o('Roundness', { v: 0, b: 'OFF' }),
          o('Size', { v: 40, b: 'SUB' }),
          o('Feather', { v: 15, b: 'OFF' }),
          o('Blend', { v: 100, b: 'OFF' }),
        ]
      },
      {
        type: 'SPECTRAL_MAP',
        params: [
          o('Resolution', { v: 0, b: 'OFF' }),
          o('Phase Offset', { v: 0, b: 'OFF' }),
          o('Speed', { v: 100, b: 'SUB' }),
          o('Strength', { v: 100, b: 'OFF' }),
        ]
      }
    ]
  },
  RUBBER_BAND: {
    id: 'RUBBER_BAND',
    label: 'Rubber Band',
    effects: [
      {
        type: 'SHAPE',
        params: [
          o('Side Count', { v: 100, b: 'OFF' }),
          o('Pointiness', { v: 0, b: 'OFF' }),
          o('Roundness', { v: 0, b: 'OFF' }),
          o('Size', { v: 80, m: 20, b: 'SUB' }),
          o('Feather', { v: 0, b: 'OFF' }),
          o('Blend', { v: 100, b: 'OFF' }),
        ]
      },
      {
        type: 'WAVE_DISTORTION',
        params: [
          o('Amplitude', { v: 33, b: 'SUB' }),
          o('Frequency', { v: 0, b: 'OFF' }),
          o('Speed', { v: 38, b: 'OFF' }),
        ]
      },
      {
        type: 'ROTATE',
        params: [
          o('Rotation', { v: 25, b: 'OFF' }),
          o('Speed', { v: 0, b: 'OFF' }),
        ]
      },
      {
        type: 'WAVE_DISTORTION',
        params: [
          o('Amplitude', { v: 33, b: 'SUB' }),
          o('Frequency', { v: 0, b: 'OFF' }),
          o('Speed', { v: 38, b: 'OFF' }),
        ]
      },
      {
        type: 'EDGE_MASK',
        params: [
          o('Sensitivity', { v: 13, b: 'OFF' }),
          o('Thickness', { v: 50, b: 'OFF' }),
          o('Invert', { v: 0, b: 'OFF' }),
        ]
      }
    ]
  },
  METRO: {
    id: 'METRO',
    label: 'Metro',
    effects: [
      {
        type: 'GRAIN',
        params: [
          o('Width', { v: 69, b: 'OFF' }),
          o('Height', { v: 66, b: 'OFF' }),
          o('X-Freq', { v: 50, b: 'OFF' }),
          o('Y-Freq', { v: 46, b: 'OFF' }),
          o('Density', { v: 100, b: 'OFF' }),
          o('Roundness', { v: 0, b: 'OFF' }),
          o('Blend', { v: 100, b: 'OFF' }),
        ]
      },
      {
        type: 'TERRAIN',
        params: [
          o('Scale', { v: 3, b: 'OFF' }),
          o('Extrusion', { v: 83, m: 43, b: 'BASS' }, { v: 67, m: 0, b: 'OFF' }),
          o('Speed', { v: 50, b: 'OFF' }),
          o('Resolution', { v: 99, b: 'OFF' }),
          o('Rotate X', { v: 0, b: 'OFF' }),
          o('Rotate Y', { v: 0, b: 'OFF' }),
          o('Rotate Z', { v: 0, b: 'OFF' }),
          o('Elevation', { v: 36, b: 'OFF' }),
        ]
      },
      {
        type: 'EDGE_MASK',
        params: [
          o('Sensitivity', { v: 0, b: 'OFF' }),
          o('Thickness', { v: 2, b: 'OFF' }),
          o('Invert', { v: 0, b: 'OFF' }),
        ]
      }
    ]
  }
};
