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

    // Persistent containers to avoid object allocations in the Hot Loop (60fps)
    const staticSmoothedRef = React.useRef({ sub: 0, bass: 0, mid: 0, treble: 0 });
    const staticIntegratedRef = React.useRef({ sub: 0, bass: 0, mid: 0, treble: 0 });

    // Sync refs with store state internally
    useEffect(() => {
        effectsRef.current = effects;
    }, [effects]);

    useEffect(() => {
        isLiveModeRef.current = isLiveMode;
    }, [isLiveMode]);

    const renderFrame = useCallback(async (time: number) => {
        if (!canvasRef.current) return;

        let smoothed = staticSmoothedRef.current;
        let frameIntegrated = staticIntegratedRef.current;

        // 1. Fetch Reactivity Data
        if (isLiveMode) {
            const liveData = getLiveReactivity();
            if (liveData) {
                // Bulk copy to persistent object (no new allocation)
                smoothed.sub = liveData.smoothed.sub;
                smoothed.bass = liveData.smoothed.bass;
                smoothed.mid = liveData.smoothed.mid;
                smoothed.treble = liveData.smoothed.treble;

                frameIntegrated.sub = liveData.integrated.sub;
                frameIntegrated.bass = liveData.integrated.bass;
                frameIntegrated.mid = liveData.integrated.mid;
                frameIntegrated.treble = liveData.integrated.treble;
            } else {
                return; // Not ready
            }
        } else if (mainAudioEngine.reactivityMap) {
            const map = mainAudioEngine.reactivityMap;
            const iMap = mainAudioEngine.integratedReactivityMap;

            const fractionalFrame = time * 60;
            const f = fractionalFrame | 0; // Bitwise floor (Math.floor(fractionalFrame))
            const t = fractionalFrame - f; // Interpolation factor (0.0 to 1.0) (fractionalFrame % 1)

            const max_f = map.bass.length - 1;
            const f1 = f > max_f ? max_f : f; // f_clamped = Math.min(max_f, f)
            const f2 = (f + 1) > max_f ? max_f : (f + 1); // nf_clamped = Math.min(max_f, f + 1)

            // Linear interpolation
            smoothed.sub = map.sub[f1] + (map.sub[f2] - map.sub[f1]) * t;
            smoothed.bass = map.bass[f1] + (map.bass[f2] - map.bass[f1]) * t;
            smoothed.mid = map.mid[f1] + (map.mid[f2] - map.mid[f1]) * t;
            smoothed.treble = map.treble[f1] + (map.treble[f2] - map.treble[f1]) * t;

            if (iMap) {
                frameIntegrated.sub = iMap.sub[f1] + (iMap.sub[f2] - iMap.sub[f1]) * t;
                frameIntegrated.bass = iMap.bass[f1] + (iMap.bass[f2] - iMap.bass[f1]) * t;
                frameIntegrated.mid = iMap.mid[f1] + (iMap.mid[f2] - iMap.mid[f1]) * t;
                frameIntegrated.treble = iMap.treble[f1] + (iMap.treble[f2] - iMap.treble[f1]) * t;
            }
        } else {
            return;
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
