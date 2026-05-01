import React, { useState, useEffect } from 'react';
import { calculateExportDimensions } from '@/services/exportService';
import { motion } from 'framer-motion';

interface ExportModalProps {
    onClose: () => void;
    onExport: (options: { fps: number; resolution: number }) => void;
    onCancelExport?: () => void;
    isExporting: boolean;
    exportProgress: number; // 0 to 100
    exportResult?: { fileUrl: string, fileName: string } | null;
}

const ExportModal: React.FC<ExportModalProps> = ({
    onClose,
    onExport,
    onCancelExport,
    isExporting,
    exportProgress,
    exportResult
}) => {
    const [fps, setFps] = useState<number>(30);
    const [resolution, setResolution] = useState<number>(1920);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isExporting) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isExporting, onClose]);

    const fpsOptions = [
        { value: 24, label: '24 FPS', desc: 'Film' },
        { value: 30, label: '30 FPS', desc: 'Standard' },
        { value: 60, label: '60 FPS', desc: 'High' }
    ];

    const getResDesc = (val: number) => {
        const { width, height } = calculateExportDimensions(val);
        return `${width}x${height}`;
    };

    const resolutionOptions = [
        { value: 1280, label: '720p', desc: getResDesc(1280) },
        { value: 1920, label: '1080p', desc: getResDesc(1920) },
        { value: 3840, label: '4K', desc: getResDesc(3840) }
    ];

    return (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => !isExporting && onClose()}
                className="absolute inset-0 bg-black"
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', damping: 50, stiffness: 1000 }}
                data-section="modal" className="relative w-full bg-slate-900/90 max-w-lg rounded-lg border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
                {/* Header Area */}
                <div className="px-6 py-3 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-[12px] font-bold tracking-widest uppercase text-white">Export</h2>
                    {!isExporting && (
                        <button
                            onClick={onClose}
                            className="flex items-center text-white/60 hover:text-white transition-colors p-1"
                        >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    )}
                </div>

                <div className="p-8">
                    {!isExporting && !exportResult && <div className="grid grid-cols-2 gap-8">
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
                                        className={`px-4 py-3 rounded-lg border text-xs font-medium transition-all flex items-center justify-between ${fps === option.value
                                            ? 'bg-white/20 border-white/30'
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
                                        className={`px-4 py-3 rounded-lg border text-xs font-medium transition-all flex items-center justify-between ${resolution === option.value
                                            ? 'bg-white/20 border-white/30'
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
                    </div>}

                    {/* Progress / Success Section */}
                    {exportResult ? (
                        <div className="space-y-4">
                            <div className="flex flex-col items-center justify-center p-6 space-y-4 bg-white/5 rounded-lg border border-white/10">
                                <div className="text-white font-medium text-sm tracking-widest uppercase">Export Complete</div>
                                <p className="text-[10px] text-center text-white/60 leading-relaxed uppercase tracking-widest">
                                    <a className="text-green-400 font-bold tracking-widest uppercase" href={exportResult.fileUrl} download={exportResult.fileName}>Click Here</a> if your download hasn't started.
                                </p>
                            </div>
                        </div>
                    ) : isExporting ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-end text-[10px] font-bold uppercase tracking-widest">
                                <span className="text-white">Exporting...</span>
                                <span className="text-white font-mono tracking-normal">{Math.round(exportProgress)}%</span>
                            </div>

                            <div className="h-1 bg-white/5 overflow-hidden">
                                <div
                                    className="h-full bg-white"
                                    style={{ width: `${exportProgress}%` }}
                                />
                            </div>

                            <div className="flex justify-center pt-4">
                                <button
                                    onClick={onCancelExport}
                                    className="px-6 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 active:scale-[0.99] transition-all font-bold text-[10px] uppercase tracking-widest"
                                >
                                    Cancel Export
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-10 pt-8 border-t border-white/10">
                            <button
                                onClick={() => onExport({ fps, resolution })}
                                className={`w-full py-4 rounded-lg border font-bold text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20`}
                            >
                                Export .MP4
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ExportModal;
