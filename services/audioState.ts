/**
 * SHARED_AUDIO_STATE: A high-performance, zero-allocation "bucket" for audio reactivity.
 * 
 * Instead of updating React state or dispatching events (which creates new objects/strings 
 * every frame), we use a fixed-size Float32Array. 
 * 
 * 0: SUB
 * 1: BASS
 * 2: MID
 * 3: TREBLE
 * 
 * The AudioReactiveView loop writes to this array.
 * Each AdaptiveSlider reads from it via a local requestAnimationFrame loop.
 */
export const SHARED_AUDIO_STATE = new Float32Array(4);

export const BAND_INDEX = {
    'SUB': 0,
    'BASS': 1,
    'MID': 2,
    'TREBLE': 3,
    'OFF': -1
} as const;
