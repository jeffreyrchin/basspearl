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
          o('Speed', { v: 100, b: 'SUB' }, { v: 50, b: 'OFF' }),
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
          o('Speed', { v: 100, b: 'SUB' }, { v: 50, b: 'OFF' }),
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
          o('Feather', { v: 100, m: 20, b: 'TREBLE' }, { v: 50, m: 0, b: 'SUB' }),
          o('Blend', { v: 100, b: 'OFF' }),
          o('Scale X', { v: 25, b: 'OFF' }),
          o('Scale Y', { v: 25, b: 'OFF' }),
          o('Pan X', { v: 50, b: 'OFF' }),
          o('Pan Y', { v: 50, b: 'OFF' }),
          o('Rotation', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'SPECTRAL_MAP',
        params: [
          o('Resolution', { v: 0, b: 'OFF' }),
          o('Phase Offset', { v: 25, b: 'OFF' }),
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
          o('Amplitude', { v: 75, m: 0, b: 'SUB' }, { v: 50, m: 0, b: 'SUB' }),
          o('Frequency', { v: 0, b: 'OFF' }),
          o('Speed', { v: 75, m: 0, b: 'SUB' }, { v: 50, m: 0, b: 'SUB' }),
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
          o('Thickness', { v: 5, b: 'OFF' }, { v: 10 }),
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
          o('Scale X', { v: 50, b: 'OFF' }),
          o('Scale Y', { v: 50, b: 'OFF' }),
          o('Pan X', { v: 50, b: 'OFF' }),
          o('Pan Y', { v: 50, b: 'OFF' }),
          o('Rotation', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'TERRAIN',
        params: [
          o('Scale', { v: 5, b: 'OFF' }),
          o('Extrusion', { v: 75, m: 25, b: 'SUB' }, { v: 34, b: 'OFF' }),
          o('Speed', { v: 17, b: 'OFF' }),
          o('Resolution', { v: 9, b: 'OFF' }),
          o('Rotate X', { v: 0, b: 'OFF' }),
          o('Rotate Y', { v: 0, b: 'OFF' }),
          o('Rotate Z', { v: 0, b: 'OFF' }),
          o('Elevation', { v: 50, b: 'OFF' }),
          o('Distance', { v: 50, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'RGBA',
        params: [
          o('Red', { v: 0, b: 'OFF' }),
          o('Green', { v: 100, b: 'OFF' }),
          o('Blue', { v: 0, b: 'OFF' }),
          o('Opacity', { v: 100, b: 'OFF' }),
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
          o('Thickness', { v: 20, b: 'OFF' }),
          o('Feather', { v: 25, b: 'OFF' }),
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
          o('Scale', { v: 3, b: 'OFF' }),
          o('Extrusion', { v: 0, b: 'OFF' }),
          o('Speed', { v: 50, m: 0, b: 'TREBLE' }, { v: 5, b: 'OFF' }),
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
  },
  LIQUID: {
    id: 'LIQUID',
    label: 'Liquid',
    effects: [
      {
        type: 'ORGANIC_NOISE',
        params: [
          o('Scale', { v: 15, b: 'OFF' }),
          o('Complexity', { v: 2, b: 'OFF' }),
          o('Warp', { v: 3, b: 'OFF' }),
          o('Speed', { v: 75, m: 0, b: 'SUB' }, { v: 25, b: 'OFF' }),
          o('Blend', { v: 100, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'TERRAIN',
        params: [
          o('Scale', { v: 3, b: 'OFF' }),
          o('Extrusion', { v: 80, b: 'OFF' }),
          o('Speed', { v: 0, b: 'OFF' }),
          o('Resolution', { v: 100, b: 'OFF' }),
          o('Rotate X', { v: 0, b: 'OFF' }),
          o('Rotate Y', { v: 0, b: 'OFF' }),
          o('Rotate Z', { v: 0, b: 'OFF' }),
          o('Elevation', { v: 46, b: 'OFF' }),
          o('Distance', { v: 50, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'HUE_ROTATION',
        params: [
          o('Phase Offset', { v: 0, b: 'OFF' }),
          o('Speed', { v: 25, b: 'OFF' }),
          o('Vibrance', { v: 50, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  PLANE_MESH: {
    id: 'PLANE_MESH',
    label: 'Plane Mesh',
    effects: [
      {
        type: 'ORGANIC_NOISE',
        params: [
          o('Scale', { v: 3, b: 'OFF' }),
          o('Complexity', { v: 43, b: 'OFF' }),
          o('Warp', { v: 5, b: 'OFF' }),
          o('Speed', { v: 60, m: 0, b: 'TREBLE' }, { v: 10, b: 'OFF' }),
          o('Blend', { v: 100, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'DEEP_FRY',
        params: [
          o('Heat', { v: 19, b: 'OFF' }),
          o('Posterize', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'TERRAIN',
        params: [
          o('Scale', { v: 2, b: 'OFF' }),
          o('Extrusion', { v: 50, b: 'OFF' }),
          o('Speed', { v: 0, b: 'OFF' }),
          o('Resolution', { v: 27, b: 'OFF' }),
          o('Rotate X', { v: 0, b: 'OFF' }),
          o('Rotate Y', { v: 0, b: 'OFF' }),
          o('Rotate Z', { v: 0, b: 'OFF' }),
          o('Elevation', { v: 46, b: 'OFF' }),
          o('Distance', { v: 50, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'EDGE_MASK',
        params: [
          o('Sensitivity', { v: 0, b: 'OFF' }),
          o('Thickness', { v: 3, b: 'OFF' }),
          o('Invert', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'HUE_ROTATION',
        params: [
          o('Phase Offset', { v: 0, b: 'OFF' }),
          o('Speed', { v: 25, b: 'OFF' }),
          o('Vibrance', { v: 100, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  RODS: {
    id: 'RODS',
    label: 'Rods',
    effects: [
      {
        type: 'GRAIN',
        params: [
          o('Width', { v: 50, b: 'OFF' }),
          o('Height', { v: 100, b: 'OFF' }),
          o('X-Freq', { v: 65, b: 'OFF' }),
          o('Y-Freq', { v: 65, b: 'OFF' }),
          o('Density', { v: 75, b: 'OFF' }),
          o('Roundness', { v: 0, b: 'OFF' }),
          o('Blend', { v: 100, b: 'OFF' }),
          o('Scale X', { v: 50, b: 'OFF' }),
          o('Scale Y', { v: 50, b: 'OFF' }),
          o('Pan X', { v: 50, b: 'OFF' }),
          o('Pan Y', { v: 50, b: 'OFF' }),
          o('Rotation', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'TUNNEL_WARP',
        params: [
          o('Scale', { v: 2, b: 'OFF' }),
          o('Speed', { v: 30, b: 'SUB' }, { v: 10, b: 'SUB' }),
          o('Twist', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'SPECTRAL_MAP',
        params: [
          o('Resolution', { v: 25, b: 'OFF' }),
          o('Phase Offset', { v: 0, b: 'OFF' }),
          o('Speed', { v: 75, b: 'OFF' }),
          o('Strength', { v: 100, b: 'OFF' }),
          o('Scale X', { v: 50, b: 'OFF' }),
          o('Scale Y', { v: 50, b: 'OFF' }),
          o('Pan X', { v: 50, b: 'OFF' }),
          o('Pan Y', { v: 50, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  RINGS: {
    id: 'RINGS',
    label: 'Rings',
    effects: [
      {
        type: 'GRID',
        params: [
          o('Horizontal', { v: 0, b: 'OFF' }),
          o('Vertical', { v: 17, b: 'OFF' }),
          o('Thickness', { v: 100, m: 0, b: 'SUB' }, { v: 30, b: 'OFF' }),
          o('Feather', { v: 25, b: 'OFF' }),
          o('Scale X', { v: 50, b: 'OFF' }),
          o('Scale Y', { v: 50, b: 'OFF' }),
          o('Pan X', { v: 50, b: 'OFF' }),
          o('Pan Y', { v: 50, b: 'OFF' }),
          o('Rotation', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'TUNNEL_WARP',
        params: [
          o('Scale', { v: 5, b: 'OFF' }),
          o('Speed', { v: 20, b: 'OFF' }),
          o('Twist', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'HUE_ROTATION',
        params: [
          o('Phase Offset', { v: 50, b: 'OFF' }),
          o('Speed', { v: 25, b: 'OFF' }),
          o('Vibrance', { v: 100, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  PLUME: {
    id: 'PLUME',
    label: 'Plume',
    effects: [
      {
        type: 'GRID',
        params: [
          o('Horizontal', { v: 25, b: 'OFF' }, { v: 20 }),
          o('Vertical', { v: 0, b: 'OFF' }),
          o('Thickness', { v: 100, b: 'OFF' }, { v: 75 }),
          o('Feather', { v: 0, b: 'OFF' }),
          o('Scale X', { v: 50, b: 'OFF' }),
          o('Scale Y', { v: 50, b: 'OFF' }),
          o('Pan X', { v: 50, b: 'OFF' }),
          o('Pan Y', { v: 50, b: 'OFF' }),
          o('Rotation', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'WAVE_DISTORTION',
        params: [
          o('Amplitude', { v: 19, b: 'OFF' }),
          o('Frequency', { v: 5, b: 'OFF' }),
          o('Speed', { v: 0, b: 'OFF' })
        ],
        melded: true
      },
      {
        type: 'TUNNEL_WARP',
        params: [
          o('Scale', { v: 5, b: 'OFF' }),
          o('Speed', { v: 100, m: 0, b: 'SUB' }, { v: 52, b: 'OFF' }),
          o('Twist', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'RGBA',
        params: [
          o('Red', { v: 100, b: 'OFF' }),
          o('Green', { v: 0, b: 'OFF' }),
          o('Blue', { v: 100, b: 'OFF' }),
          o('Opacity', { v: 100, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  CELL_MESH: {
    id: 'CELL_MESH',
    label: 'Cell Mesh',
    effects: [
      {
        type: 'CELLULAR_NOISE',
        params: [
          o('Cell Width', { v: 100 }),
          o('Cell Height', { v: 100 }),
          o('X-Freq', { v: 25 }),
          o('Y-Freq', { v: 25 }),
          o('Density', { v: 100 }),
          o('Jitter', { v: 100 }),
          o('Speed', { v: 30, b: 'OFF' }),
          o('Blend', { v: 100 }),
        ],
        melded: true
      },
      {
        type: 'ORGANIC_NOISE',
        params: [
          o('Scale', { v: 10, b: 'OFF' }),
          o('Complexity', { v: 0, b: 'OFF' }),
          o('Warp', { v: 3, b: 'OFF' }),
          o('Speed', { v: 25, b: 'OFF' }),
          o('Blend', { v: 80, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'TERRAIN_SPHERE',
        params: [
          o('Extrusion', { v: 100, m: 40, b: 'SUB' }, { v: 80, m: 0, b: 'OFF' }),
          o('Resolution', { v: 50, b: 'OFF' }),
          o('Distance', { v: 100, m: 40, b: 'TREBLE' }, { v: 0, m: 0, b: 'OFF' }),
          o('Offset X', { v: 0, b: 'OFF' }),
          o('Offset Y', { v: 0, b: 'OFF' }),
          o('Offset Z', { v: 0, b: 'OFF' }),
          o('Spin Speed X', { v: 0, b: 'OFF' }),
          o('Spin Speed Y', { v: 0, b: 'OFF' }),
          o('Spin Speed Z', { v: 10, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'EDGE_MASK',
        params: [
          o('Sensitivity', { v: 0, b: 'OFF' }),
          o('Thickness', { v: 10, b: 'OFF' }),
          o('Invert', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'SPECTRAL_MAP',
        params: [
          o('Resolution', { v: 50, b: 'OFF' }),
          o('Phase Offset', { v: 0, b: 'OFF' }),
          o('Speed', { v: 20, b: 'OFF' }),
          o('Strength', { v: 50, b: 'OFF' }),
          o('Scale X', { v: 50, b: 'OFF' }),
          o('Scale Y', { v: 50, b: 'OFF' }),
          o('Pan X', { v: 50, b: 'OFF' }),
          o('Pan Y', { v: 50, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  SPIKY_BALL: {
    id: 'SPIKY_BALL',
    label: 'Spiky Ball',
    effects: [
      {
        type: 'CELLULAR_NOISE',
        params: [
          o('Cell Width', { v: 100 }),
          o('Cell Height', { v: 100 }),
          o('X-Freq', { v: 70 }),
          o('Y-Freq', { v: 70 }),
          o('Density', { v: 100 }),
          o('Jitter', { v: 0 }),
          o('Speed', { v: 30, b: 'OFF' }),
          o('Blend', { v: 100 }),
        ],
        melded: true
      },
      {
        type: 'ORGANIC_NOISE',
        params: [
          o('Scale', { v: 4, b: 'OFF' }),
          o('Complexity', { v: 0, b: 'OFF' }),
          o('Warp', { v: 13, b: 'OFF' }),
          o('Speed', { v: 35, b: 'SUB' }, { v: 8, b: 'OFF' }),
          o('Blend', { v: 62, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'LUMINANCE_MASK',
        params: [
          o('Threshold', { v: 34, b: 'OFF' }),
          o('Feather', { v: 64, b: 'OFF' }),
          o('Invert', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'TERRAIN_SPHERE',
        params: [
          o('Extrusion', { v: 90, m: 45, b: 'SUB' }, { v: 47, b: 'OFF' }),
          o('Resolution', { v: 100, b: 'OFF' }),
          o('Distance', { v: 40, b: 'OFF' }),
          o('Offset X', { v: 0, b: 'OFF' }),
          o('Offset Y', { v: 0, b: 'OFF' }),
          o('Offset Z', { v: 0, b: 'OFF' }),
          o('Spin Speed X', { v: 0, b: 'OFF' }),
          o('Spin Speed Y', { v: 0, b: 'OFF' }),
          o('Spin Speed Z', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'SPECTRAL_MAP',
        params: [
          o('Resolution', { v: 10, b: 'OFF' }),
          o('Phase Offset', { v: 0, b: 'OFF' }),
          o('Speed', { v: 20, b: 'OFF' }),
          o('Strength', { v: 50, b: 'OFF' }),
          o('Scale X', { v: 50, b: 'OFF' }),
          o('Scale Y', { v: 50, b: 'OFF' }),
          o('Pan X', { v: 50, b: 'OFF' }),
          o('Pan Y', { v: 50, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  CRYOGENIC_FLUID: {
    id: 'CRYOGENIC_FLUID',
    label: 'Cryogenic Fluid',
    effects: [
      {
        type: 'SHAPE',
        params: [
          o('Side Count', { v: 100 }),
          o('Pointiness', { v: 0 }),
          o('Roundness', { v: 0 }),
          o('Feather', { v: 35 }),
          o('Blend', { v: 100 }),
          o('Scale X', { v: 18, b: 'OFF' }),
          o('Scale Y', { v: 36, b: 'OFF' }),
          o('Pan X', { v: 50, b: 'OFF' }),
          o('Pan Y', { v: 50, b: 'OFF' }),
          o('Rotation', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'ORGANIC_NOISE',
        params: [
          o('Scale', { v: 20, b: 'OFF' }),
          o('Complexity', { v: 0, b: 'OFF' }),
          o('Warp', { v: 4, b: 'OFF' }),
          o('Speed', { v: 17, b: 'OFF' }),
          o('Blend', { v: 60, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'TERRAIN',
        params: [
          o('Scale', { v: 3, b: 'OFF' }),
          o('Extrusion', { v: 100, m: 30, b: 'SUB' }, { v: 50, m: 0, b: 'OFF' }),
          o('Speed', { v: 0, b: 'OFF' }),
          o('Resolution', { v: 100, b: 'OFF' }),
          o('Rotate X', { v: 0, b: 'OFF' }),
          o('Rotate Y', { v: 0, b: 'OFF' }),
          o('Rotate Z', { v: 0, b: 'OFF' }),
          o('Elevation', { v: 47, b: 'OFF' }),
          o('Distance', { v: 37, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  WATERCOLOR: {
    id: 'WATERCOLOR',
    label: 'Watercolor',
    effects: [
      {
        type: 'ORGANIC_NOISE',
        params: [
          o('Scale', { v: 1, b: 'OFF' }),
          o('Complexity', { v: 100, b: 'OFF' }),
          o('Warp', { v: 5, b: 'OFF' }),
          o('Speed', { v: 50, b: 'SUB' }, { v: 25, b: 'OFF' }),
          o('Blend', { v: 100, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'DEEP_FRY',
        params: [
          o('Heat', { v: 50, b: 'OFF' }),
          o('Posterize', { v: 0, b: 'OFF' })
        ],
        melded: false
      }
    ]
  },
  DISCO_BALL: {
    id: 'DISCO_BALL',
    label: 'Disco Ball',
    effects: [
      {
        type: 'GRAIN',
        params: [
          o('Width', { v: 69 }),
          o('Height', { v: 64 }),
          o('X-Freq', { v: 50 }),
          o('Y-Freq', { v: 46 }),
          o('Density', { v: 100, b: 'OFF' }),
          o('Roundness', { v: 0 }),
          o('Blend', { v: 100 }),
          o('Scale X', { v: 57 }),
          o('Scale Y', { v: 67 }),
          o('Pan X', { v: 50 }),
          o('Pan Y', { v: 50 }),
          o('Rotation', { v: 0 }),
        ],
        melded: true
      },
      {
        type: 'TERRAIN_SPHERE',
        params: [
          o('Extrusion', { v: 0, b: 'OFF' }),
          o('Resolution', { v: 100, b: 'OFF' }),
          o('Distance', { v: 84, b: 'OFF' }),
          o('Offset X', { v: 0, b: 'OFF' }),
          o('Offset Y', { v: 0, b: 'OFF' }),
          o('Offset Z', { v: 0, b: 'OFF' }),
          o('Spin Speed X', { v: 100, m: 0, b: 'TREBLE' }, { v: 18, b: 'OFF' }),
          o('Spin Speed Y', { v: 100, m: 0, b: 'TREBLE' }, { v: 18, b: 'OFF' }),
          o('Spin Speed Z', { v: 100, m: 0, b: 'TREBLE' }, { v: 18, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'SPECTRAL_MAP',
        params: [
          o('Resolution', { v: 10, b: 'OFF' }),
          o('Phase Offset', { v: 0, b: 'OFF' }),
          o('Speed', { v: 100, b: 'OFF' }),
          o('Strength', { v: 100, b: 'OFF' }),
          o('Scale X', { v: 50, b: 'OFF' }),
          o('Scale Y', { v: 50, b: 'OFF' }),
          o('Pan X', { v: 50, b: 'OFF' }),
          o('Pan Y', { v: 50, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  STREAKS: {
    id: 'STREAKS',
    label: 'Streaks',
    effects: [
      {
        type: 'GRID',
        params: [
          o('Horizontal', { v: 15, b: 'OFF' }),
          o('Vertical', { v: 0, b: 'OFF' }),
          o('Thickness', { v: 40, b: 'OFF' }),
          o('Feather', { v: 25, b: 'OFF' }),
          o('Scale X', { v: 75, b: 'OFF' }),
          o('Scale Y', { v: 50, b: 'OFF' }),
          o('Pan X', { v: 50, b: 'OFF' }),
          o('Pan Y', { v: 50, b: 'OFF' }),
          o('Rotation', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'WAVE_DISTORTION',
        params: [
          o('Amplitude', { v: 80, m: 10, b: 'TREBLE' }, { v: 10, m: 0, b: 'OFF' }),
          o('Frequency', { v: 5, b: 'OFF' }),
          o('Speed', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'TUNNEL_WARP',
        params: [
          o('Scale', { v: 3, b: 'OFF' }),
          o('Speed', { v: 80, m: 10, b: 'TREBLE' }, { v: 40, b: 'OFF' }),
          o('Twist', { v: 1, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'HUE_ROTATION',
        params: [
          o('Phase Offset', { v: 0, b: 'OFF' }),
          o('Speed', { v: 25, b: 'OFF' }),
          o('Vibrance', { v: 50, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  PAINT_MORPH: {
    id: 'PAINT_MORPH',
    label: 'Paint Morph',
    effects: [
      {
        type: 'ORGANIC_NOISE',
        params: [
          o('Scale', { v: 5, b: 'OFF' }),
          o('Complexity', { v: 31, b: 'OFF' }),
          o('Warp', { v: 10, b: 'OFF' }),
          o('Speed', { v: 100, m: 0, b: 'TREBLE' }, { v: 5, b: 'OFF' }),
          o('Blend', { v: 100, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'LUMINANCE_MASK',
        params: [
          o('Threshold', { v: 53, b: 'OFF' }),
          o('Feather', { v: 0, b: 'OFF' }),
          o('Invert', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'DEEP_FRY',
        params: [
          o('Heat', { v: 55, b: 'OFF' }),
          o('Posterize', { v: 0, b: 'OFF' })
        ],
        melded: true
      },
      {
        type: 'TUNNEL_WARP',
        params: [
          o('Scale', { v: 3, b: 'OFF' }),
          o('Speed', { v: 100, m: 0, b: 'TREBLE' }, { v: 15, b: 'OFF' }),
          o('Twist', { v: 2, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'HUE_ROTATION',
        params: [
          o('Phase Offset', { v: 10, b: 'OFF' }),
          o('Speed', { v: 25, b: 'OFF' }),
          o('Vibrance', { v: 100, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  INFINITE_DANCEFLOOR: {
    id: 'INFINITE_DANCEFLOOR',
    label: 'Infinite Dancefloor',
    effects: [
      {
        type: 'GRAIN',
        params: [
          o('Width', { v: 100 }),
          o('Height', { v: 100 }),
          o('X-Freq', { v: 45 }),
          o('Y-Freq', { v: 45 }),
          o('Density', { v: 100, b: 'OFF' }),
          o('Roundness', { v: 0 }),
          o('Blend', { v: 100 }),
          o('Scale X', { v: 50 }),
          o('Scale Y', { v: 50 }),
          o('Pan X', { v: 50 }),
          o('Pan Y', { v: 50 }),
          o('Rotation', { v: 0 }),
        ],
        melded: true
      },
      {
        type: 'TERRAIN',
        params: [
          o('Scale', { v: 3, b: 'OFF' }),
          o('Extrusion', { v: 30, m: 0, b: 'TREBLE' }, { v: 15, m: 0, b: 'OFF' }),
          o('Speed', { v: 30, m: 0, b: 'SUB' }, { v: 15, m: 0, b: 'OFF' }),
          o('Resolution', { v: 100, b: 'OFF' }),
          o('Rotate X', { v: 3, b: 'OFF' }),
          o('Rotate Y', { v: 0, b: 'OFF' }),
          o('Rotate Z', { v: 0, b: 'OFF' }),
          o('Elevation', { v: 53, b: 'OFF' }),
          o('Distance', { v: 37, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'SPECTRAL_MAP',
        params: [
          o('Resolution', { v: 10, b: 'OFF' }),
          o('Phase Offset', { v: 0, b: 'OFF' }),
          o('Speed', { v: 15, b: 'OFF' }),
          o('Strength', { v: 50, b: 'OFF' }),
          o('Scale X', { v: 50, b: 'OFF' }),
          o('Scale Y', { v: 50, b: 'OFF' }),
          o('Pan X', { v: 50, b: 'OFF' }),
          o('Pan Y', { v: 50, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  CLUSTER: {
    id: 'CLUSTER',
    label: 'Cluster',
    effects: [
      {
        type: 'CELLULAR_NOISE',
        params: [
          o('Width', { v: 40 }),
          o('Height', { v: 64 }),
          o('X-Freq', { v: 35 }),
          o('Y-Freq', { v: 35 }),
          o('Density', { v: 100 }),
          o('Jitter', { v: 100 }),
          o('Speed', { v: 80, b: 'SUB' }),
          o('Blend', { v: 100 }),
        ],
        melded: true
      },
      {
        type: 'TERRAIN_SPHERE',
        params: [
          o('Extrusion', { v: 50, b: 'SUB' }),
          o('Resolution', { v: 20, b: 'OFF' }),
          o('Distance', { v: 66, b: 'OFF' }),
          o('Offset X', { v: 0, b: 'OFF' }),
          o('Offset Y', { v: 0, b: 'OFF' }),
          o('Offset Z', { v: 0, b: 'OFF' }),
          o('Spin Speed X', { v: 0, b: 'OFF' }),
          o('Spin Speed Y', { v: 0, b: 'OFF' }),
          o('Spin Speed Z', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'HUE_ROTATION',
        params: [
          o('Phase Offset', { v: 10, b: 'OFF' }),
          o('Speed', { v: 25, b: 'OFF' }),
          o('Vibrance', { v: 73, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  GLOBE: {
    id: 'GLOBE',
    label: 'Globe',
    effects: [
      {
        type: 'SHAPE',
        params: [
          o('Side Count', { v: 4, b: 'OFF' }),
          o('Pointiness', { v: 0, b: 'OFF' }),
          o('Roundness', { v: 0, b: 'OFF' }),
          o('Feather', { v: 0, b: 'OFF' }),
          o('Blend', { v: 100, b: 'OFF' }),
          o('Scale X', { v: 50, b: 'OFF' }),
          o('Scale Y', { v: 50, b: 'OFF' }),
          o('Pan X', { v: 50, b: 'OFF' }),
          o('Pan Y', { v: 50, b: 'OFF' }),
          o('Rotation', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'ORGANIC_NOISE',
        params: [
          o('Scale', { v: 15, b: 'OFF' }),
          o('Complexity', { v: 100, b: 'OFF' }),
          o('Warp', { v: 3, b: 'OFF' }),
          o('Speed', { v: 100, m: 0, b: 'SUB' }),
          o('Blend', { v: 60, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'LUMINANCE_MASK',
        params: [
          o('Threshold', { v: 65, b: 'OFF' }),
          o('Feather', { v: 10, b: 'OFF' }),
          o('Invert', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'TERRAIN_SPHERE',
        params: [
          o('Extrusion', { v: 50, b: 'SUB' }),
          o('Resolution', { v: 100, b: 'OFF' }),
          o('Distance', { v: 75, b: 'OFF' }),
          o('Offset X', { v: 0, b: 'OFF' }),
          o('Offset Y', { v: 0, b: 'OFF' }),
          o('Offset Z', { v: 0, b: 'OFF' }),
          o('Spin Speed X', { v: 0, b: 'OFF' }),
          o('Spin Speed Y', { v: 0, b: 'OFF' }),
          o('Spin Speed Z', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'HUE_ROTATION',
        params: [
          o('Phase Offset', { v: 10, b: 'OFF' }),
          o('Speed', { v: 25, b: 'OFF' }),
          o('Vibrance', { v: 75, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  SHARDS: {
    id: 'SHARDS',
    label: 'Shards',
    effects: [
      {
        type: 'GRAIN',
        params: [
          o('Width', { v: 75 }),
          o('Height', { v: 75 }),
          o('X-Freq', { v: 50 }),
          o('Y-Freq', { v: 50 }),
          o('Density', { v: 36, b: 'OFF' }),
          o('Roundness', { v: 0 }),
          o('Blend', { v: 100 }),
          o('Scale X', { v: 50 }),
          o('Scale Y', { v: 50 }),
          o('Pan X', { v: 50 }),
          o('Pan Y', { v: 50 }),
          o('Rotation', { v: 0 }),
        ],
        melded: true
      },
      {
        type: 'TUNNEL_WARP',
        params: [
          o('Scale', { v: 5, b: 'OFF' }),
          o('Speed', { v: 75, m: 0, b: 'MID' }, { v: 15, b: 'OFF' }),
          o('Twist', { v: 12, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'HUE_ROTATION',
        params: [
          o('Phase Offset', { v: 0, b: 'OFF' }),
          o('Speed', { v: 25, b: 'OFF' }),
          o('Vibrance', { v: 73, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  ARCS: {
    id: 'ARCS',
    label: 'Arcs',
    effects: [
      {
        type: 'GRAIN',
        params: [
          o('Width', { v: 100 }),
          o('Height', { v: 100 }),
          o('X-Freq', { v: 28 }),
          o('Y-Freq', { v: 74 }),
          o('Density', { v: 24, b: 'OFF' }),
          o('Roundness', { v: 0 }),
          o('Blend', { v: 100 }),
          o('Scale X', { v: 50 }),
          o('Scale Y', { v: 50 }),
          o('Pan X', { v: 50 }),
          o('Pan Y', { v: 50 }),
          o('Rotation', { v: 0 }),
        ],
        melded: true
      },
      {
        type: 'TUNNEL_WARP',
        params: [
          o('Scale', { v: 3, b: 'OFF' }),
          o('Speed', { v: 75, m: 0, b: 'MID' }, { v: 10, b: 'OFF' }),
          o('Twist', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'HUE_ROTATION',
        params: [
          o('Phase Offset', { v: 0, b: 'OFF' }),
          o('Speed', { v: 25, b: 'OFF' }),
          o('Vibrance', { v: 73, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  SQUARE_TUNNEL: {
    id: 'SQUARE_TUNNEL',
    label: 'Square Tunnel',
    effects: [
      {
        type: 'GRAIN',
        params: [
          o('Width', { v: 90 }),
          o('Height', { v: 90 }),
          o('X-Freq', { v: 70 }),
          o('Y-Freq', { v: 70 }),
          o('Density', { v: 100, b: 'OFF' }),
          o('Roundness', { v: 0 }),
          o('Blend', { v: 100 }),
          o('Scale X', { v: 50 }),
          o('Scale Y', { v: 50 }),
          o('Pan X', { v: 50 }),
          o('Pan Y', { v: 50 }),
          o('Rotation', { v: 0 }),
        ],
        melded: true
      },
      {
        type: 'TUNNEL_WARP',
        params: [
          o('Scale', { v: 10, b: 'OFF' }),
          o('Speed', { v: 75, m: 0, b: 'MID' }, { v: 15, b: 'OFF' }),
          o('Twist', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'HUE_ROTATION',
        params: [
          o('Phase Offset', { v: 0, b: 'OFF' }),
          o('Speed', { v: 25, b: 'OFF' }),
          o('Vibrance', { v: 73, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  LIGHT_TUNNEL: {
    id: 'LIGHT_TUNNEL',
    label: 'Light Tunnel',
    effects: [
      {
        type: 'CELLULAR_NOISE',
        params: [
          o('Cell Width', { v: 48 }),
          o('Cell Height', { v: 100 }),
          o('X-Freq', { v: 88 }),
          o('Y-Freq', { v: 55 }),
          o('Density', { v: 24 }),
          o('Jitter', { v: 0 }),
          o('Speed', { v: 0, b: 'OFF' }),
          o('Blend', { v: 100 }),
        ],
        melded: true
      },
      {
        type: 'TUNNEL_WARP',
        params: [
          o('Scale', { v: 1, b: 'OFF' }),
          o('Speed', { v: 30, m: 0, b: 'SUB' }, { v: 10, b: 'OFF' }),
          o('Twist', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'HUE_ROTATION',
        params: [
          o('Phase Offset', { v: 10, b: 'OFF' }),
          o('Speed', { v: 25, b: 'OFF' }),
          o('Vibrance', { v: 50, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  CLOUDS: {
    id: 'CLOUDS',
    label: 'Clouds',
    effects: [
      {
        type: 'CELLULAR_NOISE',
        params: [
          o('Cell Width', { v: 100 }),
          o('Cell Height', { v: 80 }),
          o('X-Freq', { v: 20 }),
          o('Y-Freq', { v: 32 }),
          o('Density', { v: 100 }),
          o('Jitter', { v: 100 }),
          o('Speed', { v: 5, b: 'OFF' }),
          o('Blend', { v: 100 }),
        ],
        melded: true
      },
      {
        type: 'ORGANIC_NOISE',
        params: [
          o('Scale', { v: 38, b: 'OFF' }),
          o('Complexity', { v: 100, b: 'OFF' }),
          o('Warp', { v: 0, b: 'OFF' }),
          o('Speed', { v: 0, b: 'OFF' }),
          o('Blend', { v: 40, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'LUMINANCE_MASK',
        params: [
          o('Threshold', { v: 50, b: 'OFF' }),
          o('Feather', { v: 20, b: 'OFF' }),
          o('Invert', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'INFINITE_ZOOM',
        params: [
          o('Speed', { v: 20, b: 'SUB' }),
          o('Depth', { v: 50, b: 'OFF' }),
          o('Spacing', { v: 15, b: 'OFF' }),
          o('Plane Count', { v: 20, b: 'OFF' }),
          o('Edge Feather', { v: 30, b: 'OFF' }),
          o('Fade Buffer', { v: 100, m: 50, b: 'SUB' }),
        ],
        melded: false
      }
    ]
  },
  QUAD_FRACTAL: {
    id: 'QUAD_FRACTAL',
    label: 'Quad Fractal',
    effects: [
      {
        type: 'GRAIN',
        params: [
          o('Width', { v: 50 }),
          o('Height', { v: 50 }),
          o('X-Freq', { v: 80 }),
          o('Y-Freq', { v: 72 }),
          o('Density', { v: 30, b: 'OFF' }),
          o('Roundness', { v: 0 }),
          o('Blend', { v: 100 }),
          o('Scale X', { v: 50 }),
          o('Scale Y', { v: 50 }),
          o('Pan X', { v: 50 }),
          o('Pan Y', { v: 50 }),
          o('Rotation', { v: 0 }),
        ],
        melded: true
      },
      {
        type: 'CHECKERBOARD',
        params: [
          o('Freq X', { v: 10, b: 'OFF' }),
          o('Freq Y', { v: 10, b: 'OFF' }),
          o('Scale X', { v: 50 }),
          o('Scale Y', { v: 50 }),
          o('Pan X', { v: 50 }),
          o('Pan Y', { v: 50 }),
          o('Rotation', { v: 0 }),
        ],
        melded: true
      },
      {
        type: 'INFINITE_ZOOM',
        params: [
          o('Speed', { v: 50, b: 'SUB' }, { v: 5, b: 'OFF' }),
          o('Depth', { v: 0, b: 'OFF' }),
          o('Spacing', { v: 90, b: 'OFF' }),
          o('Plane Count', { v: 20, b: 'OFF' }),
          o('Edge Feather', { v: 0, b: 'OFF' }),
          o('Fade Buffer', { v: 100, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  ATOMS: {
    id: 'ATOMS',
    label: 'Atoms',
    effects: [
      {
        type: 'CELLULAR_NOISE',
        params: [
          o('Cell Width', { v: 50, m: 1, b: 'SUB' }, { v: 35, m: 5, b: 'SUB' }),
          o('Cell Height', { v: 50, m: 1, b: 'SUB' }, { v: 35, m: 5, b: 'SUB' }),
          o('X-Freq', { v: 45 }, { v: 30 }),
          o('Y-Freq', { v: 37 }, { v: 30 }),
          o('Density', { v: 100 }),
          o('Jitter', { v: 75 }),
          o('Speed', { v: 100, b: 'SUB' }, { v: 15, b: 'OFF' }),
          o('Blend', { v: 100 }),
        ],
        melded: true
      },
      {
        type: 'LUMINANCE_MASK',
        params: [
          o('Threshold', { v: 10, b: 'OFF' }),
          o('Feather', { v: 35, b: 'OFF' }),
          o('Invert', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'HUE_ROTATION',
        params: [
          o('Phase Offset', { v: 30, b: 'OFF' }),
          o('Speed', { v: 10, b: 'OFF' }),
          o('Vibrance', { v: 50, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'INFINITE_ZOOM',
        params: [
          o('Speed', { v: 70, b: 'SUB' }, { v: 15, b: 'OFF' }),
          o('Depth', { v: 10, b: 'OFF' }),
          o('Spacing', { v: 80, b: 'OFF' }),
          o('Plane Count', { v: 20, b: 'OFF' }),
          o('Edge Feather', { v: 50, b: 'OFF' }),
          o('Fade Buffer', { v: 80, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  CELLULAR_MATRIX: {
    id: 'CELLULAR_MATRIX',
    label: 'Cellular Matrix',
    effects: [
      {
        type: 'CELLULAR_NOISE',
        params: [
          o('Cell Width', { v: 59 }),
          o('Cell Height', { v: 100 }),
          o('X-Freq', { v: 42 }, { v: 34 }),
          o('Y-Freq', { v: 42 }),
          o('Density', { v: 100 }),
          o('Jitter', { v: 100 }),
          o('Speed', { v: 30, b: 'SUB' }, { v: 15, b: 'OFF' }),
          o('Blend', { v: 100 }),
        ],
        melded: true
      },
      {
        type: 'EDGE_MASK',
        params: [
          o('Sensitivity', { v: 2, b: 'OFF' }),
          o('Thickness', { v: 15, b: 'OFF' }),
          o('Invert', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'SPECTRAL_MAP',
        params: [
          o('Resolution', { v: 10, b: 'OFF' }),
          o('Phase Offset', { v: 0, b: 'OFF' }),
          o('Speed', { v: 25, b: 'OFF' }),
          o('Strength', { v: 100, b: 'OFF' }),
          o('Scale X', { v: 50, b: 'OFF' }),
          o('Scale Y', { v: 50, b: 'OFF' }),
          o('Pan X', { v: 50, b: 'OFF' }),
          o('Pan Y', { v: 50, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'INFINITE_ZOOM',
        params: [
          o('Speed', { v: 50, b: 'SUB' }, { v: 15, b: 'OFF' }),
          o('Depth', { v: 0, b: 'OFF' }),
          o('Spacing', { v: 70, b: 'OFF' }),
          o('Plane Count', { v: 20, b: 'OFF' }),
          o('Edge Feather', { v: 50, b: 'OFF' }),
          o('Fade Buffer', { v: 100, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  SMOKE: {
    id: 'SMOKE',
    label: 'Smoke',
    effects: [
      {
        type: 'ORGANIC_NOISE',
        params: [
          o('Scale', { v: 15 }),
          o('Complexity', { v: 100 }),
          o('Warp', { v: 5 }),
          o('Speed', { v: 5, b: 'OFF' }),
          o('Blend', { v: 100 }),
        ],
        melded: true
      },
      {
        type: 'LUMINANCE_MASK',
        params: [
          o('Threshold', { v: 50, b: 'OFF' }),
          o('Feather', { v: 54, b: 'OFF' }),
          o('Invert', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'INFINITE_ZOOM',
        params: [
          o('Speed', { v: 50, b: 'SUB' }, { v: 10, b: 'OFF' }),
          o('Depth', { v: 50, b: 'OFF' }),
          o('Spacing', { v: 15, b: 'OFF' }),
          o('Plane Count', { v: 20, b: 'OFF' }),
          o('Edge Feather', { v: 15, b: 'OFF' }),
          o('Fade Buffer', { v: 30, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  CRUSHED_RAIN: {
    id: 'CRUSHED_RAIN',
    label: 'Crushed Rain',
    effects: [
      {
        type: 'GRAIN',
        params: [
          o('Width', { v: 100 }),
          o('Height', { v: 100 }),
          o('X-Freq', { v: 60 }, { v: 50 }),
          o('Y-Freq', { v: 50 }),
          o('Density', { v: 35, b: 'OFF' }),
          o('Roundness', { v: 0 }),
          o('Blend', { v: 100 }),
          o('Scale X', { v: 50 }),
          o('Scale Y', { v: 50 }),
          o('Pan X', { v: 50 }),
          o('Pan Y', { v: 50 }),
          o('Rotation', { v: 0 }),
        ],
        melded: true
      },
      {
        type: 'SCROLL',
        params: [
          o('Left Speed', { v: 0, b: 'OFF' }),
          o('Right Speed', { v: 0, b: 'OFF' }),
          o('Up Speed', { v: 0, b: 'OFF' }),
          o('Down Speed', { v: 50, m: 0, b: 'SUB' }, { v: 10, b: 'OFF' }),
          o('Ghost X', { v: 0, b: 'OFF' }),
          o('Ghost Y', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'RGBA',
        params: [
          o('Red', { v: 0, b: 'OFF' }),
          o('Green', { v: 100, b: 'OFF' }),
          o('Blue', { v: 100, b: 'OFF' }),
          o('Opacity', { v: 100, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'INFINITE_ZOOM',
        params: [
          o('Speed', { v: 0, b: 'OFF' }),
          o('Depth', { v: 50, b: 'OFF' }),
          o('Spacing', { v: 15, b: 'OFF' }),
          o('Plane Count', { v: 20, b: 'OFF' }),
          o('Edge Feather', { v: 90, b: 'OFF' }),
          o('Fade Buffer', { v: 100, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  RIPPLES: {
    id: 'RIPPLES',
    label: 'Ripples',
    effects: [
      {
        type: 'RADIAL_GRADIENT',
        params: [
          o('Feather', { v: 30 }),
          o('Frequency', { v: 30 }),
          o('Speed', { v: 100, b: 'SUB' }, { v: 15, b: 'OFF' }),
          o('Pan X', { v: 50 }),
          o('Pan Y', { v: 50 }),
        ],
        melded: true
      },
      {
        type: 'ORGANIC_NOISE',
        params: [
          o('Scale', { v: 15 }),
          o('Complexity', { v: 10 }),
          o('Warp', { v: 8 }),
          o('Speed', { v: 50, b: 'SUB' }),
          o('Blend', { v: 50 }),
        ],
        melded: true
      },
      {
        type: 'TERRAIN',
        params: [
          o('Scale', { v: 3, b: 'OFF' }),
          o('Extrusion', { v: 30, m: 10, b: 'SUB' }),
          o('Speed', { v: 0, b: 'OFF' }),
          o('Resolution', { v: 100, b: 'OFF' }),
          o('Rotate X', { v: 0, b: 'OFF' }),
          o('Rotate Y', { v: 0, b: 'OFF' }),
          o('Rotate Z', { v: 0, b: 'OFF' }),
          o('Elevation', { v: 50, b: 'OFF' }),
          o('Distance', { v: 40, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  SPINNING_CORRIDOR: {
    id: 'SPINNING_CORRIDOR',
    label: 'Spinning Corridor',
    effects: [
      {
        type: 'SHAPE',
        params: [
          o('Side Count', { v: 4, b: 'OFF' }),
          o('Pointiness', { v: 0, b: 'OFF' }),
          o('Roundness', { v: 0, b: 'OFF' }),
          o('Feather', { v: 0, b: 'OFF' }),
          o('Blend', { v: 100, b: 'OFF' }),
          o('Scale X', { v: 50, b: 'OFF' }),
          o('Scale Y', { v: 30, b: 'OFF' }),
          o('Pan X', { v: 50, b: 'OFF' }),
          o('Pan Y', { v: 70, b: 'OFF' }),
          o('Rotation', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'SHAPE',
        params: [
          o('Side Count', { v: 4, b: 'OFF' }),
          o('Pointiness', { v: 0, b: 'OFF' }),
          o('Roundness', { v: 0, b: 'OFF' }),
          o('Feather', { v: 0, b: 'OFF' }),
          o('Blend', { v: 100, b: 'OFF' }),
          o('Scale X', { v: 50, b: 'OFF' }),
          o('Scale Y', { v: 30, b: 'OFF' }),
          o('Pan X', { v: 50, b: 'OFF' }),
          o('Pan Y', { v: 30, b: 'OFF' }),
          o('Rotation', { v: 0, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'ROTATE',
        params: [
          o('Rotation', { v: 0, b: 'OFF' }),
          o('Speed', { v: 5, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'INFINITE_ZOOM',
        params: [
          o('Speed', { v: 100, b: 'SUB' }, { v: 50, b: 'OFF' }),
          o('Depth', { v: 45 }),
          o('Spacing', { v: 11 }),
          o('Plane Count', { v: 100 }),
          o('Edge Feather', { v: 100 }),
          o('Fade Buffer', { v: 100 }),
        ],
        melded: false
      }
    ]
  }
};
