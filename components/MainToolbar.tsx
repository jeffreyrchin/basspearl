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
}

const ToolbarButton: React.FC<{
    onClick: () => void;
    icon: string;
    title: string;
    isActive?: boolean;
    activeBg?: string;
    activeBorder?: string;
    colorHex?: string;
    showDot?: boolean;
    className?: string;
}> = ({ onClick, icon, title, isActive, activeBg, activeBorder, colorHex, showDot, className = "w-12" }) => {
    const baseClass = "h-9 flex items-center justify-center rounded-xl border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2";
    const idleClass = "border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10 text-white";
    const activeStyles = isActive ? `${activeBg} ${activeBorder}` : idleClass;

    return (
        <button
            type="button"
            onClick={onClick}
            onPointerDown={(e) => e.stopPropagation()}
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
}) => {
    const focusStack = useEffectStore(s => s.focusStack);
    const pushFocus = useEffectStore(s => s.pushFocus);
    const removeFocus = useEffectStore(s => s.removeFocus);
    const isLibraryOpen = focusStack.includes('library');
    const isSidebarOpen = useEffectStore(s => s.isSidebarOpen);
    const setIsSidebarOpen = useEffectStore(s => s.setIsSidebarOpen);

    const constraintsRef = useRef(null);

    return (
        <div className="absolute inset-0 z-fab pointer-events-none overflow-hidden" ref={constraintsRef}>
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center p-4">
                <motion.div
                    drag
                    dragConstraints={constraintsRef}
                    dragMomentum={false}
                    dragElastic={0}
                    className="h-14 bg-[#0A0F1E]/80 backdrop-blur-2xl border border-white/10 rounded-2xl flex items-center pl-3 pr-6 gap-4 shadow-[0_12px_48px_rgba(0,0,0,0.5),0_0_20px_rgba(251,0,255,0.08)] ring-1 ring-white/5 pointer-events-auto overflow-x-auto no-scrollbar group cursor-default"
                >
                    {/* Drag Handle */}
                    <div className="flex items-center justify-center w-8 h-8 cursor-grab active:cursor-grabbing hover:bg-white/5 rounded-lg transition-colors group/handle shrink-0">
                        <span className="material-symbols-outlined text-[18px] text-white/60 group-hover/handle:text-white/60 transition-colors select-none">
                            drag_indicator
                        </span>
                    </div>

                    {/* Local Assets Group */}
                    <div className="flex items-center gap-3 shrink-0">
                        {/* Choose Image */}
                        <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*, .jpg, .jpeg, .png, .webp, .heic"
                            onChange={handleImageUpload}
                            onClick={(e) => { (e.target as HTMLInputElement).value = ''; }} // Clear input so onChange always fires
                            title="Choose Image"
                            className="sr-only"
                        />
                        <ToolbarButton
                            onClick={() => imageInputRef.current?.click()}
                            icon="image"
                            title="Choose Image"
                            isActive={!!imageFile}
                            colorHex="#00F0FF"
                            activeBg="bg-[#00F0FF]/5 hover:bg-[#00F0FF]/10"
                            activeBorder="border-[#00F0FF]/30 hover:border-[#00F0FF]/50"
                            showDot={!!imageFile}
                            className="px-4"
                        />

                        {/* Choose Audio */}
                        <input
                            ref={audioInputRef}
                            type="file"
                            accept="audio/*, .mp3, .wav, .m4a, .aac, .ogg"
                            onChange={handleAudioUpload}
                            onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                            title="Choose Audio"
                            className="sr-only"
                        />
                        <ToolbarButton
                            onClick={() => audioInputRef.current?.click()}
                            icon="graphic_eq"
                            title="Choose Audio"
                            isActive={!!audioFile}
                            colorHex="#3B82F6"
                            activeBg="bg-[#3B82F6]/5 hover:bg-[#3B82F6]/10"
                            activeBorder="border-[#3B82F6]/30 hover:border-[#3B82F6]/50"
                            showDot={!!audioFile && !isLiveMode}
                            className="px-4"
                        />

                        {/* Microphone Input */}
                        <ToolbarButton
                            onClick={startMic}
                            icon="mic"
                            title="Live Audio"
                            isActive={isLiveMode}
                            colorHex="#FF0055"
                            activeBg="bg-[#FF0055]/5 hover:bg-[#FF0055]/10"
                            activeBorder="border-[#FF0055]/30 hover:border-[#FF0055]/50"
                            showDot={isLiveMode}
                            className="px-4"
                        />
                    </div>

                    {/* Divider */}
                    <div className="hidden lg:block w-px h-6 bg-white/10 shrink-0" />

                    {/* Sidebar Toggles (Desktop only in header) */}
                    <div className="hidden lg:flex items-center gap-2">
                        <ToolbarButton
                            onClick={() => {
                                setIsSidebarOpen(!isSidebarOpen);
                            }}
                            icon="layers"
                            title={isSidebarOpen ? "Close Pipeline (P)" : "Open Pipeline (P)"}
                            isActive={isSidebarOpen}
                            activeBg="bg-white/10"
                            activeBorder="border-white/30"
                        />
                        <ToolbarButton
                            onClick={() => {
                                if (isLibraryOpen) removeFocus('library');
                                else pushFocus('library');
                            }}
                            icon="add_circle"
                            title={isLibraryOpen ? "Close Library (Y)" : "Open Library (Y)"}
                            isActive={isLibraryOpen}
                            activeBg="bg-white/10"
                            activeBorder="border-white/30"
                        />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default MainToolbar;
