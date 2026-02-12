import { useState, useRef, useEffect, useCallback, ChangeEvent } from 'react';

export const useAudioProcessor = () => {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const startTimeRef = useRef<number>(0);
    const offsetRef = useRef<number>(0);
    const isPlayingRef = useRef(false);

    // Sync ref with state for use in animation loops
    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

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
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const arrayBuffer = await file.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                audioBufferRef.current = audioBuffer;
                setDuration(audioBuffer.duration);
                audioContext.close();
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

        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048;
        analyserRef.current.smoothingTimeConstant = 0;

        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBufferRef.current;
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);

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
            offsetRef.current = getElapsedSeconds();
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
        analyserRef,
        dataArrayRef,
        audioContextRef,
        handleAudioUpload,
        togglePlay,
        handleSeek,
        getElapsedSeconds,
        formatTime,
        setCurrentTime,
        isPlayingRef
    };
};
