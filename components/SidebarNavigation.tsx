import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffectStore } from '../store/useEffectStore';
import SidebarPipeline from './SidebarPipeline';
import SidebarLibrary from './SidebarLibrary';
import { loadMuxelsFile } from '@/services/sanitizeImportedEffects';
import { mainGlitchEngine } from '@/services/glitchEngine';
import { canMeld, isAlreadyMelded } from '@/services/pipelineUtils';
import LoadingSpinner from './LoadingSpinner';
import { generateAndLoad } from '../services/languageService';

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
    const batchDuplicate = useEffectStore(s => s.batchDuplicate);
    const batchMeld = useEffectStore(s => s.batchMeld);
    const batchUnmeld = useEffectStore(s => s.batchUnmeld);

    const clearSelection = useEffectStore(s => s.clearSelection);
    const setEffects = useEffectStore(s => s.setEffects);
    const clearEffects = useEffectStore(s => s.clearEffects);

    const canMeldSelected = useMemo(() => canMeld(effects, selectedIds), [effects, selectedIds]);
    const isMelded = useMemo(() => isAlreadyMelded(effects, selectedIds), [effects, selectedIds]);

    const addEffectFromSidebar = useEffectStore(s => s.addEffectFromSidebar);
    const checkPuzzle = useEffectStore(s => s.checkPuzzle);
    const isGameMode = useEffectStore(s => s.isGameMode);

    const handleExport = () => {
        const projectData = {
            effects,
            engineState: mainGlitchEngine.getState()
        };
        const dataStr = JSON.stringify(projectData, null, 2);
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
                .then(project => {
                    if (project.engineState) {
                        mainGlitchEngine.seedState(project.engineState);
                    }
                    clearSelection();
                    setEffects(project.effects);
                })
                .catch(err => {
                    alert(err.message);
                });
        };
        input.click();
    };

    const handleAIGenerate = () => {
        generateAndLoad(setEffects, { temperature: 0.5 });
    }

    const HeaderRightControls = (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
                <button
                    onClick={undo}
                    disabled={past.length === 0}
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-all text-white/90 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed`}
                    title="Undo (Cmd+Z)">
                    <span className="material-symbols-outlined">undo</span>
                </button>
                <button
                    onClick={redo}
                    disabled={future.length === 0}
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-all text-white/90 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed`}
                    title="Redo (Cmd+Shift+Z)">
                    <span className="material-symbols-outlined">redo</span>
                </button>
            </div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all bg-white/5 text-white/90 hover:text-white hover:bg-white/10 border border-white/5"
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
                <div className="flex items-center h-full ml-1 gap-1">
                    {/* Library Button */}
                    <button
                        onClick={() => isLibraryOpen ? removeFocus('library') : pushFocus('library')}
                        className={`h-8 px-3 mr-2 rounded-full flex items-center justify-center gap-1.5 bg-indigo-500 hover:bg-indigo-400 text-white transition-colors border border-indigo-400 shadow-md`}
                        title="Toggle Library (Y)">
                        <span className="material-symbols-outlined">{isLibraryOpen ? 'remove' : 'add'}</span>
                    </button>

                    {/* Add Effect Buttons / Submit Solution */}
                    {isGameMode ? (
                        <button
                            onClick={checkPuzzle}
                            className="flex items-center h-8 px-4 ml-1 rounded-full bg-indigo-500 hover:bg-indigo-400 border border-indigo-400 text-white text-[10px] md:text-[11px] font-semibold uppercase tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                        >
                            Submit Solution
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => addEffectFromSidebar('IMAGE')}
                                className="w-9 h-8 rounded-md flex items-center justify-center transition-all text-white/90 hover:text-white hover:bg-white/10"
                                title="Add Image (O)">
                                <span className="material-symbols-outlined !text-[22px]">image</span>
                            </button>
                            <button
                                onClick={() => addEffectFromSidebar('RGBA')}
                                className="w-9 h-8 rounded-md flex items-center justify-center transition-all text-white/90 hover:text-white hover:bg-white/10"
                                title="Add Color (C)">
                                <span className="material-symbols-outlined !text-[22px]">palette</span>
                            </button>
                            <button
                                onClick={() => addEffectFromSidebar('TRANSFORM')}
                                className="w-9 h-8 rounded-md flex items-center justify-center transition-all text-white/90 hover:text-white hover:bg-white/10"
                                title="Add Move-Scale (M)">
                                <span className="material-symbols-outlined !text-[22px]">drag_pan</span>
                            </button>
                        </>
                    )}
                </div>
                {HeaderRightControls}
            </div>

            {/* Selection Mode Bar */}
            <div className="h-9 flex items-center justify-between px-3 gap-2 bg-slate-800/80 shrink-0 border-b border-white/5">
                <div className="flex items-center gap-2">
                    {/* Duplicate Button */}
                    <button
                        onClick={batchDuplicate}
                        disabled={selectionCount === 0}
                        className="w-8 h-6 border border-white/10 rounded-md flex items-center justify-center text-white bg-white/5 hover:bg-white/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
                        title="Duplicate (Cmd+D)"
                    >
                        <span className="material-symbols-outlined !text-[16px] group-hover:scale-110 transition-transform will-change-transform">content_copy</span>
                    </button>

                    {/* Group/Ungroup Button */}
                    <button
                        onClick={isMelded ? batchUnmeld : batchMeld}
                        disabled={!canMeldSelected}
                        className="w-8 h-6 border border-white/10 rounded-md flex items-center justify-center text-white bg-white/5 hover:bg-white/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
                        title={isMelded ? "Ungroup (Cmd+Shift+G)" : "Group (Cmd+G)"}
                    >
                        <span className="material-symbols-outlined !text-[16px] group-hover:scale-110 transition-transform will-change-transform">
                            {isMelded ? 'link_off' : 'group_work'}
                        </span>
                    </button>

                    {/* Delete Button */}
                    <button
                        onClick={batchRemove}
                        disabled={selectionCount === 0}
                        className="w-8 h-6 border border-red-400/20 rounded-md flex items-center justify-center text-red-400 bg-red-400/5 hover:bg-red-400/20 transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
                        title="Delete Selected (Backspace)"
                    >
                        <span className="material-symbols-outlined !text-[16px] group-hover:scale-110 transition-transform will-change-transform">delete</span>
                    </button>

                    {/* Clear All Button */}
                    <button
                        onClick={clearEffects}
                        disabled={effects.length === 0}
                        className="w-8 h-6 border border-white/10 rounded-md flex items-center justify-center text-white bg-white/5 hover:text-red-400 hover:border-red-400/20 hover:bg-red-400/5 transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
                        title="Clear All Effects"
                    >
                        <span className="material-symbols-outlined !text-[18px] group-hover:scale-110 transition-transform will-change-transform">delete_sweep</span>
                    </button>
                </div>

                {/* Multiselect Toggle */}
                <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-medium text-white/60 uppercase tracking-widest">Multiselect</span>
                    <button
                        onClick={() => setIsInSelectMode(!isInSelectMode)}
                        className={`relative w-8 h-4.5 rounded-full transition-colors duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${isInSelectMode ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]' : 'bg-white/10'}`}
                        title="Toggle Multiselect"
                    >
                        <div className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all duration-300 ease-out ${isInSelectMode ? 'translate-x-3.5' : 'translate-x-0'}`} />
                    </button>
                </div>
            </div>

            {/* Pipeline List — shrinks as library panel grows */}
            <div key="pipeline-scroll" className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                <SidebarPipeline onNavigateToLibrary={() => pushFocus('library')} onAIGenerate={handleAIGenerate} />
            </div>

            {/* Footer Bar */}
            {!isGameMode &&
                <div className="h-9 flex items-center justify-center px-3 gap-2 bg-slate-800/80 shrink-0 border-t border-white/5">
                    {/* Import button */}
                    <button
                        onClick={handleImport}
                        className="h-6 rounded-md border border-white/5 bg-white/5 flex items-center gap-1 px-2 justify-center transition-all text-white/90 hover:text-white hover:bg-white/10"
                        title="Import .muxels">
                        <span className="material-symbols-outlined !text-[16px]">upload</span>
                        <span className="text-[10px] font-semibold uppercase tracking-widest">Import</span>
                    </button>

                    {/* Export button */}
                    <button
                        onClick={handleExport}
                        disabled={effects.length === 0}
                        className="h-6 rounded-md border border-white/5 bg-white/5 flex items-center gap-1 px-2 justify-center transition-all text-white/90 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Export .muxels">
                        <span className="material-symbols-outlined !text-[16px]">download</span>
                        <span className="text-[10px] font-semibold uppercase tracking-widest">Export</span>
                    </button>

                    {/* AI Generate button */}
                    <button
                        onClick={handleAIGenerate}
                        className="group relative h-6 rounded-md overflow-hidden flex items-center gap-1 px-2 justify-center transition-all duration-300 hover:scale-110 active:scale-95 text-white border-transparent will-change-transform"
                        title="Generate AI Pipeline">

                        {/* Smooth Rainbow Rotating Gradient */}
                        <div className="absolute inset-0 z-0 pointer-events-none rounded-md">
                            <div className="houdini-rainbow-border" />
                            {/* Themed tint overlay */}
                            <div className="absolute inset-0 bg-purple-500/10 z-0 opacity-40 rounded-md" />
                        </div>

                        <span className="material-symbols-outlined !text-[14px] z-10 transition-transform group-hover:scale-110">magic_button</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest z-10">AI Gen</span>
                    </button>
                </div>
            }

            {/* Library Panel — grows from bottom, pushing pipeline list up */}
            <AnimatePresence>
                {isLibraryOpen && (
                    <motion.div
                        key="library-panel"
                        initial={{ height: '0%' }}
                        animate={{ height: '45%' }}
                        exit={{ height: '0%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
                        onAnimationComplete={() => setLibraryEntranceComplete(true)}
                        className="z-library flex flex-col bg-slate-900 border-t border-white/10 overflow-hidden shrink-0"
                        style={{ minHeight: 0 }}
                    >

                        {/* Library Scrollable Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                            {libraryEntranceComplete ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.1 }}
                                >
                                    <SidebarLibrary onClose={() => removeFocus('library')} />
                                </motion.div>
                            ) : <LoadingSpinner />}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SidebarNavigation;
