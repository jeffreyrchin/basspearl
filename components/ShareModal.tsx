
import React, { useState, useEffect } from 'react';
import { trackEvent } from '../services/analytics';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string | null;
    previewUrl?: string | null;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, imageUrl, previewUrl }) => {
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'copied' | 'error'>('idle');

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Use previewUrl for display if available, otherwise fallback to full res
    const displayUrl = previewUrl || imageUrl;

    if (!isOpen || !imageUrl) return null;

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `glitchbrain-io-${Date.now()}.png`;
        trackEvent('glitch_export', { method: 'download' });
        link.click();
    };

    const handleWebShare = async () => {
        try {
            const blob = await (await fetch(imageUrl)).blob();
            const fileName = `glitchbrain-io-${Date.now()}.png`;
            const file = new File([blob], fileName, { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: '[GlitchBrain.io Art]',
                    text: 'Check out my glitch art created with GlitchBrain.io!',
                });
            } else {
                alert('Web Share not supported on this device. Try downloading or copying instead.');
            }
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleCopyAndOpen = async (url: string) => {
        setCopyStatus('copying');
        try {
            const blob = await (await fetch(imageUrl)).blob();
            await navigator.clipboard.write([
                new ClipboardItem({
                    [blob.type]: blob,
                    'text/plain': new Blob(['Made with GlitchBrain.io'], { type: 'text/plain' })
                })
            ]);
            setCopyStatus('copied');

            // If url is provided, open it after short delay
            if (url) {
                setTimeout(() => {
                    window.open(url, '_blank');
                    setCopyStatus('idle');
                }, 800);
            } else {
                setTimeout(() => setCopyStatus('idle'), 2000);
            }

        } catch (err) {
            console.error('Failed to copy', err);
            setCopyStatus('error');
            setTimeout(() => setCopyStatus('idle'), 2000);
            if (url) window.open(url, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={onClose}
            />
            <div className="relative w-full max-w-sm glass-panel rounded-2xl border border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-300 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold uppercase tracking-tight">Share Creation</h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <span className="material-symbols-outlined text-white/60">close</span>
                    </button>
                </div>

                {/* Preview */}
                <div className="aspect-video w-full bg-black/50 rounded-xl mb-6 overflow-hidden border border-white/5 relative group">
                    <img src={displayUrl || imageUrl} alt="Glitch Preview" className="w-full h-full object-contain" />

                </div>

                {/* Status Message */}
                {copyStatus === 'copied' && (
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-green-500/90 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xl animate-in slide-in-from-top-2 fade-in z-50 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        Image Copied!
                    </div>
                )}

                {/* Actions Grid */}
                <div className="grid grid-cols-2 gap-3 mb-2">
                    <button
                        onClick={handleDownload}
                        className="col-span-2 py-3 rounded-xl bg-black border border-primary hover:bg-primary/30 text-white font-bold text-sm uppercase tracking-widest cyber-glow transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">download</span>
                        Download
                    </button>

                    <button
                        onClick={handleWebShare}
                        className="py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-1 h-20"
                    >
                        <span className="material-symbols-outlined text-2xl mb-1">share</span>
                        Native Share
                    </button>

                    <button
                        onClick={() => handleCopyAndOpen('')} // Empty URL just copies
                        className="py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-1 h-20"
                    >
                        <span className="material-symbols-outlined text-2xl mb-1">content_copy</span>
                        Copy
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
