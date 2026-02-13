import { useState, useRef, useEffect, useCallback, ChangeEvent } from 'react';
import { calculateNextState, ReactivityState } from '@/services/calculateReactiveEffects';

export const useAudioProcessor = () => {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const audioContextRef = useRef<AudioContext | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);
    const startTimeRef = useRef<number>(0);
    const offsetRef = useRef<number>(0);
    const isPlayingRef = useRef(false);

    // Sync ref with state for use in animation loops
    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    const reactivityMapRef = useRef<{
        bass: Float32Array;
        mid: Float32Array;
        treble: Float32Array;
        energy: Float32Array;
    } | null>(null);

    const precomputeReactivity = async (buffer: AudioBuffer, fps = 60) => {
        console.log("Precomputing audio reactivity...");

        const totalFrames = Math.ceil(buffer.duration * fps);
        const map = {
            bass: new Float32Array(totalFrames),
            mid: new Float32Array(totalFrames),
            treble: new Float32Array(totalFrames),
            energy: new Float32Array(totalFrames)
        };

        // 1. Set up Offline Context
        const offlineCtx = new OfflineAudioContext(1, buffer.length, buffer.sampleRate);
        const source = offlineCtx.createBufferSource();
        source.buffer = buffer;
        const analyser = offlineCtx.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0;

        source.connect(analyser);
        analyser.connect(offlineCtx.destination);
        source.start(0);

        // 2. Prepare state & buffers
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let state: ReactivityState = {
            baselines: { bass: null, mid: null, treble: null, energy: null },
            smoothed: { bass: 0, mid: 0, treble: 0, energy: 0 },
            kickBaseline: null,
            prevBins: new Float32Array(analyser.frequencyBinCount).fill(0)
        };

        // 3. Schedule "suspend" events for every frame to grab data
        for (let i = 0; i < totalFrames; i++) {
            const time = i / fps;

            // Scheduling analysis at specific timestamps
            offlineCtx.suspend(time).then(() => {
                analyser.getByteFrequencyData(dataArray);

                // Calculate reactivity for this frame
                state = calculateNextState(dataArray, dataArray.length, buffer.sampleRate, state);

                map.bass[i] = state.smoothed.bass;
                map.mid[i] = state.smoothed.mid;
                map.treble[i] = state.smoothed.treble;
                map.energy[i] = state.smoothed.energy;

                // Resume processing to get to the next frame
                offlineCtx.resume();
            });
        }

        // 4. Run the rendering (this triggers all the suspends in order)
        try {
            await offlineCtx.startRendering();
            console.log("Precomputation complete.");
            reactivityMapRef.current = map;
            return map;
        } catch (err) {
            console.error("Precomputation failed:", err);
            return null;
        }
    };

    const getElapsedSeconds = useCallback(() => {
        if (!audioContextRef.current || !isPlayingRef.current) return offsetRef.current;
        return offsetRef.current + (audioContextRef.current.currentTime - startTimeRef.current);
    }, []);

    const handleAudioUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAudioFile(file);
            setIsPlaying(false);
            isPlayingRef.current = false;

            // Stop and cleanup existing audio
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }

            // Reset state
            audioBufferRef.current = null;
            offsetRef.current = 0;
            setCurrentTime(0);

            // Decode audio and set duration immediately
            try {
                if (!audioContextRef.current) {
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                }
                const arrayBuffer = await file.arrayBuffer();
                const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
                audioBufferRef.current = audioBuffer;
                setDuration(audioBuffer.duration);

                // Start precomputation
                await precomputeReactivity(audioBuffer);
            } catch (err) {
                console.error('Error decoding audio:', err);
            }
        }
    };

    const playAudio = async (startOffset = 0, onStart?: () => void) => {
        if (!audioFile || !audioBufferRef.current) return;

        // Stop existing source if any
        if (sourceRef.current) {
            try {
                sourceRef.current.onended = null;
                sourceRef.current.stop();
            } catch (e) {
                // Already stopped
            }
        }

        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBufferRef.current;
        source.connect(audioContextRef.current.destination);

        source.onended = () => {
            setIsPlaying(false);
            isPlayingRef.current = false;
            setCurrentTime(0);
            offsetRef.current = 0;
        };

        sourceRef.current = source;
        source.start(0, startOffset);
        startTimeRef.current = audioContextRef.current.currentTime;
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

            // Remove onended handler before stopping to prevent it from resetting time
            if (sourceRef.current) {
                sourceRef.current.onended = null;
                sourceRef.current.stop();
            }
            setIsPlaying(false);
            isPlayingRef.current = false;
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
        reactivityMapRef
    };
};
