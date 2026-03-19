import { useState, useRef, useCallback, useEffect } from 'react';
import { ReactivityState } from '@/services/calculateReactiveEffects';
import { analyzeAudioFrame } from '@/services/audioMath';

export const useLiveAudio = () => {
    const [isLiveMode, setIsLiveMode] = useState(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);

    // Live Mode Buffers and State
    const liveBuffersRef = useRef<{
        re: Float32Array;
        im: Float32Array;
        magnitudes: Float32Array;
        windowArray: Float32Array;
        timeData: Float32Array;
    } | null>(null);

    const liveStateRef = useRef<ReactivityState>({
        baselines: { sub: null, bass: null, mid: null, treble: null },
        smoothed: { sub: 0, bass: 0, mid: 0, treble: 0 },
        prevBins: new Float32Array(1024).fill(0) // 2048/2
    });

    const liveIntegratedRef = useRef({ sub: 0, bass: 0, mid: 0, treble: 0 });
    const lastLiveTimeRef = useRef(0);

    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return audioContextRef.current;
    }, []);

    const stopMic = useCallback(() => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(t => t.stop());
            mediaStreamRef.current = null;
        }
        if (analyserRef.current) {
            analyserRef.current.disconnect();
            analyserRef.current = null;
        }
        setIsLiveMode(false);
    }, []);

    const startMic = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stopMic();

            const ctx = getAudioContext();
            if (ctx.state === 'suspended') {
                await ctx.resume();
            }

            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 2048;
            source.connect(analyser); // Do not connect to destination (no feedback)

            analyserRef.current = analyser;
            mediaStreamRef.current = stream;

            const fftSize = 2048;
            const windowArray = new Float32Array(fftSize);
            for (let i = 0; i < fftSize; i++) {
                windowArray[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (fftSize - 1)));
            }
            liveBuffersRef.current = {
                re: new Float32Array(fftSize),
                im: new Float32Array(fftSize),
                magnitudes: new Float32Array(fftSize / 2),
                windowArray,
                timeData: new Float32Array(fftSize)
            };

            liveStateRef.current = {
                baselines: { sub: null, bass: null, mid: null, treble: null },
                smoothed: { sub: 0, bass: 0, mid: 0, treble: 0 },
                prevBins: new Float32Array(fftSize / 2).fill(0)
            };
            liveIntegratedRef.current = { sub: 0, bass: 0, mid: 0, treble: 0 };
            lastLiveTimeRef.current = performance.now();

            setIsLiveMode(true);
        } catch (err) {
            console.error("Microphone access denied or error:", err);
            alert("Could not access microphone.");
        }
    };

    const getLiveReactivity = useCallback(() => {
        if (!analyserRef.current || !liveBuffersRef.current || !isLiveMode) return null;

        const { re, im, magnitudes, windowArray, timeData } = liveBuffersRef.current;
        analyserRef.current.getFloatTimeDomainData(timeData);

        const sampleRate = getAudioContext().sampleRate || 44100;

        liveStateRef.current = analyzeAudioFrame(
            re, im, magnitudes, windowArray, timeData, 0, 2048, -100, -15, sampleRate, liveStateRef.current
        );

        // Calc delta for integrated
        const now = performance.now();
        const deltaSecs = (now - lastLiveTimeRef.current) / 1000;
        lastLiveTimeRef.current = now;

        const smoothed = liveStateRef.current.smoothed;
        liveIntegratedRef.current.sub += smoothed.sub * deltaSecs;
        liveIntegratedRef.current.bass += smoothed.bass * deltaSecs;
        liveIntegratedRef.current.mid += smoothed.mid * deltaSecs;
        liveIntegratedRef.current.treble += smoothed.treble * deltaSecs;

        return {
            smoothed,
            integrated: { ...liveIntegratedRef.current }
        };
    }, [isLiveMode, getAudioContext]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopMic();
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, [stopMic]);

    return {
        isLiveMode,
        startMic,
        stopMic,
        getLiveReactivity
    };
};
