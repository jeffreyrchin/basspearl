import React from 'react';
import { useEffectStore } from '../store/useEffectStore';
import SidebarLibrary from './SidebarLibrary';
import SidebarPipeline from './SidebarPipeline';
import SidebarParams from './SidebarParams';
import ActionBar from './ActionBar';
import { EFFECT_METADATA } from '@/constants';
import { sanitizeImportedEffects } from '@/services/sanitizeImportedEffects';

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
    const isInSelectMode = useEffectStore(s => s.isInSelectMode);
    const setIsInSelectMode = useEffectStore(s => s.setIsInSelectMode);
    const clearSelection = useEffectStore(s => s.clearSelection);

    const selectedEffectId = useEffectStore(s => s.selectedEffectId);
    const setEffects = useEffectStore(s => s.setEffects);
    const selectedEffect = effects.find(e => e.id === selectedEffectId) ?? null;

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
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target?.result as string);
                    if (Array.isArray(json)) {
                        const sanitized = sanitizeImportedEffects(json);
                        if (sanitized.length > 0) {
                            setEffects(sanitized);
                            onViewChange('pipeline');
                        } else {
                            alert("No valid effects found in this .muxels file.");
                        }
                    } else {
                        alert("Invalid .muxels file format");
                    }
                } catch (err) {
                    console.error("Failed to parse .muxels file", err);
                    alert("Failed to parse .muxels file.");
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

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
                {view === 'pipeline' && (
                    <button
                        onClick={() => {
                            if (isInSelectMode) setIsInSelectMode(false);
                            else setIsInSelectMode(true);
                        }}
                        className={`px-2 h-7 rounded-md flex items-center justify-center text-[9px] font-bold uppercase tracking-wider transition-all border ${isInSelectMode ? 'bg-white text-black border-white' : 'text-white/60 hover:text-white hover:bg-white/10 border-transparent'}`}
                        title="Multiselect"
                    >
                        <span className="material-symbols-outlined text-[18px]">gesture_select</span>
                    </button>
                )}
                <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
                <button
                    onClick={handleImport}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
                    title="Import .muxels">
                    <span className="material-symbols-outlined text-[18px]">file_upload</span>
                </button>
                <button
                    onClick={handleExport}
                    disabled={effects.length === 0}
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${effects.length > 0 ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-white/20 cursor-not-allowed'}`}
                    title="Export .muxels">
                    <span className="material-symbols-outlined text-[18px]">file_download</span>
                </button>
                <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
                <button
                    onClick={undo}
                    disabled={past.length === 0}
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${past.length > 0 ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-white/20 cursor-not-allowed'}`}
                    title="Undo (Cmd+Z)">
                    <span className="material-symbols-outlined text-[18px]">undo</span>
                </button>
                <button
                    onClick={redo}
                    disabled={future.length === 0}
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${future.length > 0 ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-white/20 cursor-not-allowed'}`}
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
                    <SidebarParams selectedEffect={selectedEffect} />
                </div>
            </div>
        );
    }

    return (
        <div key="view-main" className="flex-1 flex flex-col min-h-0 pt-20 lg:pt-0 border-l border-white/5 animate-in fade-in slide-in-from-left-4 duration-300 bg-white/5 relative">
            {/* Header Bar */}
            <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 shrink-0 relative">
                {/* Tabs */}
                <div className="flex h-full gap-1 -ml-2">
                    <button
                        onClick={() => onViewChange('pipeline')}
                        className={`w-12 h-full flex items-center justify-center transition-colors border-b-2 ${view === 'pipeline' ? 'text-white border-white' : 'text-white/60 hover:text-white border-transparent'}`}
                        title="Controls">
                        <span className="material-symbols-outlined text-base">tune</span>
                    </button>
                    <button
                        onClick={() => onViewChange('effects')}
                        className={`w-12 h-full flex items-center justify-center transition-colors border-b-2 ${view === 'effects' ? 'text-white border-white' : 'text-white/60 hover:text-white border-transparent'}`}
                        title="Add Effects">
                        <span className="material-symbols-outlined text-base">add_circle</span>
                    </button>
                </div>
                {HeaderRightControls}
            </div>

            <div key="pipeline-scroll" className="flex-1 overflow-y-auto custom-scrollbar">
                {view === 'pipeline' ? (
                    <SidebarPipeline
                        onNavigateToLibrary={() => onViewChange('effects')}
                    />
                ) : (
                    <SidebarLibrary
                        onSelectEffect={() => onViewChange('pipeline')}
                    />
                )}
            </div>

            {/* Global Action Bar anchored to the bottom of the sidebar */}
            <ActionBar onOpenParams={() => onViewChange('params')} />
        </div>
    );
};

export default SidebarNavigation;
