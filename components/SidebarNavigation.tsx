import React, { useState } from 'react';
import { useEffectStore } from '../store/useEffectStore';
import SidebarLibrary from './SidebarLibrary';
import SidebarPipeline from './SidebarPipeline';
import SidebarParams from './SidebarParams';

interface SidebarNavigationProps {
    onClose?: () => void;
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
    onClose,
}) => {
    const [view, setView] = useState<'pipeline' | 'effects' | 'params'>('pipeline');
    const effects = useEffectStore(s => s.effects);
    const undo = useEffectStore(s => s.undo);
    const redo = useEffectStore(s => s.redo);
    const past = useEffectStore(s => s.past);
    const future = useEffectStore(s => s.future);

    // Keyboard shortcuts
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isMod = e.metaKey || e.ctrlKey;
            if (isMod && e.key === 'z') {
                if (e.shiftKey) redo();
                else undo();
                e.preventDefault();
            } else if (isMod && e.key === 'y') {
                redo();
                e.preventDefault();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    const HistoryControls = (
        <div className="flex items-center gap-1">
            <button
                onClick={undo}
                disabled={past.length === 0}
                className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${past.length > 0 ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-white/10 cursor-not-allowed'}`}
                title="Undo (Cmd+Z)">
                <span className="material-symbols-outlined text-[18px]">undo</span>
            </button>
            <button
                onClick={redo}
                disabled={future.length === 0}
                className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${future.length > 0 ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-white/10 cursor-not-allowed'}`}
                title="Redo (Cmd+Shift+Z)">
                <span className="material-symbols-outlined text-[18px]">redo</span>
            </button>
        </div>
    );

    if (view === 'params') {
        return (
            <div className="flex-1 flex flex-col min-h-0 pt-20 lg:pt-0 border-l border-white/5 animate-in fade-in slide-in-from-right-4 duration-300 bg-white/5">
                {/* Header Bar */}
                <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setView('pipeline')}
                            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 transition-all border border-white/5"
                            title="Back to Controls">
                            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                        </button>
                        <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Parameters</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {HistoryControls}
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                                title="Close Sidebar">
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <SidebarParams />
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 pt-20 lg:pt-0 border-l border-white/5 animate-in fade-in slide-in-from-left-4 duration-300 bg-white/5">
            {/* Header Bar */}
            <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 shrink-0 relative">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Controls</span>
                </div>

                <div className="flex items-center gap-2">
                    {HistoryControls}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                            title="Close Sidebar">
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Tab Bar */}
            <div className="flex px-4 pt-2 pb-0 gap-1 border-b border-white/5">
                <button
                    onClick={() => setView('pipeline')}
                    className={`flex-1 py-3 px-2 rounded-t-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 border-b-2 ${view === 'pipeline' ? 'bg-white/5 text-primary border-primary' : 'text-white/60 border-transparent hover:text-white'}`}>
                    <span>Pipe</span>
                    {effects.length > 0 && (
                        <span className="bg-primary/20 text-primary rounded-full text-[10px] font-bold w-[18px] h-[18px] grid place-items-center leading-none border border-primary/30 tracking-normal">
                            {effects.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setView('effects')}
                    className={`flex-1 py-3 px-2 rounded-t-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all border-b-2 ${view === 'effects' ? 'bg-white/5 text-primary border-primary' : 'text-white/60 border-transparent hover:text-white'}`}>
                    Effects
                </button>
            </div>

            <div key="pipeline-scroll" className="flex-1 overflow-y-auto custom-scrollbar">
                {view === 'pipeline' ? (
                    <SidebarPipeline
                        onSelectEffect={() => setView('params')}
                        onNavigateToLibrary={() => setView('effects')}
                    />
                ) : (
                    <SidebarLibrary
                        onSelectEffect={() => setView('pipeline')}
                    />
                )}
            </div>
        </div>
    );
};


export default SidebarNavigation;
