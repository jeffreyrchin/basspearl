import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useLegalStore } from '../store/useLegalStore';
import { useEffectStore } from '@/store/useEffectStore';

interface LandingModalProps {
    onStart: (audioOption: 'demo' | 'upload' | 'mic' | 'tab', audioFile?: File) => void;
    onClose: () => void;
    isTabAudioUnsupported?: boolean;
    openTabAudioUnsupportedModal?: () => void;
}

const LandingModal: React.FC<LandingModalProps> = ({ onStart, onClose, isTabAudioUnsupported, openTabAudioUnsupportedModal }) => {
    const audioInputRef = useRef<HTMLInputElement>(null);

    const openLegal = useLegalStore(e => e.openLegal);
    const pushFocus = useEffectStore(e => e.pushFocus);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleAudioFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onStart('upload', e.target.files[0]);
            pushFocus('library');
        }
    };

    const handleDemoTrack = () => {
        onStart('demo');
        pushFocus('library');
    };

    const handleExternalSource = () => {
        onStart('mic');
        pushFocus('library');
    };

    const handleTabAudio = () => {
        if (isTabAudioUnsupported && openTabAudioUnsupportedModal) {
            openTabAudioUnsupportedModal();
            return;
        }
        onStart('tab');
        pushFocus('library');
    };

    const LandingCard: React.FC<{
        onClick: () => void;
        icon: string;
        label: string;
        color: 'cyan' | 'red' | 'pink' | 'purple';
        badge?: string;
    }> = ({ onClick, icon, label, color, badge }) => {
        const theme = {
            cyan: {
                border: 'border-accent-blue/30 hover:border-accent-blue/60',
                bg: 'bg-accent-blue/5 hover:bg-accent-blue/10',
                text: 'text-accent-blue'
            },
            red: {
                border: 'border-red-500/30 hover:border-red-500/60',
                bg: 'bg-red-500/5 hover:bg-red-500/10',
                text: 'text-red-400'
            },
            pink: {
                border: 'border-primary/30 hover:border-primary/60',
                bg: 'bg-primary/5 hover:bg-primary/10',
                text: 'text-primary'
            },
            purple: {
                border: 'border-purple-500/30 hover:border-purple-500/60',
                bg: 'bg-purple-500/5 hover:bg-purple-500/10',
                text: 'text-purple-400'
            }
        }[color];

        return (
            <button
                onClick={onClick}
                className={`flex-1 rounded-2xl border ${theme.border} ${theme.bg} transition-all duration-300 will-change-transform group flex flex-col items-center justify-center gap-2 sm:gap-4 p-2 sm:p-4 hover:scale-[1.05] hover:-translate-y-1 active:scale-95 shadow-2xl relative overflow-hidden`}
            >
                <div className={`absolute -inset-2 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                <span className={`material-symbols-outlined !text-3xl sm:!text-4xl md:!text-5xl ${theme.text} transition-all duration-300 group-hover:scale-110`}>
                    {icon}
                </span>
                <div className="flex flex-col items-center gap-1.5 z-10 text-center px-1">
                    <span className="text-[11px] sm:text-[12px] font-medium uppercase tracking-[0.1em] sm:tracking-[0.2em] text-white/90 group-hover:text-white transition-colors">
                        {label}
                    </span>
                    {badge && (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#A855F7] mt-1 bg-[#A855F7]/10 px-2 py-0.5 rounded border border-[#A855F7]/20 group-hover:bg-[#A855F7]/20 transition-all">
                            {badge}
                        </span>
                    )}
                </div>
            </button>
        );
    };

    return (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black"
            />

            <motion.div
                key="landing-modal-content"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', damping: 50, stiffness: 1000 }}
                data-section="modal"
                className="relative w-[95vw] max-w-4xl bg-[#0a0a1a] rounded-2xl border border-white/5 max-h-[90vh] overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col items-center shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all z-10"
                    title="Close"
                >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                </button>

                {/* Header Section */}
                <div className="w-full text-center pt-8 pb-4">
                    <motion.h1
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        className="text-2xl font-bold tracking-normal uppercase bg-gradient-to-r from-primary via-indigo-300 to-white bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-move will-change-transform">
                        muxels
                    </motion.h1>
                    <p className="text-white/60 text-xs tracking-widest uppercase">Audio Visualizer</p>
                </div>

                {/* Body Section */}
                <div className="w-full p-8 pt-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                        <input
                            ref={audioInputRef}
                            type="file"
                            accept="audio/*"
                            onChange={handleAudioFile}
                            className="hidden"
                        />

                        <LandingCard
                            onClick={() => audioInputRef.current?.click()}
                            icon="upload_file"
                            label="Audio File"
                            color="cyan"
                        />

                        <LandingCard
                            onClick={handleExternalSource}
                            icon="mic"
                            label="Microphone"
                            color="red"
                        />

                        <LandingCard
                            onClick={handleTabAudio}
                            icon="present_to_all"
                            label="Tab Audio"
                            color="purple"
                            badge={isTabAudioUnsupported ? 'Unsupported Browser' : undefined}
                        />

                        <LandingCard
                            onClick={handleDemoTrack}
                            icon="music_note"
                            label="Demo Track"
                            color="pink"
                        />
                    </div>

                    {/* Disclaimer */}
                    <div className="mt-8 flex flex-col items-center gap-3 w-full">
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 w-full max-w-lg flex flex-col items-center gap-1.5 shadow-lg">
                            <div className="flex flex-col sm:flex-row text-center items-center gap-1.5 text-red-400">
                                <span className="material-symbols-outlined text-[16px]">warning</span>
                                <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Photosensitivity Warning</span>
                            </div>
                            <p className="text-[11px] text-red-300/80 uppercase tracking-[0.1em] leading-relaxed text-center">
                                This application can produce rapid flashing, strobing, and high-contrast effects that may trigger seizures.
                            </p>
                        </div>

                        <p className="text-[11px] text-white/90 uppercase tracking-[0.15em] leading-relaxed text-center max-w-lg mt-1">
                            By continuing, you acknowledge that you have the rights to your media and agree to our <button onClick={openLegal} className="text-indigo-300 hover:text-white font-bold uppercase cursor-pointer transition-colors">Privacy & Terms.</button>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default LandingModal;
