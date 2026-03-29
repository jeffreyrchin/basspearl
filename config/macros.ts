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
          o('Extrusion', { v: 34, b: 'OFF' }),
          o('Speed', { v: 17, b: 'OFF' }),
          o('Resolution', { v: 9, b: 'OFF' }),
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
          o('Speed', { v: 5, b: 'OFF' }),
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
          o('Speed', { v: 5, b: 'OFF' }),
          o('Blend', { v: 100, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'TERRAIN',
        params: [
          o('Scale', { v: 3, b: 'OFF' }),
          o('Extrusion', { v: 28, b: 'OFF' }),
          o('Speed', { v: 0, b: 'OFF' }),
          o('Resolution', { v: 100, b: 'OFF' }),
          o('Rotate X', { v: 0, b: 'OFF' }),
          o('Rotate Y', { v: 0, b: 'OFF' }),
          o('Rotate Z', { v: 0, b: 'OFF' }),
          o('Elevation', { v: 46, b: 'OFF' }),
          o('Distance', { v: 50, b: 'OFF' }),
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
          o('Speed', { v: 10, b: 'OFF' }),
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
        melded: false
      }
    ]
  },
  SPEED_TUNNEL: {
    id: 'SPEED_TUNNEL',
    label: 'Speed Tunnel',
    effects: [
      {
        type: 'GRAIN',
        params: [
          o('Width', { v: 43, b: 'OFF' }),
          o('Height', { v: 100, b: 'OFF' }),
          o('X-Freq', { v: 63, b: 'OFF' }),
          o('Y-Freq', { v: 53, b: 'OFF' }),
          o('Density', { v: 44, b: 'OFF' }),
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
          o('Speed', { v: 20, b: 'OFF' }),
          o('Twist', { v: 0, b: 'OFF' }),
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
          o('Thickness', { v: 30, b: 'OFF' }),
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
          o('Speed', { v: 52, b: 'OFF' }),
          o('Twist', { v: 0, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  CELL_MASS: {
    id: 'CELL_MASS',
    label: 'Cell Mass',
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
          o('Speed', { v: 100, b: 'OFF' }),
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
          o('Extrusion', { v: 80, b: 'OFF' }),
          o('Resolution', { v: 50, b: 'OFF' }),
          o('Distance', { v: 0, b: 'OFF' }),
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
          o('Thickness', { v: 5, b: 'OFF' }),
          o('Invert', { v: 0, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  SPIKY_WORLD: {
    id: 'SPIKY_WORLD',
    label: 'Spiky World',
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
          o('Speed', { v: 100, b: 'OFF' }),
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
          o('Speed', { v: 8, b: 'OFF' }),
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
          o('Extrusion', { v: 47, b: 'OFF' }),
          o('Resolution', { v: 100, b: 'OFF' }),
          o('Distance', { v: 40, b: 'OFF' }),
          o('Offset X', { v: 0, b: 'OFF' }),
          o('Offset Y', { v: 0, b: 'OFF' }),
          o('Offset Z', { v: 0, b: 'OFF' }),
          o('Spin Speed X', { v: 0, b: 'OFF' }),
          o('Spin Speed Y', { v: 0, b: 'OFF' }),
          o('Spin Speed Z', { v: 0, b: 'OFF' }),
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
          o('Extrusion', { v: 50, b: 'OFF' }),
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
          o('Speed', { v: 5, b: 'OFF' }),
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
          o('Spin Speed X', { v: 18, b: 'OFF' }),
          o('Spin Speed Y', { v: 18, b: 'OFF' }),
          o('Spin Speed Z', { v: 18, b: 'OFF' }),
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
  }
};
