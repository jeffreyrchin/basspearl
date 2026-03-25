import React from 'react';

interface PlaybackBarProps {
    audioFile: File | null;
    isProcessing: boolean;
    formatTime: (seconds: number) => string;
    currentTime: number;
    duration: number;
    currentTimeLabelRef: React.RefObject<HTMLSpanElement>;
    scrubberRef: React.RefObject<HTMLInputElement>;
    isDraggingScrubberRef: React.MutableRefObject<boolean>;
    onScrubberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PlaybackBar: React.FC<PlaybackBarProps> = ({
    audioFile,
    isProcessing,
    formatTime,
    currentTime,
    duration,
    currentTimeLabelRef,
    scrubberRef,
    isDraggingScrubberRef,
    onScrubberChange
}) => {
    return (
        <div className="flex-1 flex items-center px-3 sm:px-6 gap-2 sm:gap-4 min-w-0">
            {/* Current Time */}
            <span
                ref={currentTimeLabelRef}
                className="text-[9px] sm:text-[10px] font-mono text-white/60 shrink-0 w-7 sm:w-8"
                aria-label="Current playback time">
                {formatTime(currentTime)}
            </span>

            {/* Scrubber */}
            <input
                ref={scrubberRef}
                type="range"
                min={0}
                max={duration || 0}
                step="any"
                defaultValue={currentTime}
                onPointerDown={() => isDraggingScrubberRef.current = true}
                onChange={onScrubberChange}
                disabled={!audioFile || isProcessing}
                title="Seek"
                aria-label="Seek"
                className={`flex-1 h-10 min-w-0 bg-transparent rounded-full cursor-pointer scrubber-slider focus:outline-none transition-all ${isProcessing ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`} />

            {/* Duration */}
            <span className="text-[9px] sm:text-[10px] font-mono text-white/60 shrink-0" aria-label="Total duration">
                {formatTime(duration)}
            </span>
        </div>
    );
};

export default PlaybackBar;
