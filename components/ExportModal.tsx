import React, { useState, useEffect } from 'react';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (options: { fps: number; resolution: number }) => void;
    isExporting: boolean;
    exportProgress: number; // 0 to 100
}

const ExportModal: React.FC<ExportModalProps> = ({
    isOpen,
    onClose,
    onExport,
    isExporting,
    exportProgress
}) => {
    const [fps, setFps] = useState<number>(30);
    const [resolution, setResolution] = useState<number>(1920);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !isExporting) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, isExporting, onClose]);

    if (!isOpen) return null;

    const fpsOptions = [
        { value: 24, label: '24 FPS', desc: 'Film' },
        { value: 30, label: '30 FPS', desc: 'Standard' },
        { value: 60, label: '60 FPS', desc: 'High' }
    ];

    const resolutionOptions = [
        { value: 1280, label: '720p', desc: '1280x720' },
        { value: 1920, label: '1080p', desc: '1920x1080' },
        { value: 3840, label: '4K', desc: '3840x2160' }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80"
                onClick={() => !isExporting && onClose()}
            />
            {/* Modal */}
            <div className="relative w-full bg-black/80 max-w-lg rounded-lg border border-white/10 shadow-2xl overflow-hidden animate-in fade-in duration-200">
                {/* Header Area */}
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-white">Export Video</h2>
                    {!isExporting && (
                        <button
                            onClick={onClose}
                            className="text-white/60 hover:text-white transition-colors p-1"
                        >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    )}
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-2 gap-8">
                        {/* Frame Rate Column */}
                        <div className="space-y-4">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-white px-1">
                                Frame Rate
                            </label>
                            <div className="flex flex-col gap-2">
                                {fpsOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setFps(option.value)}
                                        disabled={isExporting}
                                        className={`px-4 py-3 rounded border text-xs font-medium transition-all flex items-center justify-between ${fps === option.value
                                            ? 'bg-neutral-700 text-white border-neutral-500'
                                            : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:border-white/10'
                                            } ${isExporting ? 'opacity-40 cursor-not-allowed' : ''}`}
                                    >
                                        <span>{option.label}</span>
                                        <span className={`text-[10px] font-medium text-white/60`}>
                                            {option.desc}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Resolution Column */}
                        <div className="space-y-4">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-white px-1">
                                Resolution
                            </label>
                            <div className="flex flex-col gap-2">
                                {resolutionOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setResolution(option.value)}
                                        disabled={isExporting}
                                        className={`px-4 py-3 rounded border text-xs font-medium transition-all flex items-center justify-between ${resolution === option.value
                                            ? 'bg-neutral-700 text-white border-neutral-500'
                                            : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:border-white/10'
                                            } ${isExporting ? 'opacity-40 cursor-not-allowed' : ''}`}
                                    >
                                        <span>{option.label}</span>
                                        <span className={`text-[10px] font-medium text-white/60`}>
                                            {option.desc}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Progress Section */}
                    {isExporting ? (
                        <div className="mt-10 pt-8 border-t border-white/5 space-y-4">
                            <div className="flex justify-between items-end text-[10px] font-bold uppercase tracking-widest">
                                <span className="text-white">Exporting...</span>
                                <span className="text-white font-mono tracking-normal">{Math.round(exportProgress)}%</span>
                            </div>

                            <div className="h-1 bg-white/5 overflow-hidden">
                                <div
                                    className="h-full bg-white transition-all duration-300 ease-linear"
                                    style={{ width: `${exportProgress}%` }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="mt-10 pt-8 border-t border-white/10">
                            <button
                                onClick={() => onExport({ fps, resolution })}
                                className="w-full py-4 rounded border border-neutral-600 bg-neutral-800 text-white hover:bg-neutral-700 active:scale-[0.99] font-bold text-[10px] uppercase tracking-[0.2em] transition-all"
                            >
                                Export
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExportModal;
