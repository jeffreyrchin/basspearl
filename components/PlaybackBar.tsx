import React from 'react';

interface PlaybackBarProps {
    isPlaying: boolean;
    audioFile: File | null;
    isProcessing: boolean;
    formatTime: (seconds: number) => string;
    currentTime: number;
    duration: number;
    currentTimeLabelRef: React.RefObject<HTMLSpanElement>;
    scrubberRef: React.RefObject<HTMLInputElement>;
    isDraggingScrubberRef: React.MutableRefObject<boolean>;
    onPlayPause: () => void;
    onScrubberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PlaybackBar: React.FC<PlaybackBarProps> = ({
    isPlaying,
    audioFile,
    isProcessing,
    formatTime,
    currentTime,
    duration,
    currentTimeLabelRef,
    scrubberRef,
    isDraggingScrubberRef,
    onPlayPause,
    onScrubberChange
}) => {
    return (
        <div className="flex-1 flex items-center px-3 sm:px-6 gap-2 sm:gap-4 min-w-0">
            {/* Play/Pause */}
            <button
                onClick={onPlayPause}
                disabled={!audioFile || isProcessing}
                title={isPlaying ? "Pause" : "Play"}
                aria-label={isPlaying ? "Pause" : "Play"}
                className={`h-9 px-4 shrink-0 rounded-xl flex items-center justify-center transition-all border bg-white/5 border-white/10 text-white hover:bg-white/10 disabled:bg-white/5 disabled:border-white/5 disabled:text-white/40 ${isPlaying && 'bg-primary/20 border-primary/40 shadow-[inset_0_0_10px_rgba(59,130,246,0.2)] text-primary'}`}>
                <span className="material-symbols-outlined text-base">{isPlaying ? 'pause' : 'play_arrow'}</span>
            </button>

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
                step={0.1}
                defaultValue={currentTime}
                onPointerDown={() => isDraggingScrubberRef.current = true}
                onChange={onScrubberChange}
                disabled={!audioFile || isProcessing}
                title="Seek"
                aria-label="Seek"
                className={`flex-1 h-[3px] min-w-0 rounded-full appearance-none bg-white/10 accent-white focus:outline-none transition-all ${isProcessing ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`} />

            {/* Duration */}
            <span className="text-[9px] sm:text-[10px] font-mono text-white/60 shrink-0 w-7 sm:w-8" aria-label="Total duration">
                {formatTime(duration)}
            </span>
        </div>
    );
};

export default PlaybackBar;
