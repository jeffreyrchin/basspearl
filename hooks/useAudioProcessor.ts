import { useState, useRef, useEffect, useCallback, ChangeEvent } from 'react';
import { ReactivityState } from '@/services/calculateReactiveEffects';
import { computeIntegratedReactivity, IntegratedReactivityMap } from '@/services/SpeedManager';
import { analytics } from '@/services/analytics';
import { analyzeAudioFrame } from '@/services/audioMath';

export const useAudioProcessor = () => {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingProgress, setProcessingProgress] = useState(0);

    const audioContextRef = useRef<AudioContext | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);
    const startTimeRef = useRef<number>(0);
    const offsetRef = useRef<number>(0);
    const isPlayingRef = useRef(false);

    const reactivityMapRef = useRef<{
        sub: Float32Array;
        bass: Float32Array;
        mid: Float32Array;
        treble: Float32Array;
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
        setProcessingProgress(0);
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
                re,
                im,
                magnitudes,
                window,
                channelData,
                startSample,
                fftSize,
                minDb,
                maxDb,
                sampleRate,
                state
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

        reactivityMapRef.current = map;
        integratedReactivityMapRef.current = computeIntegratedReactivity(map);
        return map;
    };

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
     * Processor: Centralizes analysis and state updates.
     */
    const processAudio = useCallback(async (buffer: AudioBuffer, file: File) => {
        // Reset state for new data
        audioBufferRef.current = buffer;
        setDuration(buffer.duration);

        // Compute FFT Reactivity
        await precomputeReactivity(buffer);

        setAudioFile(file);
    }, [precomputeReactivity]);

    const getElapsedSeconds = useCallback(() => {
        if (!audioContextRef.current || !isPlayingRef.current) return offsetRef.current;
        return offsetRef.current + (audioContextRef.current.currentTime - startTimeRef.current);
    }, []);

    const loadAudioFromFile = async (file: File) => {
        stopPlayback(true);
        analytics.audio.started(file);

        // 2. Clear context & Reset
        resetAudioEngine();

        try {
            setIsProcessing(true);
            setProcessingProgress(0);

            // Yield to ensure the spinner appears immediately
            await new Promise(resolve => setTimeout(resolve, 0));

            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await getAudioContext().decodeAudioData(arrayBuffer);

            await processAudio(audioBuffer, file);
            analytics.audio.succeeded(file, audioBuffer.duration);
        } catch (err: any) {
            analytics.audio.failed(file, err);
            console.error('Error processing uploaded audio:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAudioUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            await loadAudioFromFile(e.target.files[0]);
        }
    };

    const loadAudioFromUrl = async (url: string, label: string) => {
        stopPlayback(true);

        // 2. Clear context & Reset
        resetAudioEngine();

        try {
            setIsProcessing(true);
            setProcessingProgress(0);

            // Yield to ensure the spinner appears immediately
            await new Promise(resolve => setTimeout(resolve, 0));

            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await getAudioContext().decodeAudioData(arrayBuffer);

            await processAudio(audioBuffer, new File([arrayBuffer], label, { type: 'audio/mpeg' }));
        } catch (err: any) {
            console.error('Error loading audio from URL:', err);
            throw err; // Re-throw so the caller can handle its own state/analytics
        } finally {
            setIsProcessing(false);
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
        processingProgress,
        loadAudioFromUrl,
        loadAudioFromFile,
        stopPlayback
    };
};
