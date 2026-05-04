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
  SMOKE_VORTEX: {
    id: 'SMOKE_VORTEX',
    label: 'Smoke Vortex',
    effects: [
      {
        type: 'ORGANIC_NOISE',
        params: [
          o('Scale', { v: 30, b: 'OFF' }),
          o('Detail Level', { v: 100, b: 'OFF' }),
          o('Warp Amount', { v: 3, b: 'OFF' }),
          o('Warp Speed', { v: 70, b: 'SUB' }, { v: 35, b: 'OFF' }),
          o('Warp Direction', { v: 0, b: 'OFF' }),
          o('Blend', { v: 100, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'EDGE_MASK',
        params: [
          o('Sensitivity', { v: 10, b: 'OFF' }),
          o('Thickness', { v: 12, b: 'OFF' }),
          o('Invert', { v: 0, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'TUNNEL_WARP',
        params: [
          o('Scale', { v: 5, b: 'OFF' }),
          o('Speed', { v: 50, b: 'SUB' }, { v: 25, b: 'OFF' }),
          o('Twist', { v: 3, b: 'OFF' }),
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
          o('Feather', { v: 0, b: 'OFF' }),
          o('Blend', { v: 100, b: 'OFF' }),
          o('Scale X', { v: 15, b: 'OFF' }),
          o('Scale Y', { v: 25, b: 'OFF' }),
          o('Pan X', { v: 50, b: 'OFF' }),
          o('Pan Y', { v: 50, b: 'OFF' }),
          o('Rotation', { v: 0, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'WAVE_DISTORTION',
        params: [
          o('Amplitude', { v: 75, m: 0, b: 'SUB' }, { v: 50, m: 10, b: 'SUB' }),
          o('Frequency', { v: 0, b: 'OFF' }),
          o('Speed', { v: 75, m: 0, b: 'SUB' }, { v: 50, m: 10, b: 'SUB' }),
        ],
        melded: false
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
          o('Width', { v: 75, b: 'OFF' }),
          o('Height', { v: 75, b: 'OFF' }),
          o('Freq X', { v: 50, b: 'OFF' }),
          o('Freq Y', { v: 46, b: 'OFF' }),
          o('Density', { v: 100, b: 'OFF' }),
          o('Roundness', { v: 0, b: 'OFF' }),
          o('Blend', { v: 100, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'TERRAIN',
        params: [
          o('Extrusion', { v: 20, m: 10, b: 'SUB' }, { v: 15, m: 0, b: 'OFF' }),
          o('Detail Level', { v: 100, b: 'OFF' }),
          o('Tile Width', { v: 100, b: 'OFF' }),
          o('Tile Height', { v: 100, b: 'OFF' }),
          o('Rotate X', { v: 0, b: 'OFF' }),
          o('Rotate Y', { v: 0, b: 'OFF' }),
          o('Rotate Z', { v: 0, b: 'OFF' }),
          o('Elevation', { v: 50, b: 'OFF' }),
          o('Distance', { v: 50, b: 'OFF' }),
          o('Tile Blend', { v: 0, b: 'OFF' }),
          o('Speed X', { v: 0, b: 'OFF' }),
          o('Speed Y', { v: 5, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  LANDSCAPE: {
    id: 'LANDSCAPE',
    label: 'Landscape',
    requiredPuzzleCompletedToUnlock: 'LANDSCAPE',
    effects: [
      {
        type: 'GRAIN',
        params: [
          o('Width', { v: 100, b: 'OFF' }),
          o('Height', { v: 100, b: 'OFF' }),
          o('Freq X', { v: 50, b: 'OFF' }),
          o('Freq Y', { v: 50, b: 'OFF' }),
          o('Density', { v: 100, b: 'OFF' }),
          o('Roundness', { v: 0, b: 'OFF' }),
          o('Blend', { v: 100, b: 'OFF' }),
          o('Scale X', { v: 50, b: 'OFF' }),
          o('Scale Y', { v: 50, b: 'OFF' }),
          o('Pan X', { v: 50, b: 'OFF' }),
          o('Pan Y', { v: 50, b: 'OFF' }),
          o('Rotation', { v: 0, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'TERRAIN',
        params: [
          o('Extrusion', { v: 8, m: 3, b: 'SUB' }, { v: 5, b: 'OFF' }),
          o('Detail Level', { v: 5, b: 'OFF' }),
          o('Tile Width', { v: 100, b: 'OFF' }),
          o('Tile Height', { v: 100, b: 'OFF' }),
          o('Rotate X', { v: 97, b: 'OFF' }),
          o('Rotate Y', { v: 0, b: 'OFF' }),
          o('Rotate Z', { v: 0, b: 'OFF' }),
          o('Elevation', { v: 50, b: 'OFF' }),
          o('Distance', { v: 50, b: 'OFF' }),
          o('Tile Blend', { v: 0, b: 'OFF' }),
          o('Speed X', { v: 70, b: 'SUB' }, { v: 21, b: 'OFF' }),
          o('Speed Y', { v: 100, b: 'SUB' }, { v: 30, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'RGBA',
        params: [
          o('Red', { v: 0, b: 'OFF' }),
          o('Green', { v: 100, b: 'OFF' }),
          o('Blue', { v: 50, b: 'OFF' }),
          o('Opacity', { v: 100, b: 'OFF' }),
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
          o('Scale', { v: 27, b: 'OFF' }),
          o('Detail Level', { v: 100, b: 'OFF' }),
          o('Warp Amount', { v: 2, b: 'OFF' }),
          o('Warp Speed', { v: 100, m: 0, b: 'SUB' }, { v: 30, b: 'OFF' }),
          o('Warp Direction', { v: 11, b: 'OFF' }),
          o('Blend', { v: 91, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'TERRAIN',
        params: [
          o('Extrusion', { v: 20, m: 3, b: 'SUB' }, { v: 10, b: 'OFF' }),
          o('Detail Level', { v: 100, b: 'OFF' }),
          o('Tile Width', { v: 100, b: 'OFF' }),
          o('Tile Height', { v: 100, b: 'OFF' }),
          o('Rotate X', { v: 0, b: 'OFF' }),
          o('Rotate Y', { v: 0, b: 'OFF' }),
          o('Rotate Z', { v: 0, b: 'OFF' }),
          o('Elevation', { v: 50, b: 'OFF' }),
          o('Distance', { v: 50, b: 'OFF' }),
          o('Tile Blend', { v: 0, b: 'OFF' }),
          o('Speed X', { v: 0, b: 'OFF' }),
          o('Speed Y', { v: 0, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'SPECTRAL_MAP',
        params: [
          o('Rainbow Density', { v: 15, b: 'OFF' }),
          o('Color Shift', { v: 0, b: 'OFF' }),
          o('Speed', { v: 0, b: 'OFF' }),
          o('Intensity', { v: 58, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'GLOW',
        params: [
          o('Sensitivity', { v: 0, b: 'OFF' }),
          o('Distance', { v: 33, b: 'OFF' }),
          o('Strength', { v: 100, b: 'OFF' }),
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
          o('Freq X', { v: 65, b: 'OFF' }),
          o('Freq Y', { v: 65, b: 'OFF' }),
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
        type: 'SPECTRAL_MAP',
        params: [
          o('Rainbow Density', { v: 25, b: 'OFF' }),
          o('Color Shift', { v: 0, b: 'OFF' }),
          o('Speed', { v: 75, b: 'OFF' }),
          o('Intensity', { v: 100, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'GLOW',
        params: [
          o('Sensitivity', { v: 0, b: 'OFF' }),
          o('Distance', { v: 0, b: 'OFF' }),
          o('Strength', { v: 100, b: 'OFF' }),
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
          o('Vertical', { v: 3, b: 'OFF' }),
          o('Thickness', { v: 100, m: 0, b: 'SUB' }, { v: 20, b: 'OFF' }),
          o('Feather', { v: 20, b: 'OFF' }),
          o('Scale X', { v: 50, b: 'OFF' }),
          o('Scale Y', { v: 50, b: 'OFF' }),
          o('Pan X', { v: 50, b: 'OFF' }),
          o('Pan Y', { v: 50, b: 'OFF' }),
          o('Rotation', { v: 0, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'HUE_ROTATION',
        params: [
          o('Color Shift', { v: 0, b: 'OFF' }),
          o('Speed', { v: 15, b: 'OFF' }),
          o('Vibrance', { v: 100, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'GLOW',
        params: [
          o('Sensitivity', { v: 20, b: 'OFF' }),
          o('Distance', { v: 65, b: 'OFF' }),
          o('Strength', { v: 100, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'TUNNEL_WARP',
        params: [
          o('Scale', { v: 5, b: 'OFF' }),
          o('Speed', { v: 10, b: 'OFF' }),
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
          o('Horizontal', { v: 6, b: 'OFF' }),
          o('Vertical', { v: 0, b: 'OFF' }),
          o('Thickness', { v: 100, b: 'OFF' }),
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
    requiredPuzzleCompletedToUnlock: 'DISCO_BALL',
    effects: [
      {
        type: 'ORGANIC_NOISE',
        params: [
          o('Scale', { v: 25, b: 'OFF' }),
          o('Detail Level', { v: 25, b: 'OFF' }),
          o('Warp Amount', { v: 3, b: 'OFF' }),
          o('Warp Speed', { v: 100, m: 4, b: 'SUB' }, { v: 30, b: 'OFF' }),
          o('Warp Direction', { v: 5, b: 'OFF' }),
          o('Blend', { v: 100, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'SPECTRAL_MAP',
        params: [
          o('Rainbow Density', { v: 50, b: 'OFF' }),
          o('Color Shift', { v: 0, b: 'OFF' }),
          o('Speed', { v: 20, b: 'OFF' }),
          o('Intensity', { v: 50, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'GLOW',
        params: [
          o('Sensitivity', { v: 0, b: 'OFF' }),
          o('Distance', { v: 5, b: 'OFF' }),
          o('Strength', { v: 100, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'TERRAIN_SPHERE',
        params: [
          o('Extrusion', { v: 50, m: 18, b: 'SUB' }, { v: 45, b: 'OFF' }),
          o('Detail Level', { v: 20, b: 'OFF' }),
          o('Size', { v: 24, m: 12, b: 'SUB' }, { v: 24, m: 0, b: 'OFF' }),
          o('Offset X', { v: 0, b: 'OFF' }),
          o('Offset Y', { v: 0, b: 'OFF' }),
          o('Offset Z', { v: 0, b: 'OFF' }),
          o('Spin Speed X', { v: 0, b: 'OFF' }),
          o('Spin Speed Y', { v: 0, b: 'OFF' }),
          o('Spin Speed Z', { v: 20, b: 'SUB' }),
        ],
        melded: false
      },
      {
        type: 'EDGE_MASK',
        params: [
          o('Sensitivity', { v: 2, b: 'OFF' }),
          o('Thickness', { v: 1, b: 'OFF' }),
          o('Invert', { v: 0, b: 'OFF' }),
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
          o('Freq X', { v: 70 }),
          o('Freq Y', { v: 70 }),
          o('Density', { v: 100 }),
          o('Jitter', { v: 0 }),
          o('Speed', { v: 30, b: 'OFF' }),
          o('Blend', { v: 100 }),
        ],
        melded: false
      },
      {
        type: 'ORGANIC_NOISE',
        params: [
          o('Scale', { v: 22, b: 'OFF' }),
          o('Detail Level', { v: 0, b: 'OFF' }),
          o('Warp Amount', { v: 4, b: 'OFF' }),
          o('Warp Speed', { v: 75, b: 'SUB' }, { v: 15, b: 'OFF' }),
          o('Warp Direction', { v: 0, b: 'OFF' }),
          o('Blend', { v: 62, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'LUMINANCE_MASK',
        params: [
          o('Threshold', { v: 34, b: 'OFF' }),
          o('Feather', { v: 64, b: 'OFF' }),
          o('Invert', { v: 0, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'TERRAIN_SPHERE',
        params: [
          o('Extrusion', { v: 90, m: 45, b: 'SUB' }, { v: 47, b: 'OFF' }),
          o('Detail Level', { v: 100, b: 'OFF' }),
          o('Size', { v: 15, b: 'OFF' }, { v: 28, b: 'OFF' }),
          o('Offset X', { v: 0, b: 'OFF' }),
          o('Offset Y', { v: 0, b: 'OFF' }),
          o('Offset Z', { v: 0, b: 'OFF' }),
          o('Spin Speed X', { v: 0, b: 'OFF' }),
          o('Spin Speed Y', { v: 0, b: 'OFF' }),
          o('Spin Speed Z', { v: 0, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'SPECTRAL_MAP',
        params: [
          o('Rainbow Density', { v: 10, b: 'OFF' }),
          o('Color Shift', { v: 0, b: 'OFF' }),
          o('Speed', { v: 20, b: 'OFF' }),
          o('Intensity', { v: 50, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  CRYOGENIC_FLUID: {
    id: 'CRYOGENIC_FLUID',
    label: 'Cryogenic Fluid',
    requiredPuzzleCompletedToUnlock: 'CRYOGENIC_FLUID',
    effects: [
      {
        type: 'SHAPE',
        params: [
          o('Side Count', { v: 100 }),
          o('Pointiness', { v: 0 }),
          o('Roundness', { v: 0 }),
          o('Feather', { v: 35 }),
          o('Blend', { v: 100 }),
          o('Scale X', { v: 15, b: 'OFF' }),
          o('Scale Y', { v: 30, b: 'OFF' }),
          o('Pan X', { v: 50, b: 'OFF' }),
          o('Pan Y', { v: 50, b: 'OFF' }),
          o('Rotation', { v: 0, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'ORGANIC_NOISE',
        params: [
          o('Scale', { v: 22, b: 'OFF' }),
          o('Detail Level', { v: 40, b: 'OFF' }),
          o('Warp Amount', { v: 11, b: 'OFF' }),
          o('Warp Speed', { v: 75, b: 'SUB' }, { v: 20, b: 'OFF' }),
          o('Warp Direction', { v: 0, b: 'OFF' }),
          o('Blend', { v: 50, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'TERRAIN',
        params: [
          o('Extrusion', { v: 20, m: 4, b: 'SUB' }, { v: 12, m: 0, b: 'OFF' }),
          o('Detail Level', { v: 100, b: 'OFF' }),
          o('Tile Width', { v: 100, b: 'OFF' }),
          o('Tile Height', { v: 100, b: 'OFF' }),
          o('Rotate X', { v: 0, b: 'OFF' }),
          o('Rotate Y', { v: 0, b: 'OFF' }),
          o('Rotate Z', { v: 0, b: 'OFF' }),
          o('Elevation', { v: 50, b: 'OFF' }),
          o('Distance', { v: 50, b: 'OFF' }),
          o('Tile Blend', { v: 0, b: 'OFF' }),
          o('Speed X', { v: 0, b: 'OFF' }),
          o('Speed Y', { v: 0, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  DISCO_BALL: {
    id: 'DISCO_BALL',
    label: 'Disco Ball',
    requiredPuzzleCompletedToUnlock: 'DISCO_BALL',
    effects: [
      {
        type: 'GRAIN',
        params: [
          o('Width', { v: 70 }),
          o('Height', { v: 70 }),
          o('Freq X', { v: 36 }),
          o('Freq Y', { v: 20 }),
          o('Density', { v: 100, b: 'OFF' }),
          o('Roundness', { v: 0 }),
          o('Blend', { v: 100 }),
          o('Scale X', { v: 50 }),
          o('Scale Y', { v: 50 }),
          o('Pan X', { v: 50 }),
          o('Pan Y', { v: 50 }),
          o('Rotation', { v: 0 }),
        ],
        melded: false
      },
      {
        type: 'TERRAIN_SPHERE',
        params: [
          o('Extrusion', { v: 5, b: 'SUB' }, { v: 0, b: 'OFF' }),
          o('Detail Level', { v: 100, b: 'OFF' }),
          o('Size', { v: 50, b: 'OFF' }),
          o('Offset X', { v: 0, b: 'OFF' }),
          o('Offset Y', { v: 0, b: 'OFF' }),
          o('Offset Z', { v: 0, b: 'OFF' }),
          o('Spin Speed X', { v: 3, m: 0, b: 'SUB' }, { v: 18, b: 'OFF' }),
          o('Spin Speed Y', { v: 50, m: 0, b: 'SUB' }, { v: 18, b: 'OFF' }),
          o('Spin Speed Z', { v: 0, m: 0, b: 'OFF' }, { v: 18, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'SPECTRAL_MAP',
        params: [
          o('Rainbow Density', { v: 10, b: 'OFF' }),
          o('Color Shift', { v: 0, b: 'OFF' }),
          o('Speed', { v: 100, b: 'OFF' }),
          o('Intensity', { v: 100, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'GLOW',
        params: [
          o('Sensitivity', { v: 0, b: 'OFF' }),
          o('Distance', { v: 25, b: 'OFF' }),
          o('Strength', { v: 100, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  STREAKS: {
    id: 'STREAKS',
    label: 'Streaks',
    requiredPuzzleCompletedToUnlock: 'STREAKS',
    effects: [
      {
        type: 'GRID',
        params: [
          o('Horizontal', { v: 9, b: 'OFF' }),
          o('Vertical', { v: 0, b: 'OFF' }),
          o('Thickness', { v: 40, b: 'OFF' }),
          o('Feather', { v: 25, b: 'OFF' }),
          o('Scale X', { v: 75, b: 'OFF' }),
          o('Scale Y', { v: 50, b: 'OFF' }),
          o('Pan X', { v: 50, b: 'OFF' }),
          o('Pan Y', { v: 50, b: 'OFF' }),
          o('Rotation', { v: 0, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'WAVE_DISTORTION',
        params: [
          o('Amplitude', { v: 80, m: 10, b: 'TREBLE' }, { v: 10, m: 0, b: 'OFF' }),
          o('Frequency', { v: 5, b: 'OFF' }),
          o('Speed', { v: 0, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'TUNNEL_WARP',
        params: [
          o('Scale', { v: 3, b: 'OFF' }),
          o('Speed', { v: 60, m: 10, b: 'SUB' }, { v: 40, b: 'OFF' }),
          o('Twist', { v: 1, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'HUE_ROTATION',
        params: [
          o('Color Shift', { v: 0, b: 'OFF' }),
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
          o('Scale', { v: 20, b: 'OFF' }),
          o('Detail Level', { v: 0, b: 'OFF' }),
          o('Warp Amount', { v: 5, b: 'OFF' }),
          o('Warp Speed', { v: 75, m: 0, b: 'SUB' }, { v: 30, b: 'OFF' }),
          o('Warp Direction', { v: 12, b: 'OFF' }),
          o('Blend', { v: 100, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'LUMINANCE_MASK',
        params: [
          o('Threshold', { v: 53, b: 'OFF' }),
          o('Feather', { v: 0, b: 'OFF' }),
          o('Invert', { v: 0, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'DEEP_FRY',
        params: [
          o('Heat', { v: 55, b: 'OFF' }),
          o('Posterize', { v: 0, b: 'OFF' })
        ],
        melded: false
      },
      {
        type: 'HUE_ROTATION',
        params: [
          o('Color Shift', { v: 10, b: 'OFF' }),
          o('Speed', { v: 30, m: 0, b: 'SUB' }, { v: 25, b: 'OFF' }),
          o('Vibrance', { v: 100, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'TUNNEL_WARP',
        params: [
          o('Scale', { v: 3, b: 'OFF' }),
          o('Speed', { v: 50, m: 0, b: 'SUB' }, { v: 15, b: 'OFF' }),
          o('Twist', { v: 2, b: 'OFF' }),
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
          o('Freq X', { v: 20 }),
          o('Freq Y', { v: 20 }),
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
          o('Extrusion', { v: 20, m: 0, b: 'SUB' }, { v: 5, m: 0, b: 'OFF' }),
          o('Detail Level', { v: 100, b: 'OFF' }),
          o('Tile Width', { v: 100, b: 'OFF' }),
          o('Tile Height', { v: 100, b: 'OFF' }),
          o('Rotate X', { v: 0, b: 'OFF' }),
          o('Rotate Y', { v: 0, b: 'OFF' }),
          o('Rotate Z', { v: 0, b: 'OFF' }),
          o('Elevation', { v: 50, b: 'OFF' }),
          o('Distance', { v: 50, b: 'OFF' }),
          o('Tile Blend', { v: 0, b: 'OFF' }),
          o('Speed X', { v: 0, b: 'OFF' }),
          o('Speed Y', { v: 25, b: 'OFF' }),
        ],
        melded: true
      },
      {
        type: 'SPECTRAL_MAP',
        params: [
          o('Rainbow Density', { v: 10, b: 'OFF' }),
          o('Color Shift', { v: 0, b: 'OFF' }),
          o('Speed', { v: 15, b: 'OFF' }),
          o('Intensity', { v: 50, b: 'OFF' }),
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
          o('Freq X', { v: 35 }),
          o('Freq Y', { v: 35 }),
          o('Density', { v: 100 }),
          o('Jitter', { v: 100 }),
          o('Speed', { v: 80, b: 'SUB' }, { v: 50, b: 'OFF' }),
          o('Blend', { v: 100 }),
        ],
        melded: true
      },
      {
        type: 'TERRAIN_SPHERE',
        params: [
          o('Extrusion', { v: 50, b: 'SUB' }, { v: 10, b: 'OFF' }),
          o('Detail Level', { v: 20, b: 'OFF' }),
          o('Size', { v: 30, b: 'OFF' }, { v: 40, b: 'OFF' }),
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
          o('Color Shift', { v: 10, b: 'OFF' }),
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
        type: 'ORGANIC_NOISE',
        params: [
          o('Scale', { v: 25, b: 'OFF' }),
          o('Detail Level', { v: 100, b: 'OFF' }),
          o('Warp Amount', { v: 6, b: 'OFF' }),
          o('Warp Speed', { v: 50, m: 0, b: 'SUB' }, { v: 25, b: 'OFF' }),
          o('Warp Direction', { v: 0, b: 'OFF' }),
          o('Blend', { v: 100, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'TERRAIN_SPHERE',
        params: [
          o('Extrusion', { v: 3, b: 'OFF' }),
          o('Detail Level', { v: 100, b: 'OFF' }),
          o('Size', { v: 40, b: 'OFF' }, { v: 50, b: 'OFF' }),
          o('Offset X', { v: 0, b: 'OFF' }),
          o('Offset Y', { v: 0, b: 'OFF' }),
          o('Offset Z', { v: 0, b: 'OFF' }),
          o('Spin Speed X', { v: 0, b: 'OFF' }),
          o('Spin Speed Y', { v: 0, b: 'OFF' }),
          o('Spin Speed Z', { v: 0, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'HUE_ROTATION',
        params: [
          o('Color Shift', { v: 0, b: 'OFF' }),
          o('Speed', { v: 25, b: 'OFF' }),
          o('Vibrance', { v: 25, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'GLOW',
        params: [
          o('Sensitivity', { v: 0, b: 'OFF' }),
          o('Distance', { v: 50, b: 'OFF' }),
          o('Strength', { v: 50, b: 'OFF' }),
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
          o('Freq X', { v: 30 }),
          o('Freq Y', { v: 30 }),
          o('Density', { v: 36, b: 'OFF' }),
          o('Roundness', { v: 0 }),
          o('Blend', { v: 100 }),
          o('Scale X', { v: 50 }),
          o('Scale Y', { v: 50 }),
          o('Pan X', { v: 50 }),
          o('Pan Y', { v: 50 }),
          o('Rotation', { v: 0 }),
        ],
        melded: false
      },
      {
        type: 'HUE_ROTATION',
        params: [
          o('Color Shift', { v: 0, b: 'OFF' }),
          o('Speed', { v: 25, b: 'OFF' }),
          o('Vibrance', { v: 73, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'TUNNEL_WARP',
        params: [
          o('Scale', { v: 5, b: 'OFF' }),
          o('Speed', { v: 75, m: 0, b: 'MID' }, { v: 15, b: 'OFF' }),
          o('Twist', { v: 12, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  ARCS: {
    id: 'ARCS',
    label: 'Arcs',
    requiredPuzzleCompletedToUnlock: 'ARCS',
    effects: [
      {
        type: 'GRAIN',
        params: [
          o('Width', { v: 100 }),
          o('Height', { v: 100 }),
          o('Freq X', { v: 15 }),
          o('Freq Y', { v: 75 }),
          o('Density', { v: 10, b: 'OFF' }),
          o('Roundness', { v: 0 }),
          o('Blend', { v: 100 }),
          o('Scale X', { v: 50 }),
          o('Scale Y', { v: 50 }),
          o('Pan X', { v: 50 }),
          o('Pan Y', { v: 50 }),
          o('Rotation', { v: 0 }),
        ],
        melded: false
      },
      {
        type: 'HUE_ROTATION',
        params: [
          o('Color Shift', { v: 0, b: 'OFF' }),
          o('Speed', { v: 25, b: 'SUB' }, { v: 5, b: 'OFF' }),
          o('Vibrance', { v: 100, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'GLOW',
        params: [
          o('Sensitivity', { v: 0, b: 'OFF' }),
          o('Distance', { v: 5, b: 'OFF' }),
          o('Strength', { v: 100, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'TUNNEL_WARP',
        params: [
          o('Scale', { v: 2, b: 'OFF' }),
          o('Speed', { v: 25, m: 0, b: 'SUB' }, { v: 5, b: 'OFF' }),
          o('Twist', { v: 0, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  GRAIN_TUNNEL: {
    id: 'GRAIN_TUNNEL',
    label: 'Grain Tunnel',
    requiredPuzzleCompletedToUnlock: 'GRAIN_TUNNEL',
    effects: [
      {
        type: 'GRAIN',
        params: [
          o('Width', { v: 100 }),
          o('Height', { v: 100 }),
          o('Freq X', { v: 20 }),
          o('Freq Y', { v: 20 }),
          o('Density', { v: 100, b: 'OFF' }),
          o('Roundness', { v: 0 }),
          o('Blend', { v: 100 }),
          o('Scale X', { v: 50 }),
          o('Scale Y', { v: 50 }),
          o('Pan X', { v: 50 }),
          o('Pan Y', { v: 50 }),
          o('Rotation', { v: 0 }),
        ],
        melded: false
      },
      {
        type: 'HUE_ROTATION',
        params: [
          o('Color Shift', { v: 0, b: 'OFF' }),
          o('Speed', { v: 5, b: 'OFF' }),
          o('Vibrance', { v: 73, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'TUNNEL_WARP',
        params: [
          o('Scale', { v: 6, b: 'OFF' }),
          o('Speed', { v: 75, m: 0, b: 'SUB' }, { v: 15, b: 'OFF' }),
          o('Twist', { v: 0, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  LIGHT_TUNNEL: {
    id: 'LIGHT_TUNNEL',
    label: 'Light Tunnel',
    requiredPuzzleCompletedToUnlock: 'GRAIN_TUNNEL',
    effects: [
      {
        type: 'CELLULAR_NOISE',
        params: [
          o('Cell Width', { v: 100 }),
          o('Cell Height', { v: 100 }),
          o('Freq X', { v: 88 }),
          o('Freq Y', { v: 55 }),
          o('Density', { v: 24 }),
          o('Jitter', { v: 0 }),
          o('Speed', { v: 0, b: 'OFF' }),
          o('Blend', { v: 100 }),
        ],
        melded: false
      },
      {
        type: 'HUE_ROTATION',
        params: [
          o('Color Shift', { v: 10, b: 'OFF' }),
          o('Speed', { v: 25, b: 'OFF' }),
          o('Vibrance', { v: 50, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'GLOW',
        params: [
          o('Sensitivity', { v: 0, b: 'OFF' }),
          o('Distance', { v: 50, b: 'OFF' }),
          o('Strength', { v: 100, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'TUNNEL_WARP',
        params: [
          o('Scale', { v: 1, b: 'OFF' }),
          o('Speed', { v: 30, m: 0, b: 'SUB' }, { v: 10, b: 'OFF' }),
          o('Twist', { v: 0, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  CLOUDS: {
    id: 'CLOUDS',
    label: 'Clouds',
    requiredPuzzleCompletedToUnlock: 'STORM',
    effects: [
      {
        type: 'CELLULAR_NOISE',
        params: [
          o('Cell Width', { v: 30 }),
          o('Cell Height', { v: 50 }),
          o('Freq X', { v: 10 }),
          o('Freq Y', { v: 30 }),
          o('Density', { v: 100 }),
          o('Jitter', { v: 100 }),
          o('Speed', { v: 5, b: 'OFF' }),
          o('Blend', { v: 100 }),
        ],
        melded: false
      },
      {
        type: 'ORGANIC_NOISE',
        params: [
          o('Scale', { v: 100, b: 'OFF' }),
          o('Detail Level', { v: 100, b: 'OFF' }),
          o('Warp Amount', { v: 0, b: 'OFF' }),
          o('Warp Speed', { v: 0, b: 'OFF' }),
          o('Warp Direction', { v: 0, b: 'OFF' }),
          o('Blend', { v: 50, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'LUMINANCE_MASK',
        params: [
          o('Threshold', { v: 30, b: 'OFF' }),
          o('Feather', { v: 30, b: 'OFF' }),
          o('Invert', { v: 0, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'INFINITE_ZOOM',
        params: [
          o('Speed', { v: 40, m: 0, b: 'SUB' }, { v: 5, m: 0, b: 'OFF' }),
          o('Depth', { v: 40, b: 'OFF' }),
          o('Spacing', { v: 25, b: 'OFF' }),
          o('Plane Count', { v: 3, b: 'OFF' }),
          o('Edge Feather', { v: 70, b: 'OFF' }),
          o('Zoom Fade', { v: 50, b: 'OFF' }),
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
          o('Freq X', { v: 68 }),
          o('Freq Y', { v: 60 }),
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
          o('Freq X', { v: 6, b: 'OFF' }),
          o('Freq Y', { v: 6, b: 'OFF' }),
          o('Feather', { v: 0, b: 'OFF' }),
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
          o('Zoom Fade', { v: 100, b: 'OFF' }),
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
          o('Cell Width', { v: 30, m: 3, b: 'SUB' }, { v: 10, b: 'OFF' }),
          o('Cell Height', { v: 30, m: 3, b: 'SUB' }, { v: 10, b: 'OFF' }),
          o('Freq X', { v: 40 }),
          o('Freq Y', { v: 40 }),
          o('Density', { v: 100 }),
          o('Jitter', { v: 100, b: 'SUB' }, { v: 75, b: 'OFF' }),
          o('Speed', { v: 70, b: 'SUB' }, { v: 15, b: 'OFF' }),
          o('Blend', { v: 100 }),
        ],
        melded: false
      },
      {
        type: 'LUMINANCE_MASK',
        params: [
          o('Threshold', { v: 10, b: 'OFF' }),
          o('Feather', { v: 35, b: 'OFF' }),
          o('Invert', { v: 0, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'HUE_ROTATION',
        params: [
          o('Color Shift', { v: 30, b: 'OFF' }),
          o('Speed', { v: 10, b: 'OFF' }),
          o('Vibrance', { v: 50, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'INFINITE_ZOOM',
        params: [
          o('Speed', { v: 30, b: 'SUB' }, { v: 5, b: 'OFF' }),
          o('Depth', { v: 10, b: 'OFF' }),
          o('Spacing', { v: 70, b: 'OFF' }),
          o('Plane Count', { v: 30, b: 'OFF' }),
          o('Edge Feather', { v: 70, b: 'OFF' }),
          o('Zoom Fade', { v: 50, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  CELLULAR_MATRIX: {
    id: 'CELLULAR_MATRIX',
    label: 'Cellular Matrix',
    requiredPuzzleCompletedToUnlock: 'RUSH_HOUR',
    effects: [
      {
        type: 'CELLULAR_NOISE',
        params: [
          o('Cell Width', { v: 50 }),
          o('Cell Height', { v: 50 }),
          o('Freq X', { v: 30 }),
          o('Freq Y', { v: 30 }),
          o('Density', { v: 100 }),
          o('Jitter', { v: 100 }),
          o('Speed', { v: 30, b: 'SUB' }, { v: 15, b: 'OFF' }),
          o('Blend', { v: 100 }),
        ],
        melded: false
      },
      {
        type: 'EDGE_MASK',
        params: [
          o('Sensitivity', { v: 5, b: 'OFF' }),
          o('Thickness', { v: 0, b: 'OFF' }),
          o('Invert', { v: 100, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'INVERT',
        params: [
          o('Inversion', { v: 100, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'HUE_ROTATION',
        params: [
          o('Color Shift', { v: 10, b: 'OFF' }),
          o('Speed', { v: 10, b: 'OFF' }),
          o('Vibrance', { v: 100, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'INFINITE_ZOOM',
        params: [
          o('Speed', { v: 100, b: 'SUB' }, { v: 15, b: 'OFF' }),
          o('Depth', { v: 8, b: 'OFF' }),
          o('Spacing', { v: 40, b: 'OFF' }),
          o('Plane Count', { v: 100, b: 'OFF' }),
          o('Edge Feather', { v: 70, b: 'OFF' }),
          o('Zoom Fade', { v: 100, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  SMOKE: {
    id: 'SMOKE',
    label: 'Smoke',
    requiredPuzzleCompletedToUnlock: 'RUSH_HOUR',
    effects: [
      {
        type: 'ORGANIC_NOISE',
        params: [
          o('Scale', { v: 30 }),
          o('Detail Level', { v: 100 }),
          o('Warp Amount', { v: 2 }),
          o('Warp Speed', { v: 50, b: 'SUB' }, { v: 10, b: 'OFF' }),
          o('Warp Direction', { v: 75, b: 'OFF' }),
          o('Blend', { v: 100 }),
        ],
        melded: false
      },
      {
        type: 'LUMINANCE_MASK',
        params: [
          o('Threshold', { v: 60, b: 'OFF' }),
          o('Feather', { v: 50, b: 'OFF' }),
          o('Invert', { v: 0, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'INFINITE_ZOOM',
        params: [
          o('Speed', { v: 25, b: 'SUB' }, { v: 10, b: 'OFF' }),
          o('Depth', { v: 50, b: 'OFF' }),
          o('Spacing', { v: 25, b: 'OFF' }),
          o('Plane Count', { v: 3, b: 'OFF' }),
          o('Edge Feather', { v: 20, b: 'OFF' }),
          o('Zoom Fade', { v: 50, b: 'OFF' }),
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
          o('Freq X', { v: 60 }),
          o('Freq Y', { v: 50 }),
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
          o('Overlap X', { v: 0, b: 'OFF' }),
          o('Overlap Y', { v: 0, b: 'OFF' }),
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
          o('Zoom Fade', { v: 0, b: 'OFF' }),
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
          o('Speed', { v: 70, b: 'SUB' }, { v: 20, b: 'OFF' }),
          o('Pan X', { v: 50 }),
          o('Pan Y', { v: 50 }),
        ],
        melded: false
      },
      {
        type: 'ORGANIC_NOISE',
        params: [
          o('Scale', { v: 50 }),
          o('Detail Level', { v: 100 }),
          o('Warp Amount', { v: 1 }),
          o('Warp Speed', { v: 75, m: 0, b: 'SUB' }, { v: 40, b: 'OFF' }),
          o('Warp Direction', { v: 0, b: 'OFF' }),
          o('Blend', { v: 50 }),
        ],
        melded: false
      },
      {
        type: 'TERRAIN',
        params: [
          o('Extrusion', { v: 15, m: 1, b: 'SUB' }, { v: 10, b: 'OFF' }),
          o('Detail Level', { v: 100, b: 'OFF' }),
          o('Tile Width', { v: 100, b: 'OFF' }),
          o('Tile Height', { v: 100, b: 'OFF' }),
          o('Rotate X', { v: 0, b: 'OFF' }),
          o('Rotate Y', { v: 0, b: 'OFF' }),
          o('Rotate Z', { v: 0, b: 'OFF' }),
          o('Elevation', { v: 50, b: 'OFF' }),
          o('Distance', { v: 50, b: 'OFF' }),
          o('Tile Blend', { v: 0, b: 'OFF' }),
          o('Speed X', { v: 0, b: 'OFF' }),
          o('Speed Y', { v: 0, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'RGBA',
        params: [
          o('Red', { v: 50, b: 'OFF' }),
          o('Green', { v: 90, b: 'OFF' }),
          o('Blue', { v: 100, b: 'OFF' }),
          o('Opacity', { v: 100, b: 'OFF' }),
        ],
        melded: false
      },
    ]
  },
  CORRIDOR: {
    id: 'CORRIDOR',
    label: 'Corridor',
    effects: [
      {
        type: 'SHAPE',
        params: [
          o('Side Count', { v: 4, b: 'OFF' }),
          o('Pointiness', { v: 0, b: 'OFF' }),
          o('Roundness', { v: 0, b: 'OFF' }),
          o('Feather', { v: 0, b: 'OFF' }),
          o('Blend', { v: 100, b: 'OFF' }),
          o('Scale X', { v: 30, b: 'OFF' }),
          o('Scale Y', { v: 50, b: 'OFF' }),
          o('Pan X', { v: 32, b: 'OFF' }),
          o('Pan Y', { v: 50, b: 'OFF' }),
          o('Rotation', { v: 0, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'SHAPE',
        params: [
          o('Side Count', { v: 4, b: 'OFF' }),
          o('Pointiness', { v: 0, b: 'OFF' }),
          o('Roundness', { v: 0, b: 'OFF' }),
          o('Feather', { v: 0, b: 'OFF' }),
          o('Blend', { v: 100, b: 'OFF' }),
          o('Scale X', { v: 30, b: 'OFF' }),
          o('Scale Y', { v: 50, b: 'OFF' }),
          o('Pan X', { v: 68, b: 'OFF' }),
          o('Pan Y', { v: 50, b: 'OFF' }),
          o('Rotation', { v: 0, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'GLOW',
        params: [
          o('Sensitivity', { v: 0, b: 'OFF' }),
          o('Distance', { v: 5, b: 'OFF' }),
          o('Strength', { v: 100, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'INFINITE_ZOOM',
        params: [
          o('Speed', { v: 50, b: 'SUB' }, { v: 10, b: 'OFF' }),
          o('Depth', { v: 22 }),
          o('Spacing', { v: 17 }),
          o('Plane Count', { v: 100 }),
          o('Edge Feather', { v: 100 }),
          o('Zoom Fade', { v: 0 }),
        ],
        melded: false
      }
    ]
  },
  SQUARE_RIPPLES: {
    id: 'SQUARE_RIPPLES',
    label: 'Square Ripples',
    requiredPuzzleCompletedToUnlock: 'SQUARE_RIPPLES',
    effects: [
      {
        type: 'RADIAL_GRADIENT',
        params: [
          o('Feather', { v: 30 }),
          o('Frequency', { v: 30 }),
          o('Speed', { v: 70, b: 'SUB' }, { v: 15, b: 'OFF' }),
          o('Pan X', { v: 50 }),
          o('Pan Y', { v: 50 }),
        ],
        melded: false
      },
      {
        type: 'BIT_CRUSH',
        params: [
          o('Block Size', { v: 40, b: 'OFF' }),
          o('Posterize', { v: 0, b: 'OFF' }),
          o('Noise', { v: 0, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'TERRAIN',
        params: [
          o('Extrusion', { v: 15, m: 1, b: 'SUB' }, { v: 5, b: 'OFF' }),
          o('Detail Level', { v: 100, b: 'OFF' }),
          o('Tile Width', { v: 100, b: 'OFF' }),
          o('Tile Height', { v: 100, b: 'OFF' }),
          o('Rotate X', { v: 0, b: 'OFF' }),
          o('Rotate Y', { v: 0, b: 'OFF' }),
          o('Rotate Z', { v: 0, b: 'OFF' }),
          o('Elevation', { v: 50, b: 'OFF' }),
          o('Distance', { v: 50, b: 'OFF' }),
          o('Tile Blend', { v: 0, b: 'OFF' }),
          o('Speed X', { v: 0, b: 'OFF' }),
          o('Speed Y', { v: 0, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'RGBA',
        params: [
          o('Red', { v: 50, b: 'OFF' }),
          o('Green', { v: 90, b: 'OFF' }),
          o('Blue', { v: 100, b: 'OFF' }),
          o('Opacity', { v: 100, b: 'OFF' }),
        ],
        melded: false
      },
    ]
  },
  ANGULAR: {
    id: 'ANGULAR',
    label: 'Angular',
    effects: [
      {
        type: 'RADIAL_GRADIENT',
        params: [
          o('Feather', { v: 3 }),
          o('Frequency', { v: 50 }),
          o('Speed', { v: 3, m: 1, b: 'SUB' }, { v: 2, b: 'OFF' }),
          o('Pan X', { v: 50 }),
          o('Pan Y', { v: 50 }),
        ],
        melded: false
      },
      {
        type: 'TRI_CRUSH',
        params: [
          o('Width', { v: 46, m: 0, b: 'OFF' }),
          o('Height', { v: 33, m: 0, b: 'OFF' }),
          o('Shear', { v: 50, m: 0, b: 'OFF' }),
          o('Posterize', { v: 0, m: 0, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'GLOW',
        params: [
          o('Sensitivity', { v: 0, b: 'OFF' }),
          o('Distance', { v: 15, b: 'OFF' }),
          o('Strength', { v: 100, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'INFINITE_ZOOM',
        params: [
          o('Speed', { v: 50, m: 0, b: 'SUB' }, { v: 10, b: 'OFF' }),
          o('Depth', { v: 0, b: 'OFF' }),
          o('Spacing', { v: 100, b: 'OFF' }),
          o('Plane Count', { v: 20, b: 'OFF' }),
          o('Edge Feather', { v: 79, b: 'OFF' }),
          o('Zoom Fade', { v: 100, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  SEARCHLIGHTS: {
    id: 'SEARCHLIGHTS',
    label: 'Searchlights',
    requiredPuzzleCompletedToUnlock: 'SEARCHLIGHTS',
    effects: [
      {
        type: 'SPIRAL_GRADIENT',
        params: [
          o('Feather', { v: 50 }),
          o('Frequency', { v: 2 }),
          o('Twist', { v: 0, b: 'OFF' }),
          o('Speed', { v: 60, m: 0, b: 'SUB' }, { v: 10, b: 'OFF' }),
          o('Pan X', { v: 50 }),
          o('Pan Y', { v: 50 }),
        ],
        melded: false
      },
      {
        type: 'SCROLL',
        params: [
          o('Left Speed', { v: 0, b: 'OFF' }),
          o('Right Speed', { v: 30, b: 'SUB' }),
          o('Up Speed', { v: 0, b: 'OFF' }),
          o('Down Speed', { v: 0, b: 'OFF' }),
          o('Overlap X', { v: 100, b: 'OFF' }),
          o('Overlap Y', { v: 100, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'SPECTRAL_MAP',
        params: [
          o('Rainbow Density', { v: 10, b: 'OFF' }),
          o('Color Shift', { v: 0, b: 'OFF' }),
          o('Speed', { v: 15, b: 'OFF' }),
          o('Intensity', { v: 100, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'GLOW',
        params: [
          o('Sensitivity', { v: 0, b: 'OFF' }),
          o('Distance', { v: 0, b: 'OFF' }),
          o('Strength', { v: 30, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  WAXY_STARS: {
    id: 'WAXY_STARS',
    label: 'Waxy Stars',
    requiredPuzzleCompletedToUnlock: 'WAXY_STARS',
    effects: [
      {
        type: 'SHAPE',
        params: [
          o('Side Count', { v: 5, b: 'OFF' }),
          o('Pointiness', { v: 36, b: 'OFF' }),
          o('Roundness', { v: 0, b: 'OFF' }),
          o('Feather', { v: 100, b: 'OFF' }),
          o('Blend', { v: 100, b: 'OFF' }),
          o('Scale X', { v: 26, m: 9, b: 'SUB' }, { v: 25, b: 'SUB' }),
          o('Scale Y', { v: 32, m: 11, b: 'SUB' }, { v: 25, b: 'SUB' }),
          o('Pan X', { v: 50, b: 'OFF' }),
          o('Pan Y', { v: 50, b: 'OFF' }),
          o('Rotation', { v: 0, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'TILE',
        params: [
          o('Scale X', { v: 10, b: 'OFF' }),
          o('Scale Y', { v: 13, b: 'OFF' }),
          o('Pan X', { v: 50, b: 'OFF' }),
          o('Pan Y', { v: 50, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'SPECTRAL_MAP',
        params: [
          o('Rainbow Density', { v: 5, b: 'OFF' }),
          o('Color Shift', { v: 0, b: 'OFF' }),
          o('Speed', { v: 25, b: 'OFF' }),
          o('Intensity', { v: 50, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'TERRAIN',
        params: [
          o('Extrusion', { v: 8, b: 'OFF' }),
          o('Detail Level', { v: 100, b: 'OFF' }),
          o('Tile Width', { v: 100, b: 'OFF' }),
          o('Tile Height', { v: 100, b: 'OFF' }),
          o('Rotate X', { v: 5, b: 'OFF' }),
          o('Rotate Y', { v: 12, b: 'OFF' }),
          o('Rotate Z', { v: 0, b: 'OFF' }),
          o('Elevation', { v: 50, b: 'OFF' }),
          o('Distance', { v: 50, b: 'OFF' }),
          o('Tile Blend', { v: 10, b: 'OFF' }),
          o('Speed X', { v: 0, b: 'OFF' }),
          o('Speed Y', { v: 100, b: 'SUB' }, { v: 10, b: 'OFF' }),
        ],
        melded: false
      },
    ]
  },
  SPIRAL_GLOW: {
    id: 'SPIRAL_GLOW',
    label: 'Spiral Glow',
    requiredPuzzleCompletedToUnlock: 'SPIRAL_GLOW',
    effects: [
      {
        type: 'SPIRAL_GRADIENT',
        params: [
          o('Feather', { v: 25 }),
          o('Frequency', { v: 2 }),
          o('Twist', { v: 20, b: 'OFF' }),
          o('Speed', { v: 70, m: 3, b: 'SUB' }, { v: 30, b: 'OFF' }),
          o('Pan X', { v: 50 }),
          o('Pan Y', { v: 50 }),
        ],
        melded: false
      },
      {
        type: 'SPECTRAL_MAP',
        params: [
          o('Rainbow Density', { v: 0, b: 'OFF' }),
          o('Color Shift', { v: 0, b: 'OFF' }),
          o('Speed', { v: 13, b: 'OFF' }),
          o('Intensity', { v: 100, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'GLOW',
        params: [
          o('Sensitivity', { v: 0, b: 'OFF' }),
          o('Distance', { v: 50, b: 'OFF' }),
          o('Strength', { v: 100, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  RUSH_HOUR: {
    id: 'RUSH_HOUR',
    label: 'Rush Hour',
    requiredPuzzleCompletedToUnlock: 'RUSH_HOUR',
    effects: [
      {
        type: 'GRAIN',
        params: [
          o('Width', { v: 100 }),
          o('Height', { v: 100 }),
          o('Freq X', { v: 40 }),
          o('Freq Y', { v: 50 }),
          o('Density', { v: 30, b: 'OFF' }),
          o('Roundness', { v: 0 }),
          o('Blend', { v: 100 }),
          o('Scale X', { v: 50 }),
          o('Scale Y', { v: 50 }),
          o('Pan X', { v: 50 }),
          o('Pan Y', { v: 50 }),
          o('Rotation', { v: 0 }),
        ],
        melded: false
      },
      {
        type: 'HUE_ROTATION',
        params: [
          o('Color Shift', { v: 10, b: 'OFF' }),
          o('Speed', { v: 15, b: 'OFF' }),
          o('Vibrance', { v: 73, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'GLOW',
        params: [
          o('Sensitivity', { v: 0, b: 'OFF' }),
          o('Distance', { v: 20, b: 'OFF' }),
          o('Strength', { v: 100, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'SCROLL',
        params: [
          o('Left Speed', { v: 0, b: 'OFF' }),
          o('Right Speed', { v: 15, b: 'SUB' }, { v: 10, b: 'OFF' }),
          o('Up Speed', { v: 0, b: 'OFF' }),
          o('Down Speed', { v: 0, b: 'OFF' }),
          o('Overlap X', { v: 0, b: 'OFF' }),
          o('Overlap Y', { v: 0, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'INFINITE_ZOOM',
        params: [
          o('Speed', { v: 0, b: 'OFF' }),
          o('Depth', { v: 15, b: 'OFF' }),
          o('Spacing', { v: 15, b: 'OFF' }),
          o('Plane Count', { v: 5, b: 'OFF' }),
          o('Edge Feather', { v: 100, b: 'OFF' }),
          o('Zoom Fade', { v: 0, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  STEEL_LATTICE: {
    id: 'STEEL_LATTICE',
    label: 'Steel Lattice',
    effects: [
      {
        type: 'CELLULAR_NOISE',
        params: [
          o('Cell Width', { v: 50 }),
          o('Cell Height', { v: 100 }),
          o('Freq X', { v: 7 }),
          o('Freq Y', { v: 7 }),
          o('Density', { v: 100 }),
          o('Jitter', { v: 100 }),
          o('Speed', { v: 0, b: 'OFF' }),
          o('Blend', { v: 100 }),
        ],
        melded: false
      },
      {
        type: 'CHANNEL_SHIFT',
        params: [
          o('Offset', { v: 15, b: 'OFF' }),
          o('Vertical Tear', { v: 15, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'TRI_CRUSH',
        params: [
          o('Width', { v: 48, b: 'OFF' }),
          o('Height', { v: 37, b: 'OFF' }),
          o('Shear', { v: 50, b: 'OFF' }),
          o('Posterize', { v: 0, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'EDGE_MASK',
        params: [
          o('Sensitivity', { v: 9, b: 'OFF' }),
          o('Thickness', { v: 5, b: 'OFF' }),
          o('Invert', { v: 0, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'INFINITE_ZOOM',
        params: [
          o('Speed', { v: 20, b: 'SUB' }, { v: 2, b: 'OFF' }),
          o('Depth', { v: 0, b: 'OFF' }),
          o('Spacing', { v: 100, b: 'OFF' }),
          o('Plane Count', { v: 100, b: 'OFF' }),
          o('Edge Feather', { v: 30, b: 'OFF' }),
          o('Zoom Fade', { v: 100, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  CRYSTAL_RAIN: {
    id: 'CRYSTAL_RAIN',
    label: 'Crystal Rain',
    effects: [
      {
        type: 'CELLULAR_NOISE',
        params: [
          o('Cell Width', { v: 60 }),
          o('Cell Height', { v: 100 }),
          o('Freq X', { v: 60 }, { v: 50 }),
          o('Freq Y', { v: 60 }, { v: 50 }),
          o('Density', { v: 38 }),
          o('Jitter', { v: 100 }),
          o('Speed', { v: 0, b: 'OFF' }),
          o('Blend', { v: 100 }),
        ],
        melded: false
      },
      {
        type: 'TRI_CRUSH',
        params: [
          o('Width', { v: 8, b: 'OFF' }, { v: 20, b: 'OFF' }),
          o('Height', { v: 8, b: 'OFF' }, { v: 20, b: 'OFF' }),
          o('Shear', { v: 50, b: 'OFF' }),
          o('Posterize', { v: 0, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'SCROLL',
        params: [
          o('Left Speed', { v: 0, b: 'OFF' }),
          o('Right Speed', { v: 0, b: 'OFF' }),
          o('Up Speed', { v: 0, b: 'OFF' }),
          o('Down Speed', { v: 20, b: 'SUB' }, { v: 10, b: 'OFF' }),
          o('Overlap X', { v: 0, b: 'OFF' }),
          o('Overlap Y', { v: 10, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'INFINITE_ZOOM',
        params: [
          o('Speed', { v: 0, b: 'OFF' }),
          o('Depth', { v: 0, b: 'OFF' }),
          o('Spacing', { v: 100, b: 'OFF' }),
          o('Plane Count', { v: 100, b: 'OFF' }),
          o('Edge Feather', { v: 0, b: 'OFF' }),
          o('Zoom Fade', { v: 100, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'GLOW',
        params: [
          o('Sensitivity', { v: 70, b: 'OFF' }),
          o('Distance', { v: 50, b: 'OFF' }),
          o('Strength', { v: 50, b: 'OFF' }),
        ],
        melded: false
      },
    ]
  },
  STORM: {
    id: 'STORM',
    label: 'Storm',
    requiredPuzzleCompletedToUnlock: 'STORM',
    effects: [
      {
        type: 'ORGANIC_NOISE',
        params: [
          o('Scale', { v: 60 }),
          o('Detail Level', { v: 100 }),
          o('Warp Amount', { v: 1 }),
          o('Warp Speed', { v: 75, b: 'SUB' }, { v: 15, b: 'OFF' }),
          o('Warp Direction', { v: 0, b: 'OFF' }),
          o('Blend', { v: 100 }),
        ],
        melded: false
      },
      {
        type: 'SPIRAL_GRADIENT',
        params: [
          o('Feather', { v: 50 }),
          o('Frequency', { v: 3 }),
          o('Twist', { v: 50, b: 'OFF' }),
          o('Speed', { v: 63, m: 20, b: 'SUB' }, { v: 30, b: 'OFF' }),
          o('Pan X', { v: 50 }),
          o('Pan Y', { v: 50 }),
        ],
        melded: false
      },
      {
        type: 'TERRAIN',
        params: [
          o('Extrusion', { v: 7, m: 3, b: 'SUB' }, { v: 5, b: 'OFF' }),
          o('Detail Level', { v: 100, b: 'OFF' }),
          o('Tile Width', { v: 100, b: 'OFF' }),
          o('Tile Height', { v: 100, b: 'OFF' }),
          o('Rotate X', { v: 98, b: 'OFF' }),
          o('Rotate Y', { v: 0, b: 'OFF' }),
          o('Rotate Z', { v: 0, b: 'OFF' }),
          o('Elevation', { v: 50, b: 'OFF' }),
          o('Distance', { v: 50, b: 'OFF' }),
          o('Tile Blend', { v: 0, b: 'OFF' }),
          o('Speed X', { v: 0, b: 'OFF' }),
          o('Speed Y', { v: 0, b: 'OFF' }),
        ],
        melded: false
      },
    ]
  },
  TEETH: {
    id: 'TEETH',
    label: 'Teeth',
    requiredPuzzleCompletedToUnlock: 'TEETH',
    effects: [
      {
        type: 'CELLULAR_NOISE',
        params: [
          o('Cell Width', { v: 30 }),
          o('Cell Height', { v: 30 }),
          o('Freq X', { v: 10 }),
          o('Freq Y', { v: 10 }),
          o('Density', { v: 100 }),
          o('Jitter', { v: 100 }),
          o('Speed', { v: 50, b: 'SUB' }, { v: 10, b: 'OFF' }),
          o('Blend', { v: 100 }),
        ],
        melded: false
      },
      {
        type: 'TERRAIN',
        params: [
          o('Extrusion', { v: 12, m: 1, b: 'SUB' }),
          o('Detail Level', { v: 100, b: 'OFF' }),
          o('Tile Width', { v: 100, b: 'OFF' }),
          o('Tile Height', { v: 100, b: 'OFF' }),
          o('Rotate X', { v: 0, b: 'OFF' }),
          o('Rotate Y', { v: 0, b: 'OFF' }),
          o('Rotate Z', { v: 0, b: 'OFF' }),
          o('Elevation', { v: 50, b: 'OFF' }),
          o('Distance', { v: 50, b: 'OFF' }),
          o('Tile Blend', { v: 0, b: 'OFF' }),
          o('Speed X', { v: 0, b: 'OFF' }),
          o('Speed Y', { v: 0, b: 'OFF' }),
        ],
        melded: false
      },
    ]
  },
  HEXAGON_TUNNEL: {
    id: 'HEXAGON_TUNNEL',
    label: 'Hexagon Tunnel',
    effects: [
      {
        type: 'GRAIN',
        params: [
          o('Width', { v: 100 }),
          o('Height', { v: 100 }),
          o('Freq X', { v: 50 }),
          o('Freq Y', { v: 50 }),
          o('Density', { v: 100, b: 'OFF' }),
          o('Roundness', { v: 0 }),
          o('Blend', { v: 100 }),
          o('Scale X', { v: 50 }),
          o('Scale Y', { v: 50 }),
          o('Pan X', { v: 50 }),
          o('Pan Y', { v: 50 }),
          o('Rotation', { v: 0 }),
        ],
        melded: false
      },
      {
        type: 'HEX_CRUSH',
        params: [
          o('Width', { v: 96, b: 'OFF' }),
          o('Height', { v: 59, b: 'OFF' }),
          o('Posterize', { v: 0 }),
        ],
        melded: false
      },
      {
        type: 'SPECTRAL_MAP',
        params: [
          o('Rainbow Density', { v: 6, b: 'OFF' }),
          o('Color Shift', { v: 0, b: 'OFF' }),
          o('Speed', { v: 10, b: 'OFF' }),
          o('Intensity', { v: 100, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'GLOW',
        params: [
          o('Sensitivity', { v: 0, b: 'OFF' }),
          o('Distance', { v: 37, b: 'OFF' }),
          o('Strength', { v: 100, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'TUNNEL_WARP',
        params: [
          o('Scale', { v: 20, b: 'OFF' }),
          o('Speed', { v: 100, m: 0, b: 'SUB' }, { v: 50, b: 'OFF' }),
          o('Twist', { v: 5, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  AURORA: {
    id: 'AURORA',
    label: 'Aurora',
    requiredPuzzleCompletedToUnlock: 'AURORA',
    effects: [
      {
        type: 'ORGANIC_NOISE',
        params: [
          o('Scale', { v: 5 }),
          o('Detail Level', { v: 50 }),
          o('Warp Amount', { v: 5 }),
          o('Warp Speed', { v: 50, m: 1, b: 'SUB' }, { v: 20, b: 'OFF' }),
          o('Warp Direction', { v: 12 }),
          o('Blend', { v: 100 }),
        ],
        melded: false
      },
      {
        type: 'SPECTRAL_MAP',
        params: [
          o('Rainbow Density', { v: 10, b: 'OFF' }),
          o('Color Shift', { v: 10, b: 'OFF' }),
          o('Speed', { v: 10, b: 'OFF' }),
          o('Intensity', { v: 60, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'GLOW',
        params: [
          o('Sensitivity', { v: 0, b: 'OFF' }),
          o('Distance', { v: 0, b: 'OFF' }),
          o('Strength', { v: 100, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  STARFIELD_3D: {
    id: 'STARFIELD_3D',
    label: '3D Starfield',
    effects: [
      {
        type: 'PARTICLES',
        params: [
          o('Count', { v: 10 }),
          o('Size', { v: 20 }),
          o('Spread', { v: 10 }),
          o('Drift', { v: 0 }),
          o('Drift Speed', { v: 0 }),
          o('Zoom Speed', { v: 50, b: 'SUB' }, { v: 5, b: 'OFF' }),
          o('Blend', { v: 100 }),
        ],
        melded: false
      }
    ]
  },
  FLAMES: {
    id: 'FLAMES',
    label: 'Flames',
    requiredPuzzleCompletedToUnlock: 'FLAMES',
    effects: [
      {
        type: 'ORGANIC_NOISE',
        params: [
          o('Scale', { v: 60 }),
          o('Detail Level', { v: 50 }),
          o('Warp Amount', { v: 1 }),
          o('Warp Speed', { v: 100, b: 'SUB' }, { v: 50, b: 'OFF' }),
          o('Warp Direction', { v: 75 }),
          o('Blend', { v: 100 }),
        ],
        melded: false
      },
      {
        type: 'PARTICLES',
        params: [
          o('Count', { v: 40 }),
          o('Size', { v: 30, m: 10, b: 'SUB' }),
          o('Spread', { v: 16 }),
          o('Drift', { v: 100 }),
          o('Drift Speed', { v: 100, b: 'SUB' }, { v: 50, b: 'OFF' }),
          o('Zoom Speed', { v: 0 }),
          o('Blend', { v: 100 }),
        ],
        melded: false
      },
      {
        type: 'RGBA',
        params: [
          o('Red', { v: 100, b: 'OFF' }),
          o('Green', { v: 50, b: 'OFF' }),
          o('Blue', { v: 0, b: 'OFF' }),
          o('Opacity', { v: 100, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'LUMINANCE_MASK',
        params: [
          o('Threshold', { v: 20, m: 50, b: 'SUB' }),
          o('Feather', { v: 10, b: 'OFF' }),
          o('Invert', { v: 0, b: 'OFF' }),
        ],
        melded: false
      },
      {
        type: 'GLOW',
        params: [
          o('Sensitivity', { v: 0, m: 30, b: 'SUB' }),
          o('Distance', { v: 0, b: 'OFF' }),
          o('Strength', { v: 100, b: 'OFF' }),
        ],
        melded: false
      }
    ]
  },
  FIRE_RING: {
    id: 'FIRE_RING',
    label: 'Fire Ring',
    effects: [
      {
        type: 'ORGANIC_NOISE',
        params: [
          o('Scale', { v: 30 }),
          o('Detail Level', { v: 100 }),
          o('Warp Amount', { v: 1 }),
          o('Warp Speed', { v: 100, b: 'SUB' }),
          o('Warp Direction', { v: 0 }),
          o('Blend', { v: 100 }),
        ],
        melded: false
      },
      {
        type: 'SPECTRAL_MAP',
        params: [
          o('Rainbow Density', { v: 22 }),
          o('Color Shift', { v: 38 }),
          o('Speed', { v: 0 }),
          o('Intensity', { v: 100 }),
        ],
        melded: false
      },
      {
        type: 'TERRAIN_RING',
        params: [
          o('Extrusion', { v: 0 }),
          o('Detail Level', { v: 100 }),
          o('Size', { v: 40 }),
          o('Offset X', { v: 0 }),
          o('Offset Y', { v: 0 }),
          o('Offset Z', { v: 0 }),
          o('Spin Speed X', { v: 30, b: 'SUB' }, { v: 15, b: 'OFF' }),
          o('Spin Speed Y', { v: 90, b: 'SUB' }, { v: 45, b: 'OFF' }),
          o('Spin Speed Z', { v: 0 }),
          o('Tube Width', { v: 30 }),
          o('Seam Blend', { v: 20 }),
        ],
        melded: false
      },
      {
        type: 'GLOW',
        params: [
          o('Sensitivity', { v: 25 }),
          o('Distance', { v: 3 }),
          o('Strength', { v: 100 }),
        ],
        melded: false
      }
    ]
  }
};
