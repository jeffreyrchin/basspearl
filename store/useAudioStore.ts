import { create } from 'zustand';
import { mainAudioEngine } from '../services/audioEngine';
import { analytics } from '../services/analytics';
import { analyzeAudioFrame } from '../services/audioMath';
import { computeIntegratedReactivity } from '../services/SpeedManager';
import { ReactivityState } from '../services/calculateReactiveEffects';
import { ChangeEvent } from 'react';

export interface AudioState {
    audioFile: File | null;
    isPlaying: boolean;
    isLiveMode: boolean;
    currentTime: number;
    duration: number;
    isProcessing: boolean;
    processingProgress: number;

    // Setters
    setAudioFile: (file: File | null) => void;
    setIsPlaying: (playing: boolean) => void;
    setIsLiveMode: (live: boolean) => void;
    setCurrentTime: (time: number) => void;
    setDuration: (duration: number) => void;
    setIsProcessing: (processing: boolean) => void;
    setProcessingProgress: (progress: number) => void;

    // Logic Actions
    getAudioContext: () => AudioContext;
    resetAudioEngine: () => void;
    stopPlayback: (resetTime?: boolean) => void;
    playAudio: (startOffset?: number, onStart?: () => void) => Promise<void>;
    togglePlay: (onStart?: () => void) => void;
    handleSeek: (e: ChangeEvent<HTMLInputElement> | { target: { value: string } }, onStart?: () => void) => void;
    getElapsedSeconds: () => number;
    loadAudioFromFile: (file: File) => Promise<void>;
    loadAudioFromUrl: (url: string, label: string) => Promise<void>;
    precomputeReactivity: (buffer: AudioBuffer, fps?: number) => Promise<any>;
    formatTime: (s: number) => string;

    // Live Mode
    startMic: () => Promise<void>;
    stopMic: () => void;
    getLiveReactivity: () => { smoothed: any, integrated: any } | null;
}

