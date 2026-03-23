import { MacroMetadata, MacroType, FrequencyBand } from '../types';

// Helper to slim down macro override definitions
export const o = (
  param: string,
  d: { v?: number; m?: number; b?: FrequencyBand }, // Target values
  p?: { v?: number; m?: number; b?: FrequencyBand }, // Preview Overrides
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
        ],
        melded: true
      },
      {
        type: 'LUMINANCE_MASK',
        params: [
          o('Threshold', { v: 60, b: 'OFF' }),
          o('Feather', { v: 10, b: 'OFF' }),
          o('Invert', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'TUNNEL_WARP',
        params: [
          o('Scale', { v: 20, b: 'OFF' }),
          o('Speed', { v: 100, b: 'SUB' }),
          o('Twist', { v: 10, b: 'OFF' }),
        ],
        melded: false
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
        ],
        melded: true
      },
      {
        type: 'SPECTRAL_MAP',
        params: [
          o('Resolution', { v: 0, b: 'OFF' }),
          o('Phase Offset', { v: 0, b: 'OFF' }),
          o('Speed', { v: 100, b: 'SUB' }),
          o('Strength', { v: 100, b: 'OFF' }),
        ],
        melded: false
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
        ],
        melded: true
      },
      {
        type: 'WAVE_DISTORTION',
        params: [
          o('Amplitude', { v: 33, b: 'SUB' }),
          o('Frequency', { v: 0, b: 'OFF' }),
          o('Speed', { v: 38, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'ROTATE',
        params: [
          o('Rotation', { v: 25, b: 'OFF' }),
          o('Speed', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'WAVE_DISTORTION',
        params: [
          o('Amplitude', { v: 33, b: 'SUB' }),
          o('Frequency', { v: 0, b: 'OFF' }),
          o('Speed', { v: 38, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'EDGE_MASK',
        params: [
          o('Sensitivity', { v: 13, b: 'OFF' }),
          o('Thickness', { v: 50, b: 'OFF' }),
          o('Invert', { v: 0, b: 'OFF' }),
        ],
        melded: false
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
        ],
        melded: true
      },
      {
        type: 'TERRAIN',
        params: [
          o('Scale', { v: 3, b: 'OFF' }),
          o('Extrusion', { v: 75, m: 43, b: 'SUB' }, { v: 67, m: 0, b: 'OFF' }),
          o('Speed', { v: 5, b: 'OFF' }),
          o('Resolution', { v: 99, b: 'OFF' }),
          o('Rotate X', { v: 0, b: 'OFF' }),
          o('Rotate Y', { v: 0, b: 'OFF' }),
          o('Rotate Z', { v: 0, b: 'OFF' }),
          o('Elevation', { v: 47, b: 'OFF' }),
          o('Distance', { v: 50, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'EDGE_MASK',
        params: [
          o('Sensitivity', { v: 0, b: 'OFF' }),
          o('Thickness', { v: 5, b: 'OFF' }, { v: 15 }),
          o('Invert', { v: 0, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  LANDSCAPE: {
    id: 'LANDSCAPE',
    label: 'Landscape',
    effects: [
      {
        type: 'GRAIN',
        params: [
          o('Width', { v: 69, b: 'OFF' }),
          o('Height', { v: 64, b: 'OFF' }),
          o('X-Freq', { v: 50, b: 'OFF' }),
          o('Y-Freq', { v: 46, b: 'OFF' }),
          o('Density', { v: 100, b: 'OFF' }),
          o('Roundness', { v: 0, b: 'OFF' }),
          o('Blend', { v: 100, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'TERRAIN',
        params: [
          o('Scale', { v: 5, b: 'OFF' }),
          o('Extrusion', { v: 100, m: 58, b: 'SUB' }),
          o('Speed', { v: 5, b: 'OFF' }),
          o('Resolution', { v: 7, b: 'OFF' }),
          o('Rotate X', { v: 89, b: 'OFF' }),
          o('Rotate Y', { v: 0, b: 'OFF' }),
          o('Rotate Z', { v: 0, b: 'OFF' }),
          o('Elevation', { v: 32, b: 'OFF' }),
          o('Distance', { v: 32, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'GRID',
        params: [
          o('Horizontal', { v: 56, b: 'OFF' }),
          o('Vertical', { v: 56, b: 'OFF' }),
          o('Thickness', { v: 0, b: 'OFF' }),
          o('Feather', { v: 8, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'TERRAIN',
        params: [
          o('Scale', { v: 3, b: 'OFF' }),
          o('Extrusion', { v: 0, b: 'OFF' }),
          o('Speed', { v: 4, b: 'OFF' }),
          o('Resolution', { v: 100, b: 'OFF' }),
          o('Rotate X', { v: 89, b: 'OFF' }),
          o('Rotate Y', { v: 0, b: 'OFF' }),
          o('Rotate Z', { v: 0, b: 'OFF' }),
          o('Elevation', { v: 36, b: 'OFF' }),
          o('Distance', { v: 37, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  WATER: {
    id: 'WATER',
    label: 'Water',
    effects: [
      {
        type: 'ORGANIC_NOISE',
        params: [
          o('Scale', { v: 5, b: 'OFF' }),
          o('Complexity', { v: 0, b: 'OFF' }),
          o('Warp', { v: 6, b: 'OFF' }),
          o('Speed', { v: 45, b: 'SUB' }, { v: 20, b: 'OFF' }),
          o('Blend', { v: 100, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'TERRAIN',
        params: [
          o('Scale', { v: 6, b: 'OFF' }),
          o('Extrusion', { v: 75, b: 'OFF' }),
          o('Speed', { v: 0, b: 'OFF' }),
          o('Resolution', { v: 100, b: 'OFF' }),
          o('Rotate X', { v: 0, b: 'OFF' }),
          o('Rotate Y', { v: 0, b: 'OFF' }),
          o('Rotate Z', { v: 0, b: 'OFF' }),
          o('Elevation', { v: 46, b: 'OFF' }),
          o('Distance', { v: 60, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'SPECTRAL_MAP',
        params: [
          o('Resolution', { v: 16, b: 'OFF' }),
          o('Phase Offset', { v: 0, b: 'OFF' }),
          o('Speed', { v: 0, b: 'OFF' }),
          o('Strength', { v: 72, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  ICE: {
    id: 'ICE',
    label: 'Ice',
    effects: [
      {
        type: 'ORGANIC_NOISE',
        params: [
          o('Scale', { v: 6, b: 'OFF' }),
          o('Complexity', { v: 0, b: 'OFF' }),
          o('Warp', { v: 10, b: 'OFF' }),
          o('Speed', { v: 18, b: 'SUB' }),
          o('Blend', { v: 100, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'DEEP_FRY',
        params: [
          o('Heat', { v: 30, b: 'OFF' }),
          o('Posterize', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'TERRAIN',
        params: [
          o('Scale', { v: 6, b: 'OFF' }),
          o('Extrusion', { v: 100, b: 'OFF' }),
          o('Speed', { v: 0, b: 'OFF' }),
          o('Resolution', { v: 100, b: 'OFF' }),
          o('Rotate X', { v: 0, b: 'OFF' }),
          o('Rotate Y', { v: 0, b: 'OFF' }),
          o('Rotate Z', { v: 0, b: 'OFF' }),
          o('Elevation', { v: 39, b: 'OFF' }),
          o('Distance', { v: 41, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  GRID_PLANE: {
    id: 'GRID_PLANE',
    label: 'Grid Plane',
    effects: [
      {
        type: 'GRID',
        params: [
          o('Horizontal', { v: 30, b: 'OFF' }),
          o('Vertical', { v: 30, b: 'OFF' }),
          o('Thickness', { v: 1, b: 'OFF' }),
          o('Feather', { v: 30, b: 'OFF' }),
          o('Scale X', { v: 50, b: 'OFF' }),
          o('Scale Y', { v: 50, b: 'OFF' }),
          o('Pan X', { v: 50, b: 'OFF' }),
          o('Pan Y', { v: 50, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'TERRAIN',
        params: [
          o('Scale', { v: 5, b: 'OFF' }),
          o('Extrusion', { v: 0, b: 'OFF' }),
          o('Speed', { v: 10, b: 'OFF' }),
          o('Resolution', { v: 100, b: 'OFF' }),
          o('Rotate X', { v: 0, b: 'OFF' }),
          o('Rotate Y', { v: 0, b: 'OFF' }),
          o('Rotate Z', { v: 0, b: 'OFF' }),
          o('Elevation', { v: 50, b: 'OFF' }),
          o('Distance', { v: 50, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  }
};
