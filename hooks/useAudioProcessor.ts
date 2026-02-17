import { useState, useRef, useEffect, useCallback, ChangeEvent } from 'react';
import { calculateNextState, ReactivityState } from '@/services/calculateReactiveEffects';
import { computeIntegratedReactivity, IntegratedReactivityMap } from '@/services/SpeedManager';
import { analytics } from '@/services/analytics';

const analysisCache = new Map<string, {
    buffer: AudioBuffer;
    map: any;
    integrated: any;
    duration: number;
}>();

export const useAudioProcessor = () => {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);
    const startTimeRef = useRef<number>(0);
    const offsetRef = useRef<number>(0);
    const isPlayingRef = useRef(false);

    const reactivityMapRef = useRef<{
        bass: Float32Array;
        mid: Float32Array;
        treble: Float32Array;
        energy: Float32Array;
    } | null>(null);

    const integratedReactivityMapRef = useRef<IntegratedReactivityMap | null>(null);

    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return audioContextRef.current;
    }, []);

    const stopPlayback = useCallback((resetTime = false) => {
        if (sourceRef.current) {
            try {
                sourceRef.current.onended = null;
                sourceRef.current.stop();
            } catch (e) { }
            sourceRef.current = null;
        }

        setIsPlaying(false);
        isPlayingRef.current = false;

        if (resetTime) {
            setCurrentTime(0);
            offsetRef.current = 0;
        }
    }, []);

    const precomputeReactivity = async (buffer: AudioBuffer, fps = 60) => {
        const sampleRate = buffer.sampleRate;
        const channelData = buffer.getChannelData(0); // Analyze mono
        const totalFrames = Math.ceil(buffer.duration * fps);
        const fftSize = 2048;

        const map = {
            bass: new Float32Array(totalFrames),
            mid: new Float32Array(totalFrames),
            treble: new Float32Array(totalFrames),
            energy: new Float32Array(totalFrames)
        };

        let state: ReactivityState = {
            baselines: { bass: null, mid: null, treble: null, energy: null },
            smoothed: { bass: 0, mid: 0, treble: 0, energy: 0 },
            kickBaseline: null,
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
        const maxDb = -30;

        for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
            const centerSample = Math.floor((frameIndex / fps) * sampleRate);
            const startSample = centerSample - fftSize / 2;

            // 1. Prepare Windowed Buffer
            re.fill(0);
            im.fill(0);
            for (let i = 0; i < fftSize; i++) {
                const sampleIndex = startSample + i;
                if (sampleIndex >= 0 && sampleIndex < channelData.length) {
                    re[i] = channelData[sampleIndex] * window[i];
                }
            }

            // 2. Cooley-Tukey FFT (Iterative)
            const n = fftSize;
            for (let i = 1, j = 0; i < n; i++) {
                let bit = n >> 1;
                for (; j & bit; bit >>= 1) j ^= bit;
                j ^= bit;
                if (i < j) [re[i], re[j]] = [re[j], re[i]];
            }
            for (let len = 2; len <= n; len <<= 1) {
                const ang = 2 * Math.PI / len;
                const wlen_re = Math.cos(ang), wlen_im = -Math.sin(ang);
                for (let i = 0; i < n; i += len) {
                    let w_re = 1, w_im = 0;
                    for (let j = 0; j < len / 2; j++) {
                        const u_re = re[i + j], u_im = im[i + j];
                        const v_re = re[i + j + len / 2] * w_re - im[i + j + len / 2] * w_im;
                        const v_im = re[i + j + len / 2] * w_im + im[i + j + len / 2] * w_re;
                        re[i + j] = u_re + v_re;
                        im[i + j] = u_im + v_im;
                        re[i + j + len / 2] = u_re - v_re;
                        im[i + j + len / 2] = u_im - v_im;
                        const next_w_re = w_re * wlen_re - w_im * wlen_im;
                        w_im = w_re * wlen_im + w_im * wlen_re;
                        w_re = next_w_re;
                    }
                }
            }

            // 3. Magnitudes (Convert to Decibels, matching Web Audio Analyser defaults)
            for (let i = 0; i < fftSize / 2; i++) {
                // Normalize by 1/N and calculate linear magnitude
                const mag = Math.sqrt(re[i] * re[i] + im[i] * im[i]) / fftSize;

                // Convert to Decibels
                const db = mag > 0.000001 ? 20 * Math.log10(mag) : minDb;

                // Map dB to 0..1 scale (clamping to minDb/maxDb)
                const scaled = (db - minDb) / (maxDb - minDb);
                magnitudes[i] = Math.max(0, Math.min(1, scaled));
            }

            // 4. Feed to existing reactivity service
            state = calculateNextState(magnitudes, magnitudes.length, sampleRate, state);

            map.bass[frameIndex] = state.smoothed.bass;
            map.mid[frameIndex] = state.smoothed.mid;
            map.treble[frameIndex] = state.smoothed.treble;
            map.energy[frameIndex] = state.smoothed.energy;

            // Yield every 200 frames to keep UI responsive
            if (frameIndex % 200 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        reactivityMapRef.current = map;
        integratedReactivityMapRef.current = computeIntegratedReactivity(map);
        return map;
    };

    /**
     * Helper to apply cached results to the current state
     */
    const applyCachedAudio = useCallback((cached: any, file: File) => {
        stopPlayback(true);
        audioBufferRef.current = cached.buffer;
        reactivityMapRef.current = cached.map;
        integratedReactivityMapRef.current = cached.integrated;
        setDuration(cached.duration);
        setAudioFile(file);
    }, [stopPlayback]);

    /**
     * Completely resets the audio context and internal reactivity maps
     */
    const resetAudioEngine = useCallback(() => {
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        audioBufferRef.current = null;
        reactivityMapRef.current = null;
        integratedReactivityMapRef.current = null;
    }, []);

    /**
     * Processor: Centralizes analysis, state updates, and caching.
     */
    const processAndStoreAudio = useCallback(async (buffer: AudioBuffer, cacheKey: string, file: File) => {
        // Reset state for new data
        audioBufferRef.current = buffer;
        setDuration(buffer.duration);

        // Compute FFT Reactivity
        const map = await precomputeReactivity(buffer);

        // Store in memory cache
        analysisCache.set(cacheKey, {
            buffer,
            map,
            integrated: integratedReactivityMapRef.current,
            duration: buffer.duration
        });

        setAudioFile(file);
    }, [precomputeReactivity]);

    const getElapsedSeconds = useCallback(() => {
        if (!audioContextRef.current || !isPlayingRef.current) return offsetRef.current;
        return offsetRef.current + (audioContextRef.current.currentTime - startTimeRef.current);
    }, []);

    const handleAudioUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            stopPlayback(true);
            const file = e.target.files[0];
            analytics.audio.started(file);
            const cacheKey = `file:${file.name}:${file.size}`;

            // 1. Cache Check
            if (analysisCache.has(cacheKey)) {
                applyCachedAudio(analysisCache.get(cacheKey)!, file);
                analytics.audio.succeeded(file, analysisCache.get(cacheKey)!.duration, true);
                return;
            }

            // 2. Clear context & Reset
            resetAudioEngine();

            try {
                setIsProcessing(true);
                // Yield to ensure the spinner appears immediately
                await new Promise(resolve => setTimeout(resolve, 0));

                const arrayBuffer = await file.arrayBuffer();
                const audioBuffer = await getAudioContext().decodeAudioData(arrayBuffer);

                await processAndStoreAudio(audioBuffer, cacheKey, file);
                analytics.audio.succeeded(file, audioBuffer.duration);
            } catch (err: any) {
                analytics.audio.failed(file, err);
                console.error('Error processing uploaded audio:', err);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const loadAudioFromUrl = async (url: string, label: string) => {
        stopPlayback(true);
        const cacheKey = `url:${url}`;
        const virtualFile = new File([], label, { type: 'audio/mpeg' });

        // 1. Cache Check
        if (analysisCache.has(cacheKey)) {
            applyCachedAudio(analysisCache.get(cacheKey)!, virtualFile);
            return;
        }

        // 2. Clear context & Reset
        resetAudioEngine();

        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await getAudioContext().decodeAudioData(arrayBuffer);

            await processAndStoreAudio(audioBuffer, cacheKey, new File([arrayBuffer], label, { type: 'audio/mpeg' }));
        } catch (err) {
            console.error('Error loading audio from URL:', err);
            throw err; // Re-throw so the caller can handle its own state/analytics
        }
    };

    const playAudio = async (startOffset = 0, onStart?: () => void) => {
        if (!audioFile || !audioBufferRef.current) return;

        stopPlayback();

        const ctx = getAudioContext();

        if (ctx.state === 'suspended') {
            await ctx.resume();
        }

        const source = ctx.createBufferSource();
        source.buffer = audioBufferRef.current;
        source.connect(ctx.destination);

        source.onended = () => {
            stopPlayback(true);
        };

        sourceRef.current = source;
        source.start(0, startOffset);
        startTimeRef.current = ctx.currentTime;
        offsetRef.current = startOffset;
        setIsPlaying(true);
        isPlayingRef.current = true;

        if (onStart) onStart();
    };

    const togglePlay = (onStart?: () => void) => {
        if (isPlayingRef.current) {
            // Pause: save current position
            const pausedAt = getElapsedSeconds();
            offsetRef.current = pausedAt;
            setCurrentTime(pausedAt); // Update current time state for UI

            stopPlayback();
        } else {
            // Play/Resume from saved offset
            playAudio(offsetRef.current, onStart);
        }
    };

    const handleSeek = (e: ChangeEvent<HTMLInputElement>, onStart?: () => void) => {
        const seekTo = parseFloat(e.target.value);
        offsetRef.current = seekTo;
        setCurrentTime(seekTo);

        if (isPlayingRef.current) {
            playAudio(seekTo, onStart);
        }
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    return {
        audioFile,
        isPlaying,
        currentTime,
        duration,
        audioContextRef,
        handleAudioUpload,
        togglePlay,
        handleSeek,
        getElapsedSeconds,
        formatTime,
        setCurrentTime,
        isPlayingRef,
        reactivityMapRef,
        integratedReactivityMapRef,
        audioBufferRef,
        isProcessing,
        setIsProcessing,
        loadAudioFromUrl
    };
};