export const useAudioStore = create<AudioState>((set, get) => ({
    audioFile: null,
    isPlaying: false,
    isLiveMode: false,
    currentTime: 0,
    duration: 0,
    isProcessing: false,
    processingProgress: 0,

    setAudioFile: (file) => set({ audioFile: file }),
    setIsPlaying: (playing) => set({ isPlaying: playing }),
    setIsLiveMode: (live) => set({ isLiveMode: live }),
    setCurrentTime: (time) => set({ currentTime: time }),
    setDuration: (duration) => set({ duration: duration }),
    setIsProcessing: (processing) => set({ isProcessing: processing }),
    setProcessingProgress: (progress) => set({ processingProgress: progress }),

    getAudioContext: () => {
        if (!mainAudioEngine.context) {
            mainAudioEngine.context = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return mainAudioEngine.context;
    },

    resetAudioEngine: () => {
        if (mainAudioEngine.context) {
            mainAudioEngine.context.close();
            mainAudioEngine.context = null;
        }
        mainAudioEngine.buffer = null;
        mainAudioEngine.reactivityMap = null;
        mainAudioEngine.integratedReactivityMap = null;
    },

    stopPlayback: (resetTime = false) => {
        if (mainAudioEngine.source) {
            try {
                mainAudioEngine.source.onended = null;
                mainAudioEngine.source.stop();
            } catch (e) { }
            mainAudioEngine.source = null;
        }

        set({ isPlaying: false });
        mainAudioEngine.isPlaying = false;

        if (resetTime) {
            set({ currentTime: 0 });
            mainAudioEngine.offset = 0;
        }
    },

    playAudio: async (startOffset = 0, onStart) => {
        const { audioFile, getAudioContext, stopPlayback } = get();
        if (!audioFile || !mainAudioEngine.buffer) return;

        stopPlayback();

        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }

        const source = ctx.createBufferSource();
        source.buffer = mainAudioEngine.buffer;
        source.connect(ctx.destination);

        source.onended = () => {
            get().stopPlayback(true);
        };

        mainAudioEngine.source = source;
        source.start(0, startOffset);
        mainAudioEngine.startTime = ctx.currentTime;
        mainAudioEngine.offset = startOffset;

        set({ isPlaying: true });
        mainAudioEngine.isPlaying = true;

        if (onStart) onStart();
    },

    togglePlay: (onStart) => {
        const { isPlaying, getElapsedSeconds, stopPlayback, playAudio } = get();
        if (isPlaying) {
            // Pause: save current position
            const pausedAt = getElapsedSeconds();
            mainAudioEngine.offset = pausedAt;
            set({ currentTime: pausedAt, isPlaying: false }); // Update current time state for UI
            mainAudioEngine.isPlaying = false;
            stopPlayback();
        } else {
            playAudio(mainAudioEngine.offset, onStart); // Play/Resume from saved offset
        }
    },

    handleSeek: (e, onStart) => {
        const seekTo = parseFloat(e.target.value);
        mainAudioEngine.offset = seekTo;
        set({ currentTime: seekTo });

        if (mainAudioEngine.isPlaying) {
            get().playAudio(seekTo, onStart);
        }
    },

    getElapsedSeconds: () => {
        const ctx = mainAudioEngine.context;
        if (!ctx || !mainAudioEngine.isPlaying) return mainAudioEngine.offset;
        return mainAudioEngine.offset + (ctx.currentTime - mainAudioEngine.startTime);
    },

    precomputeReactivity: async (buffer, fps = 60) => {
        const { setProcessingProgress } = get(); // returns 0?
        const sampleRate = buffer.sampleRate;
        const channelData = buffer.getChannelData(0); // Analyze mono
        const totalFrames = Math.ceil(buffer.duration * fps);
        const fftSize = 2048;

        const map = {
            sub: new Float32Array(totalFrames),
            bass: new Float32Array(totalFrames),
            mid: new Float32Array(totalFrames),
            treble: new Float32Array(totalFrames)
        };

        let state: ReactivityState = {
            baselines: { sub: null, bass: null, mid: null, treble: null },
            smoothed: { sub: 0, bass: 0, mid: 0, treble: 0 },
            prevBins: new Float32Array(fftSize / 2).fill(0)
        };

        // Hann Window to reduce spectral leakage
        const window = new Float32Array(fftSize);
        for (let i = 0; i < fftSize; i++) {
            window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (fftSize - 1)));
        }

        const re = new Float32Array(fftSize);
        const im = new Float32Array(fftSize);
        const magnitudes = new Float32Array(fftSize / 2);
        const minDb = -100;
        const maxDb = -15;

        for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
            const centerSample = Math.floor((frameIndex / fps) * sampleRate);
            const startSample = centerSample - fftSize / 2;

            state = analyzeAudioFrame(
                re, im, magnitudes, window, channelData, startSample, fftSize, minDb, maxDb, sampleRate, state
            );

            map.sub[frameIndex] = state.smoothed.sub;
            map.bass[frameIndex] = state.smoothed.bass;
            map.mid[frameIndex] = state.smoothed.mid;
            map.treble[frameIndex] = state.smoothed.treble;

            // Yield every 200 frames to keep UI responsive
            if (frameIndex % 200 === 0) {
                setProcessingProgress(Math.floor((frameIndex / totalFrames) * 100));
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        mainAudioEngine.reactivityMap = map;
        mainAudioEngine.integratedReactivityMap = computeIntegratedReactivity(map);
        return map;
    },

    loadAudioFromFile: async (file) => {
        const { stopPlayback, resetAudioEngine, getAudioContext, precomputeReactivity } = get();
        stopPlayback(true);
        analytics.audio.started(file);
        resetAudioEngine();

        try {
            set({ isProcessing: true, processingProgress: 0 });
            await new Promise(resolve => setTimeout(resolve, 0)); // Yield to ensure the spinner appears immediately

            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await getAudioContext().decodeAudioData(arrayBuffer);

            // Reset state for new data
            mainAudioEngine.buffer = audioBuffer;
            set({ duration: audioBuffer.duration });
            await precomputeReactivity(audioBuffer);

            set({ audioFile: file });
            analytics.audio.succeeded(file, audioBuffer.duration);
        } catch (err: any) {
            analytics.audio.failed(file, err);
            console.error('Error processing uploaded audio:', err);
        } finally {
            set({ isProcessing: false });
        }
    },

    loadAudioFromUrl: async (url, label) => {
        const { stopPlayback, resetAudioEngine, getAudioContext, precomputeReactivity } = get();
        stopPlayback(true);
        resetAudioEngine();

        try {
            set({ isProcessing: true, processingProgress: 0 });
            await new Promise(resolve => setTimeout(resolve, 0)); // Yield to ensure the spinner appears immediately

            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await getAudioContext().decodeAudioData(arrayBuffer);

            // Reset state for new data
            mainAudioEngine.buffer = audioBuffer;
            set({ duration: audioBuffer.duration });
            await precomputeReactivity(audioBuffer);

            set({ audioFile: new File([arrayBuffer], label, { type: 'audio/mpeg' }) });
        } catch (err: any) {
            console.error('Error loading audio from URL:', err);
            throw err; // Re-throw so the caller can handle its own state/analytics
        } finally {
            set({ isProcessing: false });
        }
    },

    formatTime: (s: number) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, '0')}`;
    },

    startMic: async () => {
        const { getAudioContext, stopMic, stopPlayback } = get();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stopMic();
            stopPlayback();

            const ctx = getAudioContext();
            if (ctx.state === 'suspended') {
                await ctx.resume();
            }

            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 2048;
            source.connect(analyser); // Do not connect to destination (no feedback)

            mainAudioEngine.analyser = analyser;
            mainAudioEngine.mediaStream = stream;

            const fftSize = 2048;
            const windowArray = new Float32Array(fftSize);
            for (let i = 0; i < fftSize; i++) {
                windowArray[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (fftSize - 1)));
            }

            mainAudioEngine.liveBuffers = {
                re: new Float32Array(fftSize),
                im: new Float32Array(fftSize),
                magnitudes: new Float32Array(fftSize / 2),
                windowArray,
                timeData: new Float32Array(fftSize)
            };

            mainAudioEngine.liveState = {
                baselines: { sub: null, bass: null, mid: null, treble: null },
                smoothed: { sub: 0, bass: 0, mid: 0, treble: 0 },
                prevBins: new Float32Array(fftSize / 2).fill(0)
            };
            mainAudioEngine.liveIntegrated = { sub: 0, bass: 0, mid: 0, treble: 0 };
            mainAudioEngine.lastLiveTime = performance.now();

            set({ isLiveMode: true });
        } catch (err) {
            console.error("Microphone access denied or error:", err);
            alert("Could not access microphone.");
        }
    },

    stopMic: () => {
        if (mainAudioEngine.mediaStream) {
            mainAudioEngine.mediaStream.getTracks().forEach(t => t.stop());
            mainAudioEngine.mediaStream = null;
        }
        if (mainAudioEngine.analyser) {
            mainAudioEngine.analyser.disconnect();
            mainAudioEngine.analyser = null;
        }
        set({ isLiveMode: false });
    },

    getLiveReactivity: () => {
        const { isLiveMode, getAudioContext } = get();
        if (!isLiveMode) return null;

        if (!mainAudioEngine.analyser) return null;
        if (!mainAudioEngine.liveBuffers) return null;
        if (!mainAudioEngine.liveState) return null;

        const analyser = mainAudioEngine.analyser;
        const buffers = mainAudioEngine.liveBuffers;
        const state = mainAudioEngine.liveState;

        // Perform analysis (using any cast to solve the SharedArrayBuffer mismatch)
        analyser.getFloatTimeDomainData(buffers.timeData as any);

        const ctx = getAudioContext();
        const sampleRate = ctx.sampleRate || 44100;

        const nextState = analyzeAudioFrame(
            buffers.re,
            buffers.im,
            buffers.magnitudes,
            buffers.windowArray,
            buffers.timeData,
            0,
            2048,
            -100,
            -15,
            sampleRate,
            state
        );

        mainAudioEngine.liveState = nextState;

        const now = performance.now();
        const deltaSecs = (now - mainAudioEngine.lastLiveTime) / 1000;
        mainAudioEngine.lastLiveTime = now;

        const smoothed = nextState.smoothed;
        mainAudioEngine.liveIntegrated.sub += smoothed.sub * deltaSecs;
        mainAudioEngine.liveIntegrated.bass += smoothed.bass * deltaSecs;
        mainAudioEngine.liveIntegrated.mid += smoothed.mid * deltaSecs;
        mainAudioEngine.liveIntegrated.treble += smoothed.treble * deltaSecs;

        return {
            smoothed,
            integrated: { ...mainAudioEngine.liveIntegrated }
        };
    },
}));