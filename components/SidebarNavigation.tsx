import React from 'react';
import { useEffectStore } from '../store/useEffectStore';
import SidebarLibrary from './SidebarLibrary';
import SidebarPipeline from './SidebarPipeline';
import SidebarParams from './SidebarParams';
import { EFFECT_METADATA } from '@/constants';

export type SidebarView = 'pipeline' | 'effects' | 'params';

interface SidebarNavigationProps {
    onClose?: () => void;
    view: SidebarView;
    onViewChange: (view: SidebarView) => void;
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
    onClose,
    view,
    onViewChange
}) => {
    const effects = useEffectStore(s => s.effects);
    const undo = useEffectStore(s => s.undo);
    const redo = useEffectStore(s => s.redo);
    const past = useEffectStore(s => s.past);
    const future = useEffectStore(s => s.future);

    const selectedEffectId = useEffectStore(s => s.selectedEffectId);
    const effectIndex = effects.findIndex(e => e.id === selectedEffectId);

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

    const HeaderRightControls = (
        <div className="flex items-center gap-2">
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
            {onClose && (
                <button
                    onClick={onClose}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                    title="Close Sidebar">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
            )}
        </div>
    );

    if (view === 'params') {
        const selectedEffect = effects[effectIndex];

        return (
            <div key="view-params" className="flex-1 flex flex-col min-h-0 pt-20 lg:pt-0 border-l border-white/5 animate-in fade-in slide-in-from-right-4 duration-300 bg-white/5">
                {/* Header Bar */}
                <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => onViewChange('pipeline')}
                            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
                            title="Back to Controls">
                            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                        </button>
                        <span className="text-[12px] font-bold text-white uppercase tracking-[0.2em]">
                            {selectedEffect ? EFFECT_METADATA[selectedEffect.type]?.label : "Parameters"}
                        </span>
                    </div>
                    {HeaderRightControls}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <SidebarParams selectedEffect={selectedEffect} selectedEffectIndex={effectIndex} />
                </div>
            </div>
        );
    }

    return (
        <div key="view-main" className="flex-1 flex flex-col min-h-0 pt-20 lg:pt-0 border-l border-white/5 animate-in fade-in slide-in-from-left-4 duration-300 bg-white/5">
            {/* Header Bar */}
            <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 shrink-0 relative">
                {/* Tabs */}
                <div className="flex h-full gap-1 -ml-2">
                    <button
                        onClick={() => onViewChange('pipeline')}
                        className={`w-16 h-full flex items-center justify-center transition-colors border-b-2 ${view === 'pipeline' ? 'text-white border-white' : 'text-white/60 hover:text-white border-transparent'}`}>
                        <span className="material-symbols-outlined text-base">tune</span>
                    </button>
                    <button
                        onClick={() => onViewChange('effects')}
                        className={`w-16 h-full flex items-center justify-center transition-colors border-b-2 ${view === 'effects' ? 'text-white border-white' : 'text-white/60 hover:text-white border-transparent'}`}>
                        <span className="material-symbols-outlined text-base">add_circle</span>
                    </button>
                </div>
                {HeaderRightControls}
            </div>

            <div key="pipeline-scroll" className="flex-1 overflow-y-auto custom-scrollbar">
                {view === 'pipeline' ? (
                    <SidebarPipeline
                        onSelectEffect={() => onViewChange('params')}
                        onNavigateToLibrary={() => onViewChange('effects')}
                    />
                ) : (
                    <SidebarLibrary
                        onSelectEffect={() => onViewChange('pipeline')}
                    />
                )}
            </div>
        </div>
    );
};

export default SidebarNavigation;
