import React, { useRef, useState, useEffect } from 'react';
import { FrequencyBand } from '../types';

interface AdaptiveSliderProps {
    value: number;
    min: number;
    reactive: boolean;
    frequencyBand: FrequencyBand;
    onChange: (update: { value?: number, min?: number }) => void;
    className?: string;
}

export const AdaptiveSlider: React.FC<AdaptiveSliderProps> = ({
    value,
    min,
    reactive,
    frequencyBand,
    onChange,
    className = ''
}) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const [dragMode, setDragMode] = useState<'none' | 'left' | 'right' | 'middle'>('none');
    const startXRef = useRef(0);
    const startMinRef = useRef(0);
    const startMaxRef = useRef(0);

    const cssVarMap = {
        'SUB': '--audio-sub',
        'BASS': '--audio-bass',
        'MID': '--audio-mid',
        'TREBLE': '--audio-treble'
    };

    const handleStart = (clientX: number, mode: 'left' | 'right' | 'middle') => {
        setDragMode(mode);
        startXRef.current = clientX;
        startMinRef.current = min;
        startMaxRef.current = value;
    };

    const handleMouseDown = (e: React.MouseEvent, mode: 'left' | 'right' | 'middle') => {
        e.preventDefault();
        handleStart(e.clientX, mode);
    };

    const handleTouchStart = (e: React.TouchEvent, mode: 'left' | 'right' | 'middle') => {
        handleStart(e.touches[0].clientX, mode);
    };

    useEffect(() => {
        const handleMove = (clientX: number) => {
            if (dragMode === 'none' || !trackRef.current) return;

            const rect = trackRef.current.getBoundingClientRect();
            const deltaPercent = ((clientX - startXRef.current) / rect.width) * 100;

            if (dragMode === 'left') {
                onChange({ min: Math.max(0, Math.min(100, Math.round(startMinRef.current + deltaPercent))) });
            } else if (dragMode === 'right') {
                onChange({ value: Math.max(0, Math.min(100, Math.round(startMaxRef.current + deltaPercent))) });
            } else if (dragMode === 'middle') {
                const shift = Math.round(deltaPercent);
                const newMin = startMinRef.current + shift;
                const newMax = startMaxRef.current + shift;

                if (newMin >= 0 && newMax <= 100) {
                    onChange({ min: newMin, value: newMax });
                }
            }
        };

        const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
        const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
        const onEnd = () => setDragMode('none');

        if (dragMode !== 'none') {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onEnd);
            window.addEventListener('touchmove', onTouchMove, { passive: false });
            window.addEventListener('touchend', onEnd);
        }

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onEnd);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onEnd);
        };
    }, [dragMode, onChange]);

    if (reactive) {
        const left = Math.min(min, value);
        const width = Math.abs(value - min);

        return (
            <div className={`relative pt-3 pb-5 ${className}`}>
                <div
                    ref={trackRef}
                    className="relative w-full h-5 bg-black/40 border border-white/5 overflow-hidden select-none"
                >
                    {/* Range Bar Area */}
                    <div
                        onMouseDown={(e) => handleMouseDown(e, 'middle')}
                        onTouchStart={(e) => handleTouchStart(e, 'middle')}
                        className="absolute h-full cursor-grab active:cursor-grabbing hover:bg-white/[0.05] transition-colors"
                        style={{ left: `${left}%`, width: `${width}%`, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                    />

                    {/* Hit Area & Visual Handle: Left (Min) */}
                    <div
                        role="slider"
                        aria-label="Minimum Range"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={min}
                        tabIndex={0}
                        onMouseDown={(e) => handleMouseDown(e, 'left')}
                        onTouchStart={(e) => handleTouchStart(e, 'left')}
                        onKeyDown={(e) => {
                            if (e.key === 'ArrowLeft') onChange({ min: Math.max(0, min - (e.shiftKey ? 10 : 1)) });
                            if (e.key === 'ArrowRight') onChange({ min: Math.min(100, min + (e.shiftKey ? 10 : 1)) });
                        }}
                        className="absolute w-6 h-full cursor-ew-resize z-20 group/handle outline-none"
                        style={{ left: `${min}%`, transform: 'translateX(-50%)' }}
                    >
                        <div className="absolute left-1/2 -translate-x-1/2 w-1 h-full bg-white transition-all group-hover/handle:scale-x-150 group-focus/handle:scale-x-150 group-hover/handle:bg-primary group-focus/handle:bg-primary" />
                    </div>

                    {/* Hit Area & Visual Handle: Right (Max) */}
                    <div
                        role="slider"
                        aria-label="Maximum Range"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={value}
                        tabIndex={0}
                        onMouseDown={(e) => handleMouseDown(e, 'right')}
                        onTouchStart={(e) => handleTouchStart(e, 'right')}
                        onKeyDown={(e) => {
                            if (e.key === 'ArrowLeft') onChange({ value: Math.max(0, value - (e.shiftKey ? 10 : 1)) });
                            if (e.key === 'ArrowRight') onChange({ value: Math.min(100, value + (e.shiftKey ? 10 : 1)) });
                        }}
                        className="absolute w-6 h-full cursor-ew-resize z-20 group/handle outline-none"
                        style={{ left: `${value}%`, transform: 'translateX(-50%)' }}
                    >
                        <div className="absolute left-1/2 -translate-x-1/2 w-1 h-full bg-white transition-all group-hover/handle:scale-x-150 group-focus/handle:scale-x-150 group-hover/handle:bg-primary group-focus/handle:bg-primary" />
                    </div>

                    {/* The Needle */}
                    <div
                        className="absolute inset-y-0 w-0.5 pointer-events-none z-10"
                        style={{
                            left: `calc(${min}% + (${value - min}% * var(${cssVarMap[frequencyBand] || '--audio-bass'}, 0)))`,
                            backgroundColor: '#fb00ff'
                        }}
                    />
                </div>

                {/* Combined Floating Labels */}
                <div className="absolute pointer-events-none w-full inset-0">
                    <div className="absolute" style={{ left: `${min}%`, bottom: 0, transform: 'translateX(-50%)' }}>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-white/60 whitespace-nowrap">
                            Min
                        </span>
                    </div>
                    <div className="absolute" style={{ left: `${value}%`, bottom: 0, transform: 'translateX(-50%)' }}>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-white/60 whitespace-nowrap">
                            Max
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-3 py-1 ${className}`}>
            <input
                type="range"
                min={0}
                max={100}
                value={value}
                onChange={(e) => onChange({ value: parseInt(e.target.value) })}
                className="flex-1 h-6 bg-transparent appearance-none cursor-pointer custom-slider"
            />
        </div>
    );
};
