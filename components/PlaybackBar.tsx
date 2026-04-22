import React from 'react';

const PlaybackButton: React.FC<{
    onClick: () => void;
    icon: string;
    title: string;
    disabled?: boolean;
    isActive?: boolean;
}> = ({ onClick, icon, title, disabled, isActive }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`w-10 h-8 sm:w-12 sm:h-9 flex items-center justify-center rounded-xl transition-all outline-none focus-visible:ring-2 pointer-events-auto shrink-0 ${isActive ? 'bg-white/20 text-white shadow-sm border border-white/5' : 'bg-transparent text-white/60 hover:text-white border border-transparent'} disabled:opacity-30 disabled:cursor-not-allowed`}
            title={title}
        >
            <span className="material-symbols-outlined">{icon}</span>
        </button>
    );
};

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
    onScrub: (delta: number) => void;
    onPlayPause: () => void;
    isPlaying: boolean;
    isLiveMode: boolean;
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
    onScrubberChange,
    onScrub,
    onPlayPause,
    isPlaying,
    isLiveMode
}) => {
    return (
        <div className="w-full h-full flex flex-col justify-center min-w-0 px-3 sm:px-6 py-1 gap-1">
            {/* Scrubber Row */}
            <div className="w-full flex items-center h-4 shrink-0 pointer-events-auto">
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
                    className={`w-full h-full bg-transparent rounded-full cursor-pointer scrubber-slider focus:outline-none transition-all ${isProcessing ? 'opacity-30 cursor-not-allowed' : ''} z-10`}
                />
            </div>

            {/* Controls Row (3 Columns) */}
            <div className="w-full grid grid-cols-3 items-center shrink-0 h-9 sm:h-10">
                {/* Left Column: Current Time */}
                <div className="flex justify-start items-center overflow-hidden">
                    <span
                        ref={currentTimeLabelRef}
                        className="text-[10px] sm:text-[12px] font-mono text-white/60 tracking-wider font-medium select-none truncate"
                        aria-label="Current playback time">
                        {formatTime(currentTime)}
                    </span>
                </div>

                {/* Center Column: Transport Controls */}
                <div className="flex justify-center items-center gap-2 sm:gap-3 shrink-0">
                    <PlaybackButton
                        onClick={() => onScrub(-5)}
                        disabled={!audioFile || isProcessing || isLiveMode}
                        title="Seek Backward"
                        icon="replay_5"
                    />
                    <PlaybackButton
                        onClick={onPlayPause}
                        disabled={!audioFile || isProcessing || isLiveMode}
                        title={isPlaying ? "Pause" : "Play"}
                        icon={isPlaying ? 'pause' : 'play_arrow'}
                        isActive={isPlaying}
                    />
                    <PlaybackButton
                        onClick={() => onScrub(5)}
                        disabled={!audioFile || isProcessing || isLiveMode}
                        title="Seek Forward"
                        icon="forward_5"
                    />
                </div>

                {/* Right Column: Duration */}
                <div className="flex justify-end items-center overflow-hidden">
                    <span className="text-[10px] sm:text-[12px] font-mono text-white/60 tracking-wider font-medium select-none truncate" aria-label="Total duration">
                        {formatTime(duration)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default PlaybackBar;
