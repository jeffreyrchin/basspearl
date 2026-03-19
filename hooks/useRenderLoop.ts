import React, { useCallback, useEffect } from 'react';
import { mainGlitchEngine } from '@/services/glitchEngine';
import { SHARED_AUDIO_STATE } from '@/services/audioState';
import { useAudioStore } from '../store/useAudioStore';
import { mainAudioEngine } from '../services/audioEngine';
import { useEffectStore } from '../store/useEffectStore';
import { useLiveAudio } from './useLiveAudio';

export interface UseRenderLoopProps {
    canvasRef: React.RefObject<HTMLCanvasElement>;
    currentTimeLabelRef: React.RefObject<HTMLSpanElement>;
    scrubberRef: React.RefObject<HTMLInputElement>;
    requestRef: React.MutableRefObject<number | undefined>;
    frameCounterRef: React.MutableRefObject<number>;
    imageFileRef: React.MutableRefObject<string | null>;
    isDraggingScrubberRef: React.MutableRefObject<boolean>;
}

export const useRenderLoop = ({
    canvasRef,
    currentTimeLabelRef,
    scrubberRef,
    requestRef,
    frameCounterRef,
    imageFileRef,
    isDraggingScrubberRef
}: UseRenderLoopProps) => {
    const effects = useEffectStore(s => s.effects);
    const audioStore = useAudioStore();
    const { isLiveMode, getLiveReactivity } = useLiveAudio();

    const effectsRef = React.useRef(effects);
    const isLiveModeRef = React.useRef(isLiveMode);

    // Sync refs with store state internally
    useEffect(() => {
        effectsRef.current = effects;
    }, [effects]);

    useEffect(() => {
        isLiveModeRef.current = isLiveMode;
    }, [isLiveMode]);

    const renderFrame = useCallback(async (time: number) => {
        if (!canvasRef.current) return;

        let smoothed: { sub: number, bass: number, mid: number, treble: number } | undefined;
        let frameIntegrated: { sub: number, bass: number, mid: number, treble: number } | undefined;

        // 1. Fetch Reactivity Data
        if (isLiveMode) {
            const liveData = getLiveReactivity();
            if (liveData) {
                smoothed = liveData.smoothed;
                frameIntegrated = liveData.integrated;
            }
        } else if (mainAudioEngine.reactivityMap) {
            const fractionalFrame = time * 60;
            const f = Math.floor(fractionalFrame);
            const map = mainAudioEngine.reactivityMap;

            const max_f = map.bass.length - 1;
            const f_clamped = Math.min(max_f, f);
            const nf_clamped = Math.min(max_f, f + 1);
            const t = fractionalFrame - f; // Interpolation factor (0.0 to 1.0)

            const lerp = (arr: Float32Array | Float64Array) => {
                return arr[f_clamped] + (arr[nf_clamped] - arr[f_clamped]) * t;
            }

            smoothed = {
                sub: lerp(map.sub),
                bass: lerp(map.bass),
                mid: lerp(map.mid),
                treble: lerp(map.treble)
            };

            const iMap = mainAudioEngine.integratedReactivityMap;
            if (iMap) {
                frameIntegrated = {
                    sub: lerp(iMap.sub),
                    bass: lerp(iMap.bass),
                    mid: lerp(iMap.mid),
                    treble: lerp(iMap.treble)
                };
            }
        }

        // 2. Global State Update (for WebGL shaders)
        if (smoothed) {
            SHARED_AUDIO_STATE[0] = smoothed.sub;
            SHARED_AUDIO_STATE[1] = smoothed.bass;
            SHARED_AUDIO_STATE[2] = smoothed.mid;
            SHARED_AUDIO_STATE[3] = smoothed.treble;
        }

        await mainGlitchEngine.renderToCanvas(
            canvasRef.current,
            imageFileRef.current,
            effectsRef.current,
            {
                maxSize: 1920,
                reactivity: smoothed,
                integratedReactivity: frameIntegrated,
                currentTime: time
            }
        );
    }, [isLiveMode, getLiveReactivity, canvasRef, imageFileRef]);

    const scrubberPercent = useCallback((time: number, duration: number) => {
        return duration > 0 ? (time / duration) * 100 : 0;
    }, []);

    const updateScrubberUI = useCallback((time: number) => {
        if (currentTimeLabelRef.current) currentTimeLabelRef.current.innerText = audioStore.formatTime(time);
        if (scrubberRef.current) {
            scrubberRef.current.value = time.toString();
            const percent = scrubberPercent(time, audioStore.duration);
            scrubberRef.current.style.setProperty('--progress', `${percent}%`);
        }
    }, [currentTimeLabelRef, audioStore.formatTime, scrubberRef, scrubberPercent, audioStore.duration]);

    const animate = useCallback(async () => {
        if (!mainAudioEngine.isPlaying && !isLiveModeRef.current) {
            requestRef.current = undefined;
            return;
        }

        const elapsed = isLiveModeRef.current
            ? audioStore.getElapsedSeconds() // Don't clamp seconds in live mode (no max duration)
            : Math.min(audioStore.getElapsedSeconds(), audioStore.duration);
        // Only throttle if not dragging scrubber
        if (frameCounterRef.current % 4 === 0 && !isDraggingScrubberRef.current && !isLiveModeRef.current) {
            updateScrubberUI(elapsed);
        }
        frameCounterRef.current++;

        await renderFrame(elapsed);

        requestRef.current = requestAnimationFrame(animate); // Keep animation loop going even if no image or canvas
    }, [isLiveModeRef, audioStore, frameCounterRef, isDraggingScrubberRef, updateScrubberUI, renderFrame, requestRef]);

    return {
        renderFrame,
        animate,
        updateScrubberUI
    };
};
