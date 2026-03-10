import React, { useRef, useState, useEffect, useCallback, memo } from 'react';
import { FrequencyBand } from '../types';
import { SHARED_AUDIO_STATE, BAND_INDEX } from '../services/audioState';

interface AdaptiveSliderProps {
    value: number;
    min: number;
    frequencyBand: FrequencyBand;
    onChange: (update: { value?: number, min?: number }) => void;
    onPointerDown?: () => void;
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
    onPointerDown
}) => {
    // --- Refs for Performance & Animation ---
    const trackRef = useRef<HTMLDivElement>(null);
    const needleRef = useRef<HTMLDivElement>(null);
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

    // Memoized Drag Initialization
    const handleDragStart = useCallback((clientX: number, mode: Mode) => {
        if (mode === 'none' || !trackRef.current) return;

        const rect = trackRef.current.getBoundingClientRect();
        startTrackWidthRef.current = rect.width - 20; // 10px padding on each side
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
        if (dragMode === 'none' || !isReactive) return;

        const handleMove = (e: MouseEvent | TouchEvent) => {
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const deltaPercent = ((clientX - startXRef.current) / startTrackWidthRef.current) * 100;

            if (dragMode === 'left') {
                const newMin = Math.max(0, Math.min(100, Math.round(startMinRef.current + deltaPercent)));
                if (newMin !== currentMinRef.current) onChangeRef.current({ min: newMin });
            } else if (dragMode === 'right') {
                const newMax = Math.max(0, Math.min(100, Math.round(startMaxRef.current + deltaPercent)));
                if (newMax !== currentMaxRef.current) onChangeRef.current({ value: newMax });
            } else if (dragMode === 'middle') {
                const shift = Math.round(deltaPercent);
                const newMin = startMinRef.current + shift;
                const newMax = startMaxRef.current + shift;

                if (newMin >= 0 && newMin <= 100 && newMax >= 0 && newMax <= 100) {
                    if (newMin !== currentMinRef.current || newMax !== currentMaxRef.current) {
                        onChangeRef.current({ min: newMin, value: newMax });
                    }
                }
            }
        };

        const handleEnd = () => setDragMode('none');

        window.addEventListener('pointermove', handleMove, { passive: true });
        window.addEventListener('pointerup', handleEnd);

        return () => {
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleEnd);
        };
    }, [dragMode, isReactive]);

    if (isReactive) {
        return (
            <div className={`relative h-10 flex items-center mb-3`} onPointerDown={onPointerDown}>
                {/* Reactive Slider */}
                <div key="reactive" className="relative w-full" ref={trackRef}>
                    {/* Visual Track (Padded to match thumb centers) */}
                    <div className="absolute inset-x-2.5 h-6 bg-black/40 border border-white/5 overflow-hidden rounded-sm top-1/2 -translate-y-1/2 touch-none">
                        <div
                            onPointerDown={(e) => { e.preventDefault(); handleDragStart(e.clientX, 'middle'); }}
                            className="absolute h-full cursor-grab active:cursor-grabbing hover:bg-white/[0.05] transition-colors"
                            style={{
                                left: `${Math.min(min, value)}%`,
                                width: `${Math.abs(value - min)}%`,
                                backgroundColor: 'rgba(255, 255, 255, 0.1)'
                            }}
                        />
                    </div>

                    {/* Interactive Elements Layer */}
                    <div className="absolute inset-x-2.5 inset-y-0 pointer-events-none">
                        <SliderHandle label="Min" value={min} mode="left" onStart={handleDragStart} onKeyUpdate={d => onChangeRef.current({ min: Math.max(0, Math.min(100, min + d)) })} />
                        <SliderHandle label="Max" value={value} mode="right" onStart={handleDragStart} onKeyUpdate={d => onChangeRef.current({ value: Math.max(0, Math.min(100, value + d)) })} />

                        <div ref={needleRef} className="absolute h-6 pointer-events-none z-10 top-1/2 -translate-y-1/2"
                            style={{ left: `${min}%`, width: '2px', backgroundColor: '#fb00ff', boxShadow: '0 0 8px rgba(251, 0, 255, 0.5)' }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative h-10 flex items-center mb-1`} onPointerDown={onPointerDown}>
            {/* Manual/Static Slider */}
            <div key="static" className="relative flex-1 group/static">
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={value}
                    onChange={(e) => {
                        const nextVal = parseInt(e.target.value);
                        if (nextVal !== value) onChange({ value: nextVal });
                    }}
                    className="w-full h-10 bg-transparent appearance-none cursor-pointer custom-slider relative z-10 touch-none"
                />
                <div className="absolute inset-x-2.5 inset-y-0 pointer-events-none">
                    <div key="manual-label" className="absolute" style={{ left: `${value}%`, top: 28, transform: 'translateX(-50%)' }}>
                        <span className="text-white/60 font-mono font-medium text-[10px] select-none">{Math.round(value)}%</span>
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
    onKeyUpdate: (d: number) => void
}>(({ label, value, mode, onStart, onKeyUpdate }) => (
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
            if (e.key === 'ArrowLeft') onKeyUpdate(e.shiftKey ? -10 : -1);
            if (e.key === 'ArrowRight') onKeyUpdate(e.shiftKey ? 10 : 1);
        }}
        className="absolute w-6 h-6 cursor-ew-resize z-20 top-1/2 group/handle outline-none focus-visible:ring-1 focus-visible:ring-primary/60 rounded-sm pointer-events-auto touch-none"
        style={{ left: `${value}%`, transform: 'translate(-50%, -50%)' }}
    >
        {/* Bar */}
        <div className={`absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-2 bg-[silver] ${mode === 'left' ? 'rounded-l' : 'rounded-r'} group-hover/handle:scale-110 transition-all`} />

        {/* Percentage */}
        <div key={`${mode}-label`} className={`absolute left-1/2 top-5 -translate-x-1/2`}>
            <span className="text-white/60 font-mono font-medium text-[10px] select-none">
                {Math.round(value)}%
            </span>
        </div>
    </div>
));
SliderHandle.displayName = 'SliderHandle';
