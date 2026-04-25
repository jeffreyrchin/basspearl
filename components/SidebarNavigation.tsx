import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffectStore } from '../store/useEffectStore';
import SidebarPipeline from './SidebarPipeline';
import SidebarLibrary from './SidebarLibrary';
import ActionBar from './ActionBar';
import { loadMuxelsFile } from '@/services/sanitizeImportedEffects';

interface SidebarNavigationProps {
    onClose?: () => void;
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
    onClose
}) => {
    const effects = useEffectStore(s => s.effects);
    const undo = useEffectStore(s => s.undo);
    const redo = useEffectStore(s => s.redo);
    const past = useEffectStore(s => s.past);
    const future = useEffectStore(s => s.future);
    const isInSelectMode = useEffectStore(s => s.isInSelectMode);
    const setIsInSelectMode = useEffectStore(s => s.setIsInSelectMode);
    const pushFocus = useEffectStore(s => s.pushFocus);
    const focusStack = useEffectStore(s => s.focusStack);
    const removeFocus = useEffectStore(s => s.removeFocus);
    const isLibraryOpen = focusStack.includes('library');
    const [libraryEntranceComplete, setLibraryEntranceComplete] = useState(false);

    const selectedIds = useEffectStore(s => s.selectedIds);
    const selectionCount = selectedIds.size;
    const batchRemove = useEffectStore(s => s.batchRemove);

    const setEffects = useEffectStore(s => s.setEffects);

    const handleExport = () => {
        const dataStr = JSON.stringify(effects, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${Date.now()}.muxels`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.muxels';
        input.onchange = (e: any) => {
            const file = e.target.files?.[0];
            if (!file) return;
            loadMuxelsFile(file)
                .then(sanitized => {
                    setEffects(sanitized);
                })
                .catch(err => {
                    alert(err.message);
                });
        };
        input.click();
    };

    const HeaderRightControls = (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
                <button
                    onClick={batchRemove}
                    disabled={selectionCount === 0}
                    className="w-8 h-8 rounded-md flex items-center justify-center transition-all enabled:text-white/80 enabled:hover:text-white enabled:hover:bg-white/10 disabled:text-white/20 disabled:cursor-not-allowed"
                    title="Delete Selected">
                    <span className="material-symbols-outlined">delete</span>
                </button>
                <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
                <button
                    onClick={handleImport}
                    className="w-8 h-8 rounded-md flex items-center justify-center transition-all text-white/80 hover:text-white hover:bg-white/10"
                    title="Import .muxels">
                    <span className="material-symbols-outlined">upload</span>
                </button>
                <button
                    onClick={handleExport}
                    disabled={effects.length === 0}
                    className={`w-8 h-8 rounded-md flex items-center justify-center transition-all enabled:text-white/80 enabled:hover:text-white enabled:hover:bg-white/10 disabled:text-white/20 disabled:cursor-not-allowed`}
                    title="Export .muxels">
                    <span className="material-symbols-outlined">download</span>
                </button>
                <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
                <button
                    onClick={undo}
                    disabled={past.length === 0}
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-all enabled:text-white/80 enabled:hover:text-white enabled:hover:bg-white/10 disabled:text-white/20 disabled:cursor-not-allowed`}
                    title="Undo (Cmd+Z)">
                    <span className="material-symbols-outlined">undo</span>
                </button>
                <button
                    onClick={redo}
                    disabled={future.length === 0}
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-all enabled:text-white/80 enabled:hover:text-white enabled:hover:bg-white/10 disabled:text-white/20 disabled:cursor-not-allowed`}
                    title="Redo (Cmd+Shift+Z)">
                    <span className="material-symbols-outlined">redo</span>
                </button>
            </div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all bg-white/5 text-white/80 hover:text-white hover:bg-white/10 border border-white/5"
                    title="Close Pipeline (P)">
                    <span className="material-symbols-outlined">chevron_right</span>
                </button>
            )}
        </div>
    );

    return (
        <div data-section="pipeline" key="view-main" className="flex-1 flex flex-col min-h-0 pt-1 animate-in fade-in slide-in-from-right-4 duration-300 bg-slate-900/90 relative">
            {/* Header Bar */}
            <div className="h-14 border-b border-white/5 bg-slate-800 flex items-center justify-between px-3 shrink-0 relative">
                {/* Add Effect Button */}
                <div className="flex items-center h-full ml-1">
                    <button
                        onClick={() => isLibraryOpen ? removeFocus('library') : pushFocus('library')}
                        className={`h-8 px-3 rounded-full flex items-center justify-center gap-1.5 bg-indigo-500 hover:bg-indigo-400 text-white transition-colors border border-indigo-400 shadow-md`}
                        title="Toggle Library (Y)">
                        <span className="material-symbols-outlined">{isLibraryOpen ? 'remove' : 'add'}</span>
                    </button>
                </div>
                {HeaderRightControls}
            </div>

            {/* Selection Mode Bar */}
            <div className="h-8 flex items-center justify-center gap-2 shrink-0">
                <span className="text-[10px] font-medium text-indigo-200 uppercase tracking-widest">Multiselect:</span>
                <div className="flex rounded-md">
                    <button
                        onClick={() => setIsInSelectMode(true)}
                        className={`px-3 py-0.5 rounded transition-colors text-[11px] font-medium tracking-wide ${isInSelectMode ? 'bg-indigo-300/30 text-white' : 'text-white/60 hover:text-white'}`}
                    >
                        On
                    </button>
                    <button
                        onClick={() => setIsInSelectMode(false)}
                        className={`px-3 py-0.5 rounded transition-colors text-[11px] font-medium tracking-wide ${!isInSelectMode ? 'bg-indigo-300/30 text-white' : 'text-white/60 hover:text-white'}`}
                    >
                        Off
                    </button>
                </div>
            </div>

            {/* Pipeline List — shrinks as library panel grows */}
            <div key="pipeline-scroll" className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                <SidebarPipeline onLoadMuxels={handleImport} onNavigateToLibrary={() => pushFocus('library')} />
            </div>

            {/* Global Action Bar anchored to the bottom of the pipeline */}
            <ActionBar />

            {/* Library Panel — grows from bottom, pushing pipeline list up */}
            <AnimatePresence>
                {isLibraryOpen && (
                    <motion.div
                        key="library-panel"
                        initial={{ height: '0%' }}
                        animate={{ height: '55%' }}
                        exit={{ height: '0%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
                        onAnimationComplete={() => setLibraryEntranceComplete(true)}
                        className="z-library flex flex-col bg-slate-900 border-t border-white/10 overflow-hidden shrink-0"
                        style={{ minHeight: 0 }}
                    >
                        {/* Library Header */}
                        <div className="h-10 flex items-center justify-between px-4 shrink-0 border-b border-white/5 bg-slate-800">
                            <span className="text-[10px] font-bold text-white uppercase tracking-[0.15em]">Library</span>
                            <button
                                onClick={() => removeFocus('library')}
                                className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
                                title="Close Library (Y)"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Library Scrollable Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                            {libraryEntranceComplete ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.1 }}
                                >
                                    <SidebarLibrary />
                                </motion.div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/60"></div>
                                    <span className="text-[12px] font-bold text-white uppercase tracking-[0.15em]">
                                        Loading...
                                    </span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SidebarNavigation;
