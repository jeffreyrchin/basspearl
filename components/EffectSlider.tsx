
import React from 'react';

interface EffectSliderProps {
    value: number;
    min?: number;
    max?: number;
    onChange: (value: number) => void;
    onCommit: () => void;
    className?: string;
}

export const EffectSlider: React.FC<EffectSliderProps> = ({
    value,
    min = 0,
    max = 100,
    onChange,
    onCommit,
    className = ''
}) => {
    return (
        <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            onMouseUp={onCommit}
            onTouchEnd={onCommit}
            className={`w-full h-6 bg-transparent appearance-none cursor-pointer custom-slider ${className}`}
        />
    );
};
