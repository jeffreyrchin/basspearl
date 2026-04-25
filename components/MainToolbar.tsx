import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useEffectStore } from '../store/useEffectStore';

interface MainToolbarProps {
    audioInputRef: React.RefObject<HTMLInputElement>;
    audioFile: File | null;
    handleAudioUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isLiveMode: boolean;
    liveSourceType: 'mic' | 'tab' | null;
    isTabAudioUnsupported: boolean;
    startMic: () => void;
    startTabAudio: () => void;
    isProcessing: boolean;
    openExportModal: () => void;
    isExporting: boolean;
}

const ToolbarRow: React.FC<{
    onClick?: () => void;
    icon: string;
    label: string;
    shortcut?: string;
    isActive?: boolean;
    disabled?: boolean;
    colorHex?: string;
    activeBg?: string;
    activeBorder?: string;
    showDot?: boolean;
    className?: string;
    isCollapsed?: boolean;
}> = ({ onClick, icon, label, shortcut, isActive, disabled, colorHex, activeBg, activeBorder, showDot, className = "", isCollapsed = false }) => {
    const baseClass = `w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} h-8 shrink-0 rounded-lg border transition-all outline-none focus-visible:ring-2 disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none select-none text-left group/row relative`;

    let textClass = "text-white/80 hover:text-white";
    let bgClass = "bg-transparent hover:bg-white/5";
    let borderClass = "border-transparent";

    if (isActive) {
        textClass = "text-white";
        bgClass = activeBg || "bg-white/10";
        borderClass = activeBorder || "border-white/10";
    }

    return (
        <button
            type="button"
            onClick={() => onClick?.()}
            onPointerDownCapture={(e) => { e.stopPropagation(); }}
            disabled={disabled}
            className={`${baseClass} ${bgClass} ${borderClass} ${textClass} ${className}`}
            title={label}
        >
            <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'gap-3'}`}>
                <div className="relative flex items-center justify-center w-5 shrink-0">
                    <span
                        className="material-symbols-outlined !text-[20px] text-center"
                        style={{ color: isActive && colorHex ? colorHex : (isActive && isCollapsed ? 'white' : undefined) }}
                    >
                        {icon}
                    </span>
                </div>
                {!isCollapsed && (
                    <span className="text-[13px] font-medium tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">{label}</span>
                )}
            </div>

            {shortcut && !isCollapsed && (
                <div className="flex items-center pr-1 shrink-0">
                    <span className={`text-[12px] font-medium mb-0.5 transition-colors ${isActive ? 'text-white' : 'text-white/80 group-hover/row:text-white'}`}>{shortcut}</span>
                </div>
            )}

            {showDot && (
                <span
                    className={`${isCollapsed ? 'absolute top-1/2 -translate-y-1/2 -left-2 w-0.5 h-4 rounded-full' : 'w-2 h-2 rounded-full'}`}
                    style={{ backgroundColor: colorHex, boxShadow: `0 0 8px ${colorHex}` }}
                />
            )}
        </button>
    )
}

const MainToolbar: React.FC<MainToolbarProps> = ({
    audioInputRef,
    audioFile,
    handleAudioUpload,
    isLiveMode,
    liveSourceType,
    isTabAudioUnsupported,
    startMic,
    startTabAudio,
    isProcessing,
    openExportModal,
    isExporting
}) => {
    const focusStack = useEffectStore(s => s.focusStack);
    const pushFocus = useEffectStore(s => s.pushFocus);
    const removeFocus = useEffectStore(s => s.removeFocus);
    const isLibraryOpen = focusStack.includes('library');
    const isInspectorOpen = focusStack.includes('inspector');
    const isSidebarOpen = useEffectStore(s => s.isSidebarOpen);
    const setIsSidebarOpen = useEffectStore(s => s.setIsSidebarOpen);
    const setIsUiHidden = useEffectStore(s => s.setIsUiHidden);
    const isSceneHotbarOpen = useEffectStore(s => s.isSceneHotbarOpen);
    const setIsSceneHotbarOpen = useEffectStore(s => s.setIsSceneHotbarOpen);
    const isPuzzlesModalOpen = useEffectStore(s => s.isPuzzlesModalOpen);
    const setIsPuzzlesModalOpen = useEffectStore(s => s.setIsPuzzlesModalOpen);

    const constraintsRef = useRef(null);
    const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);

    return (
        <div className="absolute inset-0 z-toolbar pointer-events-none overflow-hidden" ref={constraintsRef}>
            <div className="absolute left-8 flex items-center justify-start pt-15">
                <motion.div
                    drag
                    dragConstraints={constraintsRef}
                    dragMomentum={false}
                    dragElastic={0}
                    className="relative flex flex-row items-center pointer-events-auto group/toolbar shadow-[0_16px_48px_rgba(0,0,0,0.5)] rounded-xl"
                >
                    <motion.div
                        animate={{ width: isToolbarCollapsed ? 60 : 200 }}
                        transition={{ duration: 0.3, type: "spring", bounce: 0, ease: "easeInOut" }}
                        className="bg-[#0a0a1a] border border-white/10 rounded-xl flex flex-col p-2 overflow-y-auto overflow-x-hidden no-scrollbar cursor-default relative z-10"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-center w-full h-4 mb-2 shrink-0 z-10 cursor-grab active:cursor-grabbing group/handle relative">
                            {/* Drag Handle */}
                            <div className={`${isToolbarCollapsed ? 'w-0' : 'w-10'} h-1 bg-white/80 rounded-full group-hover/handle:bg-white transition-colors`} />

                            {/* Collapse Toggle */}
                            <button
                                className={`absolute ${isToolbarCollapsed ? 'left-1/2 -translate-x-1/2' : 'right-0'} top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-all cursor-pointer`}
                                onClick={() => setIsToolbarCollapsed(!isToolbarCollapsed)}
                                onPointerDownCapture={(e) => { e.stopPropagation(); }}
                                title={isToolbarCollapsed ? "Expand Toolbar" : "Collapse Toolbar"}
                            >
                                <span className="material-symbols-outlined !text-[20px]">
                                    {isToolbarCollapsed ? 'chevron_right' : 'chevron_left'}
                                </span>
                            </button>
                        </div>

                        {/* Toolbar Buttons */}
                        <div className="flex flex-col w-full px-1 pb-1">
                            {/* Audio Sources */}
                            <div className="flex flex-col gap-1 mb-2">
                                {/* Audio File */}
                                <input
                                    ref={audioInputRef}
                                    type="file"
                                    accept="audio/*, .mp3, .wav, .m4a, .aac, .ogg"
                                    onChange={handleAudioUpload}
                                    title="Audio File"
                                    className="sr-only"
                                />
                                <ToolbarRow
                                    onClick={() => audioInputRef.current && (audioInputRef.current.value = '', audioInputRef.current.click())}
                                    icon="audio_file"
                                    label="Audio File"
                                    isCollapsed={isToolbarCollapsed}
                                    isActive={!!audioFile && !isLiveMode}
                                    colorHex="#22D3EE"
                                    activeBg="bg-[#22D3EE]/10"
                                    activeBorder="border-[#22D3EE]/30"
                                    showDot={!!audioFile && !isLiveMode}
                                />

                                {/* Microphone */}
                                <ToolbarRow
                                    onClick={startMic}
                                    icon="mic"
                                    label="Microphone"
                                    isCollapsed={isToolbarCollapsed}
                                    isActive={isLiveMode && liveSourceType === 'mic'}
                                    colorHex="#F87171"
                                    activeBg="bg-[#F87171]/10"
                                    activeBorder="border-[#F87171]/30"
                                    showDot={isLiveMode && liveSourceType === 'mic'}
                                />

                                {/* Tab Audio (Desktop only) */}
                                <ToolbarRow
                                    onClick={startTabAudio}
                                    icon="present_to_all"
                                    label="Tab Audio"
                                    isCollapsed={isToolbarCollapsed}
                                    isActive={isLiveMode && liveSourceType === 'tab'}
                                    colorHex={isTabAudioUnsupported ? "#666" : "#C084FC"}
                                    activeBg="bg-[#C084FC]/10"
                                    activeBorder="border-[#C084FC]/30"
                                    showDot={isLiveMode && liveSourceType === 'tab'}
                                    className="hidden lg:flex"
                                />
                            </div>

                            <div className="h-[1px] bg-white/5 mx-2 mb-3 mt-1" />

                            {/* Window Toggles */}
                            <div className="flex flex-col gap-1">
                                {/* Pipeline Toggle */}
                                <ToolbarRow
                                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                    icon="format_list_bulleted"
                                    label="Pipeline"
                                    shortcut="P"
                                    isCollapsed={isToolbarCollapsed}
                                    isActive={isSidebarOpen}
                                />

                                {/* Library Toggle */}
                                <ToolbarRow
                                    onClick={() => {
                                        if (isLibraryOpen) removeFocus('library');
                                        else pushFocus('library');
                                    }}
                                    icon="add_circle"
                                    label="Library"
                                    shortcut="Y"
                                    isCollapsed={isToolbarCollapsed}
                                    isActive={isLibraryOpen}
                                />

                                {/* Puzzles Toggle */}
                                {/* <ToolbarRow
                                    onClick={() => setIsPuzzlesModalOpen(!isPuzzlesModalOpen)}
                                    icon="grid_view"
                                    label="Puzzles"
                                    isCollapsed={isToolbarCollapsed}
                                    isActive={isPuzzlesModalOpen}
                                /> */}

                                {/* Inspector Toggle (Desktop only) */}
                                <ToolbarRow
                                    onClick={() => {
                                        if (isInspectorOpen) removeFocus('inspector');
                                        else pushFocus('inspector');
                                    }}
                                    icon="tune"
                                    label="Inspector"
                                    shortcut="I"
                                    isCollapsed={isToolbarCollapsed}
                                    isActive={isInspectorOpen}
                                    className="hidden lg:flex"
                                />

                                {/* Scene Hotbar Toggle (Desktop only) */}
                                <ToolbarRow
                                    onClick={() => setIsSceneHotbarOpen(!isSceneHotbarOpen)}
                                    icon="keyboard_keys"
                                    label="Scenes"
                                    shortcut="K"
                                    isCollapsed={isToolbarCollapsed}
                                    isActive={isSceneHotbarOpen}
                                    className="hidden lg:flex"
                                />

                                {/* Hide UI */}
                                <ToolbarRow
                                    onClick={() => setIsUiHidden(true)}
                                    icon="visibility_off"
                                    label="Hide UI"
                                    shortcut="H"
                                    isCollapsed={isToolbarCollapsed}
                                />

                                {/* Export (Desktop only) */}
                                <ToolbarRow
                                    onClick={openExportModal}
                                    disabled={!audioFile || isExporting || isProcessing || isLiveMode}
                                    icon="download"
                                    label="Export Video"
                                    isCollapsed={isToolbarCollapsed}
                                    className="hidden lg:flex"
                                />
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default MainToolbar;
