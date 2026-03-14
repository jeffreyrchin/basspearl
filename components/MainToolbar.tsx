import React from 'react';
import { Preset, PRESETS } from '@/constants';
import { SidebarView } from './SidebarNavigation';

interface MainToolbarProps {
    isProcessing: boolean;
    loadPreset: (preset: Preset) => void;
    imageInputRef: React.RefObject<HTMLInputElement>;
    audioInputRef: React.RefObject<HTMLInputElement>;
    imageFile: File | null;
    audioFile: File | null;
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleAudioUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    sidebarVisible: boolean;
    setSidebarVisible: (visible: boolean) => void;
    sidebarView: SidebarView;
    setSidebarView: (view: SidebarView) => void;
}

const MainToolbar: React.FC<MainToolbarProps> = ({
    isProcessing,
    loadPreset,
    imageInputRef,
    audioInputRef,
    imageFile,
    audioFile,
    handleImageUpload,
    handleAudioUpload,
    sidebarVisible,
    setSidebarVisible,
    sidebarView,
    setSidebarView
}) => {
    return (
        <div className="h-14 border-b border-white/5 bg-white/5 flex items-center justify-between lg:justify-center px-6 gap-4 shrink-0 overflow-x-auto no-scrollbar">
            {/* Presets Group */}
            <div className="flex items-center gap-2 border-r border-white/10 pr-4 mr-2 shrink-0">
                {PRESETS.map(preset => (
                    <button
                        key={preset.id}
                        onClick={() => loadPreset(preset)}
                        disabled={isProcessing}
                        title={`Load ${preset.label} Preset`}
                        aria-label={`Load ${preset.label} Preset`}
                        className="h-8 px-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-[9px] font-bold uppercase tracking-widest disabled:opacity-30"
                    >
                        {preset.label.split(' ')[0]}
                    </button>
                ))}
            </div>

            {/* Local Assets Group */}
            <div className="flex items-center gap-3 shrink-0">
                {/* Choose Image */}
                <input
                    ref={imageInputRef}
                    id="image-file-input"
                    type="file"
                    accept="image/*, .jpg, .jpeg, .png, .webp, .heic"
                    onClick={(e) => { (e.target as HTMLInputElement).value = ''; }} // Clear input so onChange always fires
                    onChange={handleImageUpload}
                    className="sr-only"
                    title="Choose Image" />
                <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className={`h-9 px-4 rounded-xl border transition-all duration-300 flex items-center gap-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00F0FF] text-white ${imageFile ? "border-[#00F0FF]/30 bg-[#00F0FF]/5" : "border-white/5 bg-white/[0.03] hover:border-white/20"}`}
                    title="Choose Image">
                    <span className={`material-symbols-outlined text-base ${imageFile ? "text-[#00F0FF]" : "text-white"}`}>image</span>
                    {imageFile && <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.8)]" />}
                </button>

                {/* Choose Audio */}
                <input
                    ref={audioInputRef}
                    id="audio-file-input"
                    type="file"
                    accept="audio/*, .mp3, .wav, .m4a, .aac, .ogg"
                    onClick={(e) => { (e.target as HTMLInputElement).value = ''; }} // Clear input so onChange always fires
                    onChange={handleAudioUpload}
                    className="sr-only"
                    title="Choose Audio" />
                <button
                    type="button"
                    onClick={() => audioInputRef.current?.click()}
                    className={`h-9 px-4 rounded-xl border transition-all duration-300 flex items-center gap-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-white ${audioFile ? 'border-[#3B82F6]/30 bg-[#3B82F6]/5' : 'border-white/5 bg-white/[0.03] hover:border-white/20'}`}
                    title="Choose Audio">
                    <span className={`material-symbols-outlined text-base ${audioFile ? "text-[#3B82F6]" : "text-white"}`}>graphic_eq</span>
                    {audioFile && <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] shadow-[0_0_8px_rgba(59,130,246,0.8)]" />}
                </button>
            </div>

            {/* Sidebar Toggles (Desktop only in header) */}
            <div className="hidden lg:flex items-center ml-4 gap-2">
                <button
                    onClick={() => {
                        if (sidebarVisible && sidebarView === 'pipeline') {
                            setSidebarVisible(false);
                        } else {
                            setSidebarView('pipeline');
                            setSidebarVisible(true);
                        }
                    }}
                    className={`h-9 w-12 items-center justify-center rounded-xl border transition-colors text-white flex ${sidebarVisible && sidebarView === 'pipeline' ? 'bg-white/10 border-white/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                    title={sidebarVisible && sidebarView === 'pipeline' ? "Close Controls" : "Open Controls"}>
                    <span className="material-symbols-outlined text-base">tune</span>
                </button>
                <button
                    onClick={() => {
                        if (sidebarVisible && sidebarView === 'effects') {
                            setSidebarVisible(false);
                        } else {
                            setSidebarView('effects');
                            setSidebarVisible(true);
                        }
                    }}
                    className={`h-9 w-12 items-center justify-center rounded-xl border transition-colors text-white flex ${sidebarVisible && sidebarView === 'effects' ? 'bg-white/10 border-white/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                    title={sidebarVisible && sidebarView === 'effects' ? "Close Effects" : "Browse Effects"}>
                    <span className="material-symbols-outlined text-base">add_circle</span>
                </button>
            </div>
        </div>
    );
};

export default MainToolbar;
