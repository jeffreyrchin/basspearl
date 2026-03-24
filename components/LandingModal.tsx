import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLegalStore } from '../store/useLegalStore';

interface LandingModalProps {
    onStart: (audioOption: 'demo' | 'upload', audioFile?: File, muxelsFile?: File) => void;
    onClose: () => void;
}

const LandingModal: React.FC<LandingModalProps> = ({ onStart, onClose }) => {
    const [audioSource, setAudioSource] = useState<'demo' | 'upload'>('demo');
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const muxelsInputRef = useRef<HTMLInputElement>(null);

    const { openLegal } = useLegalStore();

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAudioFile(e.target.files[0]);
        }
    };

    const handleMuxelsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            onStart(audioSource, audioFile || undefined, file);
        }
        // clear input in case they want to upload it again later
        if (e.target) {
            e.target.value = '';
        }
    };

    const handleBlankProject = () => {
        onStart(audioSource, audioFile || undefined, undefined);
    };

    return (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
                key="landing-modal-content"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', damping: 50, stiffness: 1000 }}
                data-section="modal"
                className="relative w-full max-w-sm bg-slate-800 rounded-2xl border border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col items-center shadow-2xl"
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
                    <h1 className="text-xl font-bold tracking-normal uppercase">
                        muxels
                    </h1>
                    <p className="text-white/60 text-xs tracking-widest uppercase">Audio Visualizer</p>
                </div>

                {/* Body Section */}
                <div className="w-full p-6 pt-0">
                    {/* Audio Setup Radio Buttons */}
                    <div className="flex w-full pb-3 items-center justify-center gap-6 text-sm tracking-wider uppercase font-medium">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${audioSource === 'demo' ? 'border-primary bg-primary/10' : 'border-white/30 group-hover:border-white/60'} group-focus-within:ring-2 group-focus-within:ring-primary/50 group-focus-within:border-primary`}>
                                {audioSource === 'demo' && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </div>
                            <span className={`transition-colors ${audioSource === 'demo' ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`}>Demo Track</span>
                            <input
                                type="radio"
                                name="audioSource"
                                value="demo"
                                className="sr-only"
                                checked={audioSource === 'demo'}
                                onChange={() => setAudioSource('demo')}
                            />
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${audioSource === 'upload' ? 'border-primary bg-primary/10' : 'border-white/30 group-hover:border-white/60'} group-focus-within:ring-2 group-focus-within:ring-primary/50 group-focus-within:border-primary`}>
                                {audioSource === 'upload' && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </div>
                            <span className={`transition-colors ${audioSource === 'upload' ? 'text-white' : 'text-white/60 group-hover:text-white/80'}`}>Audio File</span>
                            <input
                                type="radio"
                                name="audioSource"
                                value="upload"
                                className="sr-only"
                                checked={audioSource === 'upload'}
                                onChange={() => setAudioSource('upload')}
                            />
                        </label>
                    </div>

                    {/* Revealer for File Selection — always rendered, height driven by state */}
                    <motion.div
                        animate={{
                            height: audioSource === 'upload' ? 'auto' : 0,
                            opacity: audioSource === 'upload' ? 1 : 0,
                        }}
                        initial={{ height: 0, opacity: 0 }}
                        transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
                        className="w-full flex flex-col items-center overflow-hidden"
                        style={{ pointerEvents: audioSource === 'upload' ? 'auto' : 'none' }}
                    >
                        <input
                            ref={audioInputRef}
                            type="file"
                            accept="audio/*, .mp3, .wav, .m4a, .aac, .ogg"
                            onChange={handleAudioUpload}
                            className="hidden"
                        />
                        <button
                            onClick={() => audioInputRef.current?.click()}
                            className="w-48 min-h-10 my-3 rounded-xl border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-white/80 text-xs font-bold uppercase tracking-widest group"
                        >
                            <span className="material-symbols-outlined text-[18px] group-hover:text-white transition-colors">graphic_eq</span>
                            Select Audio
                        </button>
                        {audioFile && (
                            <div className="text-[10px] text-green-400 font-bold tracking-wider uppercase flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                {audioFile.name.substring(0, 20)}{audioFile.name.length > 20 ? '...' : ''}
                            </div>
                        )}
                    </motion.div>

                    {/* Hidden input for muxels */}
                    <input
                        ref={muxelsInputRef}
                        type="file"
                        accept=".muxels"
                        onChange={handleMuxelsUpload}
                        className="hidden"
                    />

                    {/* Actions */}
                    <div className="w-full flex flex-col pt-3 gap-3">
                        <button
                            onClick={handleBlankProject}
                            className="w-full py-4 rounded-xl bg-white hover:bg-white/90 text-black transition-colors duration-300 text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px]">draft</span>
                            Blank Project
                        </button>
                        <button
                            onClick={() => muxelsInputRef.current?.click()}
                            className="w-full py-4 rounded-xl border border-white/20 hover:border-white/50 hover:bg-white/5 transition-colors duration-300 text-white text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px]">upload_file</span>
                            Load muxels
                        </button>
                    </div>

                    {/* Disclaimer */}
                    <div className="w-full pt-4 text-center">
                        <p className="text-[12px] text-white/60 leading-relaxed mx-auto">
                            This site may produce flashing or strobing effects.<br />By using this site, you agree to our <button onClick={openLegal} className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">Privacy & Terms</button>.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default LandingModal;
