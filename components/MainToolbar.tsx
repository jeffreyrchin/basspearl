import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useEffectStore } from '../store/useEffectStore';

interface MainToolbarProps {
    imageInputRef: React.RefObject<HTMLInputElement>;
    audioInputRef: React.RefObject<HTMLInputElement>;
    imageFile: File | null;
    audioFile: File | null;
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleAudioUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isLiveMode: boolean;
    startMic: () => void;
    onPlayPause: () => void;
    isPlaying: boolean;
    isProcessing: boolean;
    onScrub: (delta: number) => void;
}

const ToolbarButton: React.FC<{
    onClick?: () => void;
    onPointerDown?: () => void;
    icon: string;
    title: string;
    isActive?: boolean;
    activeBg?: string;
    activeBorder?: string;
    colorHex?: string;
    showDot?: boolean;
    className?: string;
    disabled?: boolean;
}> = ({ onClick, onPointerDown, icon, title, isActive, activeBg, activeBorder, colorHex, showDot, className = "w-12", disabled }) => {
    const baseClass = "h-9 flex items-center justify-center rounded-xl border transition-all duration-200 outline-none focus-visible:ring-2 disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none";
    const idleClass = "border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10 text-white";
    const activeStyles = isActive ? `${activeBg} ${activeBorder}` : idleClass;

    return (
        <button
            type="button"
            onClick={() => onClick?.()}
            onPointerDown={(e) => { e.stopPropagation(); onPointerDown?.() }}
            disabled={disabled}
            className={`${baseClass} ${activeStyles} ${className}`}
            title={title}
        >
            <span
                className="material-symbols-outlined text-base"
                style={{ color: isActive ? colorHex : undefined }}
            >
                {icon}
            </span>
            {showDot && (
                <span
                    className="ml-2 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: colorHex }}
                />
            )}
        </button>
    );
};

