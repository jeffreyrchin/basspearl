import React, { useState } from 'react';
import EffectRack from './EffectRack';
import EffectLibrary from './EffectLibrary';
import EffectParams from './EffectParams';

import { useEffectStore } from '../store/useEffectStore';

interface SidebarNavigationProps {
    onClose?: () => void;
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
    onClose,
}) => {
    const [view, setView] = useState<'rack' | 'params'>('rack');
    const [selectedTab, setSelectedTab] = useState<'active' | 'effects'>('active');
    const { effects } = useEffectStore();

    const activeEffectsList = effects
        .map((effect, originalIndex) => ({ ...effect, originalIndex }))
        .filter(e => e.active);

    if (view === 'params') {
        return (
            <div className="flex-1 flex flex-col min-h-0 pt-20 lg:pt-0 animate-in fade-in slide-in-from-right-4 duration-300 bg-[#050B14]">
                {/* Header Bar */}
                <div className="h-14 border-b border-white/5 bg-black/40 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setView('rack')}
                            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 transition-all border border-white/5"
                            title="Back to library">
                            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                        </button>
                        <span className="text-[10px] font-bold text-white uppercase tracking-[0.3em]">Parameters</span>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                            aria-label="Close sidebar">
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <EffectParams />
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 pt-20 lg:pt-0 animate-in fade-in slide-in-from-left-4 duration-300 bg-[#050B14]">
            {/* Header Bar */}
            <div className="h-14 border-b border-white/5 bg-black/40 flex items-center justify-between px-6 shrink-0 relative">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-white uppercase tracking-[0.4em]">Controls</span>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                        aria-label="Close sidebar">
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                )}
            </div>

            {/* Tab Bar */}
            <div className="flex px-4 pt-2 pb-0 gap-1 bg-black/40 border-b border-white/5">
                <button
                    onClick={() => setSelectedTab('active')}
                    className={`flex-1 py-3 px-2 rounded-t-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 border-b-2 ${selectedTab === 'active' ? 'bg-white/5 text-primary border-primary' : 'text-white/40 border-transparent hover:text-white/60'}`}>
                    <span>Active</span>
                    {activeEffectsList.length > 0 && (
                        <span className="bg-primary/20 text-primary rounded-full text-[8px] font-bold w-[17px] h-[17px] grid place-items-center leading-none border border-primary/30 tracking-normal">
                            {activeEffectsList.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setSelectedTab('effects')}
                    className={`flex-1 py-3 px-2 rounded-t-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all border-b-2 ${selectedTab === 'effects' ? 'bg-white/5 text-primary border-primary' : 'text-white/40 border-transparent hover:text-white/60'}`}>
                    Effects
                </button>
            </div>

            <div key="rack-scroll" className="flex-1 overflow-y-auto custom-scrollbar bg-black/10">
                {selectedTab === 'active' ? (
                    <EffectRack
                        onSelectEffect={() => setView('params')}
                        onNavigateToLibrary={() => setSelectedTab('effects')}
                    />
                ) : (
                    <EffectLibrary
                        onSelectEffect={() => setView('params')}
                    />
                )}
            </div>
        </div>
    );
};


export default SidebarNavigation;
