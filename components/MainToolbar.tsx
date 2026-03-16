import React from 'react';
import { useEffectStore } from '../store/useEffectStore';

interface MainToolbarProps {
    imageInputRef: React.RefObject<HTMLInputElement>;
    audioInputRef: React.RefObject<HTMLInputElement>;
    imageFile: File | null;
    audioFile: File | null;
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleAudioUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
}) => {
    const isLibraryOpen = useEffectStore(s => s.isLibraryOpen);
    const setIsLibraryOpen = useEffectStore(s => s.setIsLibraryOpen);
    const isSidebarOpen = useEffectStore(s => s.isSidebarOpen);
    const setIsSidebarOpen = useEffectStore(s => s.setIsSidebarOpen);
    return (
        <div className="h-14 border-b border-white/5 bg-white/5 flex items-center justify-center px-6 gap-4 shrink-0 overflow-x-auto no-scrollbar">
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
                    showDot={!!audioFile}
                    className="px-4"
                />
            </div>

            {/* Sidebar Toggles (Desktop only in header) */}
            <div className="hidden lg:flex items-center ml-4 gap-2">
                <ToolbarButton
                    onClick={() => {
                        setIsSidebarOpen(!isSidebarOpen);
                    }}
                    icon="layers"
                    title={isSidebarOpen ? "Close Pipeline" : "Open Pipeline"}
                    isActive={isSidebarOpen}
                    activeBg="bg-white/10"
                    activeBorder="border-white/30"
                />
                <ToolbarButton
                    onClick={() => {
                        setIsLibraryOpen(!isLibraryOpen);
                    }}
                    icon="add_circle"
                    title={isLibraryOpen ? "Close Effects" : "Add Effect"}
                    isActive={isLibraryOpen}
                    activeBg="bg-white/10"
                    activeBorder="border-white/30"
                />
            </div>
        </div>
    );
};

export default MainToolbar;
