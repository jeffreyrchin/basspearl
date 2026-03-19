import { IntegratedReactivityMap } from './SpeedManager';
import { ReactivityState } from './calculateReactiveEffects';

/**
 * Global Audio Engine Singleton
 * Stores the "Heavy" Web Audio API data (Context, Buffers, FFT Maps)
 * and keeps them out of React state to ensure 60fps performance.
 */
export interface AudioEngine {
    context: AudioContext | null;
    buffer: AudioBuffer | null;
    source: AudioBufferSourceNode | null;
    analyser: AnalyserNode | null; // For Live Mode
    mediaStream: MediaStream | null; // For Live Mode
    startTime: number;
    offset: number;
    isPlaying: boolean;
    reactivityMap: {
        sub: Float32Array;
        bass: Float32Array;
        mid: Float32Array;
        treble: Float32Array;
    } | null;
    integratedReactivityMap: IntegratedReactivityMap | null;

    // Live State
    liveBuffers: {
        re: Float32Array;
        im: Float32Array;
        magnitudes: Float32Array;
        windowArray: Float32Array;
        timeData: Float32Array;
    } | null;
    liveState: ReactivityState;
    liveIntegrated: { sub: number, bass: number, mid: number, treble: number };
    lastLiveTime: number;
}

export const mainAudioEngine: AudioEngine = {
    context: null,
    buffer: null,
    source: null,
    analyser: null,
    mediaStream: null,
    startTime: 0,
    offset: 0,
    isPlaying: false,
    reactivityMap: null,
    integratedReactivityMap: null,
    liveBuffers: null,
    liveState: {
        baselines: { sub: null, bass: null, mid: null, treble: null },
        smoothed: { sub: 0, bass: 0, mid: 0, treble: 0 },
        prevBins: null
    },
    liveIntegrated: { sub: 0, bass: 0, mid: 0, treble: 0 },
    lastLiveTime: 0
};
