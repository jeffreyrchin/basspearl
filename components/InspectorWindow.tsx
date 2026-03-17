import React, { useEffect, useState } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { useEffectStore } from '../store/useEffectStore';
import { EFFECT_METADATA } from '@/constants';
import SidebarParams from './SidebarParams';

const InspectorWindow: React.FC = () => {
    const isInspectorOpen = useEffectStore(s => s.isInspectorOpen);
    const setIsInspectorOpen = useEffectStore(s => s.setIsInspectorOpen);
    const activeWindow = useEffectStore(s => s.activeWindow);
    const setActiveWindow = useEffectStore(s => s.setActiveWindow);
    const setIsSidebarFocused = useEffectStore(s => s.setIsSidebarFocused);
    const setActiveDropdownId = useEffectStore(s => s.setActiveDropdownId);

    const selectedIds = useEffectStore(s => s.selectedIds);
    const effects = useEffectStore(s => s.effects);

    const undo = useEffectStore(s => s.undo);
    const redo = useEffectStore(s => s.redo);
    const past = useEffectStore(s => s.past);
    const future = useEffectStore(s => s.future);

    const dragControls = useDragControls();

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (!isInspectorOpen) return null;

    let metadata = null;
    if (selectedIds.size === 1) {
        const selectedEffectId = selectedIds.values().next().value;
        const selectedEffect = effects.find(e => e.id === selectedEffectId);
        metadata = EFFECT_METADATA[selectedEffect?.type];
    }
    const headerControls = (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
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
            <button
                onClick={() => setIsInspectorOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
                title="Close Inspector"
            >
                <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
        </div>
    )

    // Mobile View (full screen)
    if (isMobile) {
        return (
            <div
                className="fixed inset-0 z-[100] flex items-end pointer-events-none"
                style={{ zIndex: activeWindow === 'inspector' ? 101 : 100 }}
            >
                <div
                    className="absolute inset-0 bg-black/40 pointer-events-auto z-0"
                    onClick={() => setIsInspectorOpen(false)}
                />
                <motion.div
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={() => {
                        setActiveWindow('inspector');
                        setIsSidebarFocused(false);
                    }}
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative z-10 w-full h-[85vh] bg-slate-900/95 border-t border-white/10 rounded-t-2xl pointer-events-auto flex flex-col shadow-2xl"
                    data-section="window"
                >
                    <div className="h-14 border-b bg-slate-900 border-white/10 flex items-center justify-between px-6 shrink-0">
                        <span className="text-[12px] font-bold text-white uppercase tracking-[0.2em]">
                            {metadata?.label || "Inspector"}
                        </span>
                        {headerControls}
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6" onScroll={() => setActiveDropdownId(null)}>
                        <SidebarParams />
                    </div>
                </motion.div>
            </div>
        );
    }

    // Desktop view: Draggable window
    return (
        <motion.div
            drag
            dragMomentum={false}
            dragListener={false}
            dragControls={dragControls}
            onPointerDown={() => {
                setActiveWindow('inspector');
                setIsSidebarFocused(false);
            }}
            initial={{ opacity: 0, scale: 0.95, y: 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            style={{
                position: 'absolute',
                top: 80,
                right: 400,
                zIndex: activeWindow === 'inspector' ? 101 : 100
            }} // Default position right beside the sidebar
            className="w-80 min-h-[400px] max-h-[80vh] bg-slate-900/95 border border-white/10 rounded-xl shadow-2xl z-[100] flex flex-col pointer-events-auto"
            data-section="window"
        >
            {/* Header / Drag Handle */}
            <div
                className="h-12 border-b border-white/10 bg-slate-900 flex items-center justify-between px-4 shrink-0 cursor-grab active:cursor-grabbing rounded-t-xl select-none"
                onPointerDown={(e) => dragControls.start(e)}
            >
                <span className="text-[12px] font-bold text-white uppercase tracking-[0.2em] pointer-events-none">
                    {metadata?.label || "Inspector"}
                </span>
                {headerControls}
            </div>

            {/* Content Body */}
            <div
                className="flex-1 overflow-y-auto custom-scrollbar p-5"
                onScroll={() => setActiveDropdownId(null)}
                onPointerDown={(e) => {
                    e.stopPropagation(); // Prevent window from being dragged when interacting with sliders
                    setActiveWindow('inspector');
                    setIsSidebarFocused(false);
                }}
            >
                <SidebarParams />
            </div>
        </motion.div>
    );
};

export default InspectorWindow;