const MainToolbar: React.FC<MainToolbarProps> = ({
    imageInputRef,
    audioInputRef,
    imageFile,
    audioFile,
    handleImageUpload,
    handleAudioUpload,
    isLiveMode,
    startMic,
    onPlayPause,
    isPlaying,
    isProcessing,
    onScrub
}) => {
    const focusStack = useEffectStore(s => s.focusStack);
    const pushFocus = useEffectStore(s => s.pushFocus);
    const removeFocus = useEffectStore(s => s.removeFocus);
    const isLibraryOpen = focusStack.includes('library');
    const isInspectorOpen = focusStack.includes('inspector');
    const isSidebarOpen = useEffectStore(s => s.isSidebarOpen);
    const setIsSidebarOpen = useEffectStore(s => s.setIsSidebarOpen);

    const constraintsRef = useRef(null);

    return (
        <div className="absolute inset-0 z-toolbar pointer-events-none overflow-hidden" ref={constraintsRef}>
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center p-20">
                <motion.div
                    drag
                    dragConstraints={constraintsRef}
                    dragMomentum={false}
                    dragElastic={0}
                    className="h-14 bg-[#0A0F1E]/95 border border-white/10 rounded-2xl flex items-center pl-2 pr-4 gap-2 shadow-[0_12px_48px_rgba(0,0,0,0.5),0_0_20px_rgba(251,0,255,0.08)] ring-1 ring-white/5 pointer-events-auto overflow-x-auto no-scrollbar group cursor-default"
                >
                    {/* Drag Handle */}
                    <div className="flex items-center justify-center w-8 h-8 cursor-grab active:cursor-grabbing hover:bg-white/5 rounded-lg transition-colors group/handle shrink-0">
                        <span className="material-symbols-outlined text-[18px] text-white/60 group-hover/handle:text-white/60 transition-colors select-none">
                            drag_indicator
                        </span>
                    </div>

                    {/* Toolbar Buttons */}
                    <div className="flex items-center gap-3 shrink-0">
                        {/* Choose Image */}
                        <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*, .jpg, .jpeg, .png, .webp, .heic"
                            onChange={handleImageUpload}
                            title="Choose Image"
                            className="sr-only"
                        />
                        <ToolbarButton
                            onClick={() => imageInputRef.current && (imageInputRef.current.value = '', imageInputRef.current.click())} // Clear input so onChange always fires
                            icon="image"
                            title="Choose Image"
                            isActive={!!imageFile}
                            colorHex="#00F0FF"
                            activeBg="bg-[#00F0FF]/5 hover:bg-[#00F0FF]/10"
                            activeBorder="border-[#00F0FF]/30 hover:border-[#00F0FF]/50"
                            showDot={!!imageFile}
                            className="px-3"
                        />

                        {/* Choose Audio */}
                        <input
                            ref={audioInputRef}
                            type="file"
                            accept="audio/*, .mp3, .wav, .m4a, .aac, .ogg"
                            onChange={handleAudioUpload}
                            title="Choose Audio"
                            className="sr-only"
                        />
                        <ToolbarButton
                            onClick={() => audioInputRef.current && (audioInputRef.current.value = '', audioInputRef.current.click())}
                            icon="graphic_eq"
                            title="Choose Audio"
                            isActive={!!audioFile}
                            colorHex="#3B82F6"
                            activeBg="bg-[#3B82F6]/5 hover:bg-[#3B82F6]/10"
                            activeBorder="border-[#3B82F6]/30 hover:border-[#3B82F6]/50"
                            showDot={!!audioFile && !isLiveMode}
                            className="px-3"
                        />

                        {/* Microphone Input */}
                        <ToolbarButton
                            onPointerDown={startMic}
                            icon="mic"
                            title="Live Audio"
                            isActive={isLiveMode}
                            colorHex="#FF0055"
                            activeBg="bg-[#FF0055]/5 hover:bg-[#FF0055]/10"
                            activeBorder="border-[#FF0055]/30 hover:border-[#FF0055]/50"
                            showDot={isLiveMode}
                            className="px-3"
                        />

                        {/* Seek Backward (Desktop only) */}
                        <ToolbarButton
                            onPointerDown={() => onScrub(-5)}
                            disabled={!audioFile || isProcessing || isLiveMode}
                            title="Seek Backward"
                            aria-label="Seek Backward"
                            icon="fast_rewind"
                            colorHex="white"
                            className="px-2 hidden lg:flex"
                        />

                        {/* Play/Pause */}
                        <ToolbarButton
                            onPointerDown={onPlayPause}
                            disabled={!audioFile || isProcessing || isLiveMode}
                            title={isPlaying ? "Pause" : "Play"}
                            aria-label={isPlaying ? "Pause" : "Play"}
                            icon={isPlaying ? 'pause' : 'play_arrow'}
                            isActive={isPlaying}
                            colorHex="white"
                            activeBg="bg-primary/50"
                            activeBorder="border-primary/50"
                            className="px-3"
                        />

                        {/* Seek Forward (Desktop only) */}
                        <ToolbarButton
                            onPointerDown={() => onScrub(5)}
                            disabled={!audioFile || isProcessing || isLiveMode}
                            title="Seek Forward"
                            aria-label="Seek Forward"
                            icon="fast_forward"
                            colorHex="white"
                            className="px-2 hidden lg:flex"
                        />

                        {/* Open/Close Pipeline */}
                        <ToolbarButton
                            onPointerDown={() => {
                                setIsSidebarOpen(!isSidebarOpen);
                            }}
                            icon="layers"
                            title={isSidebarOpen ? "Close Pipeline (P)" : "Open Pipeline (P)"}
                            isActive={isSidebarOpen}
                            activeBg="bg-white/10"
                            activeBorder="border-white/30"
                            className="px-3"
                        />

                        {/* Library Toggle (Desktop only) */}
                        <ToolbarButton
                            onPointerDown={() => {
                                if (isLibraryOpen) removeFocus('library');
                                else pushFocus('library');
                            }}
                            icon="add_circle"
                            title={isLibraryOpen ? "Close Library (Y)" : "Open Library (Y)"}
                            isActive={isLibraryOpen}
                            activeBg="bg-white/10"
                            activeBorder="border-white/30"
                            className="hidden lg:flex px-3"
                        />

                        {/* Inspector Toggle (Desktop only) */}
                        <ToolbarButton
                            onPointerDown={() => {
                                if (isInspectorOpen) removeFocus('inspector');
                                else pushFocus('inspector');
                            }}
                            icon="info"
                            title={isInspectorOpen ? "Close Inspector (I)" : "Open Inspector (I)"}
                            isActive={isInspectorOpen}
                            activeBg="bg-white/10"
                            activeBorder="border-white/30"
                            className="hidden lg:flex px-3"
                        />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default MainToolbar;
