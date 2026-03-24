import React, { useEffect, useState } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { useEffectStore } from '../store/useEffectStore';
import SidebarLibrary from './SidebarLibrary';

const LibraryWindow: React.FC = () => {
    const focusStack = useEffectStore(s => s.focusStack);
    const pushFocus = useEffectStore(s => s.pushFocus);
    const removeFocus = useEffectStore(s => s.removeFocus);
    const isLibraryOpen = focusStack.includes('library');

    const setActiveDropdownId = useEffectStore(s => s.setActiveDropdownId);

    const dragControls = useDragControls();

    const [isMobile, setIsMobile] = useState(false);

    const minWidth = 300;
    const minHeight = 200;
    const initialWidth = Math.max(minWidth, window.innerWidth * 0.3);
    const initialHeight = Math.max(minHeight, window.innerHeight * 0.75);

    const [winWidth, setWinWidth] = useState(initialWidth);
    const [winHeight, setWinHeight] = useState(initialHeight);

    const [entranceComplete, setEntranceComplete] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (!isLibraryOpen) return null;

    return (
        isMobile ? (
            <div
                className="fixed inset-0 z-window flex items-end pointer-events-none"
                style={{ zIndex: `calc(var(--z-index-window) + ${focusStack.indexOf('library')})` }}
            >
                <div
                    className="absolute inset-0 bg-black/40 pointer-events-auto z-0"
                    onClick={() => removeFocus('library')}
                />
                <div
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={() => {
                        pushFocus('library');
                    }}
                    className="relative z-10 w-full h-[85vh] bg-slate-900/95 backdrop-blur-xl border-t border-white/10 rounded-t-2xl pointer-events-auto flex flex-col shadow-2xl"
                    data-section="window"
                    data-window="library"
                >
                    <div className="h-14 border-b bg-slate-900 border-white/10 flex items-center justify-between px-6 shrink-0">
                        <span className="text-[12px] font-bold text-white uppercase tracking-[0.2em]">
                            Library
                        </span>
                        <button
                            onClick={() => removeFocus('library')}
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
                            title="Close Library (Y)"
                        >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar" onScroll={() => setActiveDropdownId(null)}>
                        <SidebarLibrary onSelectEffect={() => removeFocus('library')} />
                    </div>
                </div>
            </div>
        ) : (
            <motion.div
                drag
                dragMomentum={false}
                dragListener={false}
                dragControls={dragControls}
                onPointerDown={() => {
                    pushFocus('library');
                }}
                initial={{ opacity: 0, scale: 0.95, y: 0 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                onAnimationComplete={() => setEntranceComplete(true)}
                style={{
                    position: 'absolute',
                    top: 80,
                    left: 400,
                    width: winWidth,
                    height: winHeight,
                    zIndex: `calc(var(--z-index-window) + ${focusStack.indexOf('library')})`
                }}
                className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-window flex flex-col pointer-events-auto overflow-hidden"
                data-section="window"
                data-window="library"
            >
                {/* Header / Drag Handle */}
                <div
                    className="h-12 border-b border-white/10 bg-slate-900 flex items-center justify-between px-4 shrink-0 cursor-grab active:cursor-grabbing rounded-t-xl select-none"
                    onPointerDown={(e) => dragControls.start(e)}
                >
                    <span className="text-[12px] font-bold text-white uppercase tracking-[0.2em] pointer-events-none">
                        Library
                    </span>
                    <button
                        onClick={() => removeFocus('library')}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
                        title="Close Library (Y)"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>

                {/* Content Body */}
                <div
                    className="flex-1 overflow-y-auto custom-scrollbar isolate"
                    onScroll={() => setActiveDropdownId(null)}
                    onPointerDown={(e) => {
                        e.stopPropagation(); // Prevent window from being dragged when interacting with content inside
                        pushFocus('library');
                    }}
                >
                    {entranceComplete ? (
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
                            <span className="text-[12px] font-bold text-white uppercase tracking-[0.2em]">
                                Loading...
                            </span>
                        </div>
                    )}
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
        )
    );
};

export default LibraryWindow;
