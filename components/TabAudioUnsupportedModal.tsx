import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface TabAudioUnsupportedModalProps {
    onClose: () => void;
}

const TabAudioUnsupportedModal: React.FC<TabAudioUnsupportedModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg bg-[#0a0a1a] rounded-2xl border border-white/10 p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden"
            >
                <div className="flex flex-col items-center text-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-2">
                        <span className="material-symbols-outlined !text-4xl text-purple-400">present_to_all</span>
                    </div>

                    <div className="flex flex-col gap-3">
                        <h2 className="text-2xl font-bold uppercase tracking-tight text-white">Tab Audio Unsupported</h2>
                        <p className="text-white/60 text-sm leading-relaxed max-w-sm">
                            Your current browser does not yet support capturing internal tab audio. To use this feature, try opening Muxels in a Chromium-based browser like Chrome, Edge, or Opera.
                        </p>
                    </div>

                    <div className="w-full flex flex-col gap-3 mt-4">
                        <button
                            onClick={handleCopy}
                            className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-sm transition-all duration-300 ${copied
                                ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                                : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white'
                                }`}
                        >
                            <span className="material-symbols-outlined text-xl">
                                {copied ? 'check_circle' : 'content_copy'}
                            </span>
                            {copied ? 'Link Copied!' : 'Copy Site Link'}
                        </button>
                    </div>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
            </motion.div>
        </div>
    );
};

export default TabAudioUnsupportedModal;
