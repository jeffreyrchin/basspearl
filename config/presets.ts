import { EffectConfig } from '../types';

export interface Preset {
  id: string;
  label: string;
  image?: string;
  audio: string;
  effects: EffectConfig[];
}

export const PRESETS: Preset[] = [
  {
    id: 'sunset',
    label: '🌅',
    image: '/presets/sunset.jpeg',
    audio: '/presets/sampler testing 11_20_21.mp3',
    effects: [
      {
        id: 'sunset-starfield',
        type: 'STARFIELD',
        params: [
          { param: 'Density', value: 15, min: 0, frequencyBand: 'SUB' },
          { param: 'Speed', value: 100, min: 0, frequencyBand: 'SUB' },
        ],
        muted: false,
        soloed: false,
        seed: 0,
      },
      {
        id: 'sunset-shift',
        type: 'CHANNEL_SHIFT',
        params: [
          { param: 'Offset', value: 18, min: 0, frequencyBand: 'SUB' },
          { param: 'Vertical Tear', value: 0, min: 0, frequencyBand: 'SUB' },
        ],
        muted: false,
        soloed: false,
        seed: 1,
      },
      {
        id: 'sunset-zoom',
        type: 'SCALE',
        params: [
          { param: 'Width', value: 75, min: 50, frequencyBand: 'SUB' },
          { param: 'Height', value: 75, min: 50, frequencyBand: 'SUB' },
        ],
        muted: false,
        soloed: false,
        seed: 2,
      },
    ],
  },
  {
    id: 'underwater',
    label: '🌊',
    image: '/presets/underwater.png',
    audio: '/presets/1_17_22 new instrument.mp3',
    effects: [
      {
        id: 'underwater-crush',
        type: 'BIT_CRUSH',
        params: [
          { param: 'Quantize', value: 0, min: 0, frequencyBand: 'SUB' },
          { param: 'Resample', value: 27, min: 0, frequencyBand: 'SUB' },
        ],
        muted: false,
        soloed: false,
        seed: 0,
      },
      {
        id: 'underwater-mosh',
        type: 'DATA_CORRUPTION',
        params: [
          { param: 'Mosh Length', value: 11, min: 0, frequencyBand: 'SUB' },
          { param: 'Mosh Density', value: 100, min: 0, frequencyBand: 'SUB' },
        ],
        muted: false,
        soloed: false,
        seed: 2,
      },
      {
        id: 'underwater-hue',
        type: 'HUE_ROTATION',
        params: [
          { param: 'Phase Offset', value: 8, min: 0, frequencyBand: 'BASS' },
          { param: 'Speed', value: 0, min: 0, frequencyBand: 'BASS' },
          { param: 'Vibrance', value: 73, min: 0, frequencyBand: 'BASS' },
        ],
        muted: false,
        soloed: false,
        seed: 3,
      },
      {
        id: 'underwater-zoom',
        type: 'SCALE',
        params: [
          { param: 'Width', value: 100, min: 50, frequencyBand: 'SUB' },
          { param: 'Height', value: 100, min: 50, frequencyBand: 'SUB' },
        ],
        muted: false,
        soloed: false,
        seed: 4,
      },
    ],
  },
  {
    id: 'city',
    label: '🏙️',
    audio: '/presets/Repentance.mp3',
    effects: [
      {
        id: 'city-starfield',
        type: 'STARFIELD',
        params: [
          { param: 'Density', value: 40, min: 0, frequencyBand: 'OFF' },
          { param: 'Speed', value: 0, min: 0, frequencyBand: 'OFF' },
        ],
        muted: false,
        soloed: false,
        melded: true,
        seed: 0,
      },
      {
        id: 'city-tunnel-warp',
        type: 'TUNNEL_WARP',
        params: [
          { param: 'Scale', value: 30, min: 0, frequencyBand: 'OFF' },
          { param: 'Speed', value: 51, min: 0, frequencyBand: 'SUB' },
          { param: 'Twist', value: 23, min: 0, frequencyBand: 'OFF' },
        ],
        muted: false,
        soloed: false,
        melded: false,
        seed: 1,
      },
      {
        id: 'city-grid',
        type: 'GRID',
        params: [
          { param: 'Horizontal', value: 38, min: 0, frequencyBand: 'OFF' },
          { param: 'Vertical', value: 30, min: 0, frequencyBand: 'OFF' },
          { param: 'Thickness', value: 100, min: 0, frequencyBand: 'OFF' },
          { param: 'Feather', value: 0, min: 0, frequencyBand: 'OFF' },
        ],
        muted: false,
        soloed: false,
        melded: true,
        seed: 1,
      },
      {
        id: 'city-terrain',
        type: 'TERRAIN',
        params: [
          { param: 'Scale', value: 3, min: 0, frequencyBand: 'OFF' },
          { param: 'Extrusion', value: 0, min: 0, frequencyBand: 'OFF' },
          { param: 'Speed', value: 50, min: 0, frequencyBand: 'OFF' },
          { param: 'Resolution', value: 100, min: 0, frequencyBand: 'OFF' },
          { param: 'Rotate X', value: 0, min: 0, frequencyBand: 'OFF' },
          { param: 'Rotate Y', value: 0, min: 0, frequencyBand: 'OFF' },
          { param: 'Rotate Z', value: 0, min: 0, frequencyBand: 'OFF' },
          { param: 'Elevation', value: 50, min: 0, frequencyBand: 'OFF' },
          { param: 'Distance', value: 50, min: 0, frequencyBand: 'OFF' },
        ],
        muted: false,
        soloed: false,
        melded: true,
        seed: 2,
      },
      {
        id: 'city-luminance-map',
        type: 'LUMINANCE_MAP',
        params: [
          { param: 'Threshold', value: 100, min: 0, frequencyBand: 'OFF' },
          { param: 'Feather', value: 10, min: 0, frequencyBand: 'OFF' },
          { param: 'Tone', value: 0, min: 0, frequencyBand: 'OFF' },
          { param: 'Blend', value: 100, min: 0, frequencyBand: 'OFF' },
        ],
        muted: false,
        soloed: false,
        melded: false,
        seed: 3,
      },
      {
        id: 'city-grain',
        type: 'GRAIN',
        params: [
          { param: 'Width', value: 69, min: 0, frequencyBand: 'OFF' },
          { param: 'Height', value: 66, min: 0, frequencyBand: 'OFF' },
          { param: 'X-Freq', value: 50, min: 0, frequencyBand: 'OFF' },
          { param: 'Y-Freq', value: 46, min: 0, frequencyBand: 'OFF' },
          { param: 'Density', value: 100, min: 0, frequencyBand: 'OFF' },
          { param: 'Roundness', value: 0, min: 0, frequencyBand: 'OFF' },
          { param: 'Blend', value: 100, min: 0, frequencyBand: 'OFF' },
        ],
        muted: false,
        soloed: false,
        melded: true,
        seed: 4,
      },
      {
        id: 'city-terrain-2',
        type: 'TERRAIN',
        params: [
          { param: 'Scale', value: 3, min: 0, frequencyBand: 'OFF' },
          { param: 'Extrusion', value: 100, min: 31, frequencyBand: 'MID' },
          { param: 'Speed', value: 100, min: 0, frequencyBand: 'SUB' },
          { param: 'Resolution', value: 99, min: 0, frequencyBand: 'OFF' },
          { param: 'Rotate X', value: 0, min: 0, frequencyBand: 'OFF' },
          { param: 'Rotate Y', value: 0, min: 0, frequencyBand: 'OFF' },
          { param: 'Rotate Z', value: 0, min: 0, frequencyBand: 'OFF' },
          { param: 'Elevation', value: 47, min: 0, frequencyBand: 'OFF' },
          { param: 'Distance', value: 50, min: 0, frequencyBand: 'OFF' },
        ],
        muted: false,
        soloed: false,
        melded: true,
        seed: 5,
      },
      {
        id: 'city-edge-mask',
        type: 'EDGE_MASK',
        params: [
          { param: 'Sensitivity', value: 0, min: 0, frequencyBand: 'OFF' },
          { param: 'Thickness', value: 3, min: 0, frequencyBand: 'OFF' },
          { param: 'Invert', value: 0, min: 0, frequencyBand: 'OFF' },
        ],
        muted: false,
        soloed: false,
        melded: true,
        seed: 6,
      },
      {
        id: 'city-spectral',
        type: 'SPECTRAL_MAP',
        params: [
          { param: 'Resolution', value: 13, min: 0, frequencyBand: 'OFF' },
          { param: 'Phase Offset', value: 78, min: 0, frequencyBand: 'OFF' },
          { param: 'Speed', value: 0, min: 0, frequencyBand: 'OFF' },
          { param: 'Strength', value: 36, min: 0, frequencyBand: 'OFF' },

        ],
        muted: false,
        soloed: false,
        melded: false,
        seed: 7,
      },
    ],
  },
];
