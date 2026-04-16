import React, { useEffect, useState } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { useEffectStore } from '../store/useEffectStore';
import { EFFECT_METADATA } from '@/constants';
import SidebarParams from './SidebarParams';

const InspectorWindow: React.FC = () => {
    const focusStack = useEffectStore(s => s.focusStack);
    const pushFocus = useEffectStore(s => s.pushFocus);
    const removeFocus = useEffectStore(s => s.removeFocus);
    const isInspectorOpen = focusStack.includes('inspector');

    const setActiveDropdownId = useEffectStore(s => s.setActiveDropdownId);

    const selectedIds = useEffectStore(s => s.selectedIds);
    const effects = useEffectStore(s => s.effects);

    const undo = useEffectStore(s => s.undo);
    const redo = useEffectStore(s => s.redo);
    const past = useEffectStore(s => s.past);
    const future = useEffectStore(s => s.future);

    const dragControls = useDragControls();

    const isMobile = useEffectStore(s => s.isMobile);

    const minWidth = 280;
    const minHeight = 150;
    const initialWidth = Math.max(minWidth, window.innerWidth * 0.25);
    const initialHeight = Math.max(minHeight, window.innerHeight * 0.75);

    const [winWidth, setWinWidth] = useState(initialWidth);
    const [winHeight, setWinHeight] = useState(initialHeight);
    const [winX, setWinX] = useState((window.innerWidth - initialWidth) / 2);

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
                onClick={() => removeFocus('inspector')}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
                title="Close Inspector (I)"
            >
                <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
        </div>
    );

    // Mobile View (full screen)
    if (isMobile) {
        return (
            <div
                className="fixed inset-0 z-window flex items-end pointer-events-none"
                style={{ zIndex: `calc(var(--z-index-window) + ${focusStack.indexOf('inspector')})` }}
            >
                <div
                    className="absolute inset-0 bg-black/40 pointer-events-auto z-0"
                    onClick={() => removeFocus('inspector')}
                />
                <div
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={() => {
                        pushFocus('inspector');
                    }}
                    className="relative z-10 w-full h-[85vh] bg-slate-900/95 border-t border-white/10 rounded-t-2xl pointer-events-auto flex flex-col shadow-2xl"
                    data-section="window"
                    data-window="inspector"
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
                </div>
            </div>
        );
    }

    // Desktop view: draggable & resizable window
    return (
        <motion.div
            drag
            dragMomentum={false}
            dragListener={false}
            dragControls={dragControls}
            onPointerDown={() => {
                pushFocus('inspector');
            }}
            initial={{ opacity: 0, scale: 0.95, y: 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            style={{
                position: 'absolute',
                top: 80,
                left: winX,
                width: winWidth,
                height: winHeight,
                zIndex: `calc(var(--z-index-window) + ${focusStack.indexOf('inspector')})`
            }}
            className="bg-slate-900/95 border border-white/10 rounded-xl shadow-2xl z-window flex flex-col pointer-events-auto overflow-hidden"
            data-section="window"
            data-window="inspector"
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
                    pushFocus('inspector');
                }}
            >
                <SidebarParams />
            </div>

            {/* Resize Handle */}
            <motion.div
                drag
                dragMomentum={false}
                dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
                dragElastic={0}
                onDrag={(e, info) => {
                    setWinWidth(prev => Math.max(minWidth, prev + info.delta.x));
                    setWinHeight(prev => Math.max(minHeight, prev + info.delta.y));
                }}
                tabIndex={0}
                title="Resize Window"
                onKeyDown={(e) => {
                    if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
                    e.preventDefault(); e.stopPropagation();
                    const step = e.shiftKey ? 40 : 10;
                    if (e.key === 'ArrowRight') setWinWidth(prev => Math.max(minWidth, prev + step));
                    if (e.key === 'ArrowLeft') setWinWidth(prev => Math.max(minWidth, prev - step));
                    if (e.key === 'ArrowDown') setWinHeight(prev => Math.max(minHeight, prev + step));
                    if (e.key === 'ArrowUp') setWinHeight(prev => Math.max(minHeight, prev - step));
                }}
                className="absolute bottom-0 right-0 w-6 h-6 flex items-center justify-center cursor-nwse-resize z-20 group outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
                <span className="material-symbols-outlined text-[16px] text-white/60 group-hover:text-white/60 transition-colors select-none">
                    drag_pan
                </span>
            </motion.div>
        </motion.div>
    );
};

export default InspectorWindow;
