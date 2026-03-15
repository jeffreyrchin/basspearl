import React, { useEffect, useState } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { useEffectStore } from '../store/useEffectStore';
import SidebarLibrary from './SidebarLibrary';

const LibraryWindow: React.FC = () => {
    const isLibraryOpen = useEffectStore(s => s.isLibraryOpen);
    const setIsLibraryOpen = useEffectStore(s => s.setIsLibraryOpen);

    const dragControls = useDragControls();

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (!isLibraryOpen) return null;

    return (
        isMobile ? (
            <div className="fixed inset-0 z-[100] flex items-end pointer-events-none">
                <div
                    className="absolute inset-0 bg-black/40 pointer-events-auto z-0"
                    onClick={() => setIsLibraryOpen(false)}
                />
                <motion.div
                    onClick={(e) => e.stopPropagation()}
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative z-10 w-full h-[85vh] bg-slate-900/95 backdrop-blur-xl border-t border-white/10 rounded-t-2xl pointer-events-auto flex flex-col shadow-2xl"
                >
                    <div className="h-14 border-b bg-slate-900 border-white/10 flex items-center justify-between px-6 shrink-0">
                        <span className="text-[12px] font-bold text-white uppercase tracking-[0.2em]">
                            Add Effect
                        </span>
                        <button
                            onClick={() => setIsLibraryOpen(false)}
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
                            title="Close Effects"
                        >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <SidebarLibrary />
                    </div>
                </motion.div>
            </div>
        ) : (
            <motion.div
                drag
                dragMomentum={false}
                dragListener={false}
                dragControls={dragControls}
                initial={{ opacity: 0, scale: 0.95, y: 0 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                style={{ position: 'absolute', top: 80, right: 400 }} // Default position to the left of the pipeline sidebar
                className="w-[360px] min-h-[500px] max-h-[85vh] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-[100] flex flex-col pointer-events-auto"
            >
                {/* Header / Drag Handle */}
                <div
                    className="h-12 border-b border-white/10 bg-slate-900 flex items-center justify-between px-4 shrink-0 cursor-grab active:cursor-grabbing rounded-t-xl select-none"
                    onPointerDown={(e) => dragControls.start(e)}
                >
                    <span className="text-[12px] font-bold text-white uppercase tracking-[0.2em] pointer-events-none">
                        Add Effect
                    </span>
                    <button
                        onClick={() => setIsLibraryOpen(false)}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
                        title="Close Effects"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>

                {/* Content Body */}
                <div
                    className="flex-1 overflow-y-auto custom-scrollbar isolate"
                    onPointerDown={(e) => e.stopPropagation()} // Prevent window from being dragged when interacting with content inside
                >
                    <SidebarLibrary />
                </div>
            </motion.div>
        )
    );
};

export default LibraryWindow;
