import React, { useRef, useState, useEffect, useCallback, memo } from 'react';
import { FrequencyBand } from '../types';
import { SHARED_AUDIO_STATE, BAND_INDEX } from '../services/audioState';
import { setDragOverride, clearDragOverride } from '../services/dragOverride';
import { useDragSync } from '../hooks/useDragSync';

interface AdaptiveSliderProps {
    value: number;
    min: number;
    frequencyBand: FrequencyBand;
    onChange: (update: { value?: number, min?: number }) => void;
    onPointerDown?: () => void;
    effectId?: string;
    paramIdx?: number;
}

type Mode = 'none' | 'left' | 'right' | 'middle';

/**
 * AdaptiveSlider: Optimized for performance and stability.
 * Uses persistent refs and memoized components to prevent memory leaks and redundant work.
 */
export const AdaptiveSlider: React.FC<AdaptiveSliderProps> = ({
    value,
    min,
    frequencyBand,
    onChange,
    onPointerDown,
    effectId,
    paramIdx
}) => {
    // --- Refs for Performance & Animation ---
    const trackRef = useRef<HTMLDivElement>(null);
    const trackFillRef = useRef<HTMLDivElement>(null);
    const needleRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);
    const minThumbRef = useRef<HTMLDivElement>(null);
    const valueLabelRef = useRef<HTMLSpanElement>(null);
    const minLabelRef = useRef<HTMLSpanElement>(null);
    const onChangeRef = useRef(onChange);

    // Keep range in refs for zero-render needle updates
    const currentMinRef = useRef(min);
    const currentMaxRef = useRef(value);

    // --- Drag Tracking Refs ---
    const startXRef = useRef(0);
    const startMinRef = useRef(min);
    const startMaxRef = useRef(value);
    const startTrackWidthRef = useRef(0);

    const [dragMode, setDragMode] = useState<Mode>('none');
    const isReactive = frequencyBand !== 'OFF';

    // Synchronize props to refs to avoid re-binding listeners
    useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
    useEffect(() => {
        currentMinRef.current = min;
        currentMaxRef.current = value;
    }, [min, value]);

    // --- 0. Drag Override Subscription (Direct DOM Update) ---
    useDragSync(effectId, paramIdx, useCallback((liveValue) => {
        // Direct DOM manipulation: bypass React entirely for 60fps sliders
        if (liveValue !== undefined) {
            currentMaxRef.current = liveValue;
            if (thumbRef.current) thumbRef.current.style.left = `${liveValue}%`;
            if (valueLabelRef.current) valueLabelRef.current.innerText = Math.round(liveValue).toString();

            if (trackFillRef.current) {
                const currentLiveMin = currentMinRef.current;
                trackFillRef.current.style.left = `${Math.min(currentLiveMin, liveValue)}%`;
                trackFillRef.current.style.width = `${Math.abs(liveValue - currentLiveMin)}%`;
            }
        }
    }, []));

    // Memoized Drag Initialization
    const handleDragStart = useCallback((clientX: number, mode: Mode) => {
        if (mode === 'none' || !trackRef.current) return;

        const rect = trackRef.current.getBoundingClientRect();
        startTrackWidthRef.current = rect.width - 32; // 16px padding on each side (inset-x-[16px])
        startXRef.current = clientX;
        startMinRef.current = currentMinRef.current;
        startMaxRef.current = currentMaxRef.current;

        setDragMode(mode);
    }, []);

    // --- 1. Needle Polling Loop (Zero-Render Animation) ---
    useEffect(() => {
        const bandIndex = BAND_INDEX[frequencyBand];
        if (bandIndex === -1) return;

        let frameId: number;
        const tick = () => {
            if (!needleRef.current) return;

            // Pull directly from shared bucket
            const audioVal = SHARED_AUDIO_STATE[bandIndex];

            // Compute position using refs (no React state involved)
            const range = currentMaxRef.current - currentMinRef.current;
            const val = currentMinRef.current + (range * audioVal);

            // Fixed decimal precision for style strings (Safari optimization)
            needleRef.current.style.left = `${val.toFixed(2)}%`;
            frameId = requestAnimationFrame(tick);
        };

        frameId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameId);
    }, [frequencyBand]);

    // --- 3. Optimized Global Drag Listener ---
    useEffect(() => {
        if (dragMode === 'none') return;

        const handleMove = (e: MouseEvent | TouchEvent) => {
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const deltaPercent = ((clientX - startXRef.current) / startTrackWidthRef.current) * 100;

            if (dragMode === 'left') {
                const newMin = Math.max(0, Math.min(100, Math.round(startMinRef.current + deltaPercent)));
                if (newMin !== currentMinRef.current) {
                    currentMinRef.current = newMin;

                    // Update the min thumb and label
                    if (minThumbRef.current) minThumbRef.current.style.left = `${newMin}%`;
                    if (minLabelRef.current) minLabelRef.current.innerText = Math.round(newMin).toString();

                    // Update the track fill
                    if (trackFillRef.current) {
                        trackFillRef.current.style.left = `${Math.min(newMin, currentMaxRef.current)}%`;
                        trackFillRef.current.style.width = `${Math.abs(currentMaxRef.current - newMin)}%`;
                    }

                    // High-performance path: update the override module directly
                    if (effectId && paramIdx !== undefined) {
                        setDragOverride(effectId, [{ index: paramIdx, min: newMin }]);
                    }
                }
            } else if (dragMode === 'right' || dragMode === 'middle') {
                const shift = Math.round(deltaPercent);
                const newMax = Math.max(0, Math.min(100, Math.round(startMaxRef.current + (dragMode === 'middle' ? shift : deltaPercent))));
                const newMin = Math.max(0, Math.min(100, startMinRef.current + shift));

                const hasMinChanged = dragMode === 'middle' && newMin !== currentMinRef.current;
                const hasMaxChanged = newMax !== currentMaxRef.current;

                if (hasMinChanged) {
                    currentMinRef.current = newMin;

                    // Update the min thumb and label
                    if (minThumbRef.current) minThumbRef.current.style.left = `${newMin}%`;
                    if (minLabelRef.current) minLabelRef.current.innerText = Math.round(newMin).toString();
                }

                if (hasMaxChanged) {
                    currentMaxRef.current = newMax;

                    // Update the max thumb and label
                    if (thumbRef.current) thumbRef.current.style.left = `${newMax}%`;
                    if (valueLabelRef.current) valueLabelRef.current.innerText = Math.round(newMax).toString();
                }

                if (hasMinChanged || hasMaxChanged) {
                    // Update the track fill
                    if (trackFillRef.current) {
                        trackFillRef.current.style.left = `${Math.min(newMin, newMax)}%`;
                        trackFillRef.current.style.width = `${Math.abs(newMax - newMin)}%`;
                    }

                    // High-performance path: update the override module directly
                    if (effectId && paramIdx !== undefined) {
                        setDragOverride(effectId, [{
                            index: paramIdx,
                            value: newMax,
                            min: dragMode === 'middle' ? newMin : undefined
                        }]);
                    }
                }
            }
        };

        const handleEnd = () => {
            // Commit final state to React/Zustand exactly ONCE
            if (effectId && paramIdx !== undefined) {
                clearDragOverride();
                onChangeRef.current({
                    value: currentMaxRef.current,
                    min: currentMinRef.current
                });
            }
            setDragMode('none');
        };

        window.addEventListener('pointermove', handleMove, { passive: true });
        window.addEventListener('pointerup', handleEnd);

        return () => {
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleEnd);
        };
    }, [dragMode]);

    if (isReactive) {
        return (
            <div className={`relative h-10 flex items-center my-2`} onPointerDown={onPointerDown}>
                {/* Reactive Slider */}
                <div key="reactive" className="relative w-full" ref={trackRef}>
                    {/* Visual Track (Padded to match thumb centers) */}
                    <div className="absolute inset-x-0 h-7 bg-white/10 overflow-hidden rounded-full top-1/2 -translate-y-1/2 touch-none">
                        <div className="absolute inset-x-[16px] inset-y-0">
                            <div
                                ref={trackFillRef}
                                onPointerDown={(e) => { e.preventDefault(); handleDragStart(e.clientX, 'middle'); }}
                                className="absolute h-full bg-primary/20 cursor-grab active:cursor-grabbing"
                                style={{
                                    left: `${Math.min(min, value)}%`,
                                    width: `${Math.abs(value - min)}%`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Interactive Elements Layer */}
                    <div className="absolute inset-x-[16px] inset-y-0 pointer-events-none">
                        <div ref={minThumbRef} className="absolute inset-y-0 pointer-events-none" style={{ left: `${min}%` }}>
                            <SliderHandle
                                label="Min"
                                value={min}
                                mode="left"
                                onStart={handleDragStart}
                                onKeyUpdate={d => onChangeRef.current({ min: Math.max(0, Math.min(100, min + d)) })}
                                labelRef={minLabelRef}
                                borderStyle="border-white/60"
                            />
                        </div>
                        <div ref={thumbRef} className="absolute inset-y-0 pointer-events-none" style={{ left: `${value}%` }}>
                            <SliderHandle
                                label="Max"
                                value={value}
                                mode="right"
                                onStart={handleDragStart}
                                onKeyUpdate={d => onChangeRef.current({ value: Math.max(0, Math.min(100, value + d)) })}
                                labelRef={valueLabelRef}
                                borderStyle="border-primary/80"
                            />
                        </div>

                        <div ref={needleRef} className="absolute h-7 pointer-events-none z-10 top-1/2 -translate-y-1/2"
                            style={{ left: `${min}%`, width: '2px', backgroundColor: 'white' }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative h-10 flex items-center mb-1`} onPointerDown={onPointerDown}>
            {/* Manual/Static Slider */}
            <div key="static" className="relative flex-1 group/static" ref={trackRef}>
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={value}
                    onChange={(e) => {
                        const nextVal = parseInt(e.target.value);
                        if (nextVal !== value) onChange({ value: nextVal });
                    }}
                    className="w-full h-10 mt-2 bg-transparent appearance-none cursor-pointer custom-slider relative z-10"
                />
                <div className="absolute inset-x-[16px] inset-y-0 pointer-events-none">
                    <div ref={thumbRef} className="absolute inset-y-0 pointer-events-none" style={{ left: `${value}%` }}>
                        <SliderHandle
                            label="Value"
                            value={value}
                            mode="right"
                            onStart={handleDragStart}
                            onKeyUpdate={d => onChange({ value: Math.max(0, Math.min(100, value + d)) })}
                            labelRef={valueLabelRef}
                            borderStyle="border-white/60"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const SliderHandle = memo<{
    label: string,
    value: number,
    mode: Mode,
    onStart: (cx: number, m: Mode) => void,
    onKeyUpdate: (d: number) => void,
    labelRef?: React.RefObject<HTMLSpanElement>,
    borderStyle: string
}>(({ label, value, mode, onStart, onKeyUpdate, labelRef, borderStyle }) => (
    <div
        role="slider"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        tabIndex={0}
        onPointerDown={(e) => {
            // Crucial: prevent scrolling on mobile while dragging
            if (e.pointerType === 'touch') e.preventDefault();
            onStart(e.clientX, mode);
        }}
        onKeyDown={(e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.stopPropagation(); // Prevent playback scrubber from moving when adjusting sliders
            if (e.key === 'ArrowLeft') onKeyUpdate(e.shiftKey ? -10 : -1);
            if (e.key === 'ArrowRight') onKeyUpdate(e.shiftKey ? 10 : 1);
        }}
        className={`absolute w-8 h-8 z-20 top-1/2 group/handle outline-none focus-visible:ring-1 focus-visible:ring-primary/60 touch-none pointer-events-auto cursor-pointer hover:scale-110 hover:z-31 active:z-31 focus-within:z-30 transition-transform -translate-x-1/2 -translate-y-1/2 origin-center before:absolute before:content-[''] before:bg-transparent before:w-8 before:h-10 before:top-1/2 before:left-1/2 before:-translate-y-1/2 before:-translate-x-1/2`}
    >
        <div className={`absolute inset-0 bg-slate-700/50 border-2 ${borderStyle} rounded-full`} />

        {/* Percentage Label */}
        <div key={`${mode}-label`} className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <span ref={labelRef} className="text-white font-mono font-medium text-[10px] select-none">
                {Math.round(value)}
            </span>
        </div>
    </div>
));
SliderHandle.displayName = 'SliderHandle';
