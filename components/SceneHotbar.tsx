import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffectStore } from '../store/useEffectStore';

const SceneHotbar: React.FC = () => {
    const isSceneHotbarOpen = useEffectStore(s => s.isSceneHotbarOpen);
    const scenes = useEffectStore(s => s.scenes);
    const activeSceneIndex = useEffectStore(s => s.activeSceneIndex);
    const liveEffects = useEffectStore(s => s.effects);
    const switchScene = useEffectStore(s => s.switchScene);
    const addScene = useEffectStore(s => s.addScene);

    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    // Update scroll indicators
    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 2);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2);
        }
    };

    // Initialize and listen for scroll
    useEffect(() => {
        checkScroll();
        const el = scrollRef.current;
        if (el) {
            el.addEventListener('scroll', checkScroll);
            // Also check on resize
            window.addEventListener('resize', checkScroll);
            return () => {
                el.removeEventListener('scroll', checkScroll);
                window.removeEventListener('resize', checkScroll);
            };
        }
    }, [scenes.length, isSceneHotbarOpen]);

    // Scroll to end when a new scene is added
    const prevScenesCountRef = useRef(scenes.length);
    useEffect(() => {
        if (scenes.length > prevScenesCountRef.current && scrollRef.current) {
            const container = scrollRef.current;
            // Use requestAnimationFrame to ensure DOM width has updated
            requestAnimationFrame(() => {
                container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
            });
        }
        prevScenesCountRef.current = scenes.length;
    }, [scenes.length]);

    // Auto-scroll to active scene
    useEffect(() => {
        if (scrollRef.current) {
            const activeEl = scrollRef.current.children[activeSceneIndex] as HTMLElement;
            if (activeEl) {
                const container = scrollRef.current;
                const scrollLeft = activeEl.offsetLeft - (container.clientWidth / 2) + (activeEl.clientWidth / 2);
                container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
            }
        }
    }, [activeSceneIndex, isSceneHotbarOpen]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const amount = scrollRef.current.clientWidth * 0.6;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -amount : amount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <AnimatePresence>
            {isSceneHotbarOpen && (
                <motion.div
                    layout="position"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="group relative pointer-events-auto h-12 flex items-center rounded-xl bg-[#0A0F1E]/95 border border-white/10 shadow-[0_12px_48px_rgba(0,0,0,0.5),0_0_20px_rgba(251,0,255,0.06)] ring-1 ring-white/5 overflow-hidden w-fit max-w-[60vw]"
                    title="Scene Bar (1-9 to switch scenes, [ / ] to navigate scenes)"
                >
                    {/* Left Gradient/Arrow */}
                    <AnimatePresence>
                        {canScrollLeft && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="absolute left-0 top-0 bottom-0 z-10 flex items-center pl-1 pr-8 bg-gradient-to-r from-[#0A0F1E] to-transparent pointer-events-none"
                            >
                                <button
                                    onClick={() => scroll('left')}
                                    className="pointer-events-auto w-6 h-8 flex items-center justify-center rounded-md hover:bg-white/10 text-white transition-colors"
                                >
                                    <span className="material-symbols-outlined !text-[18px]">chevron_left</span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Scrollable Content */}
                    <div
                        ref={scrollRef}
                        className="flex items-center gap-2 px-3 h-full overflow-x-auto no-scrollbar"
                    >
                        {scenes.map((slot, i) => {
                            const isActive = i === activeSceneIndex;
                            // For the active slot, use the live effects count (reactive); for parked slots, use the stored snapshot count
                            const effectCount = isActive ? liveEffects.length : slot.effects.length;

                            return (
                                <button
                                    key={i}
                                    onClick={() => switchScene(i)}
                                    title={`Scene ${i + 1}${effectCount > 0 ? ` (${effectCount} effect${effectCount !== 1 ? 's' : ''})` : ' (Empty)'}`}
                                    className={`
                                        relative shrink-0 w-9 h-9 flex flex-col items-center justify-center rounded-lg border transition-all outline-none
                                        focus-visible:ring-2 focus-visible:ring-primary/70
                                        ${isActive
                                            ? 'bg-primary/20 border-primary/50 text-primary shadow-[0_0_12px_rgba(251,0,255,0.2)]'
                                            : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/25'
                                        }
                                    `}
                                >
                                    {/* Slot Number */}
                                    <span className="text-[15px] font-semibold leading-none">
                                        {i + 1}
                                    </span>

                                    {/* Dot Indicator */}
                                    <span
                                        className={`
                                            absolute bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-0.5 rounded-full transition-all
                                            ${effectCount > 0
                                                ? isActive ? 'bg-primary' : 'bg-indigo-300'
                                                : 'bg-transparent'
                                            }
                                        `}
                                    />
                                </button>
                            );
                        })}

                        <button
                            onClick={() => addScene()}
                            title="Add New Scene"
                            tabIndex={0}
                            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/25 transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                        >
                            <span className="material-symbols-outlined !text-[20px]">add</span>
                        </button>
                    </div>

                    {/* Right Gradient/Arrow */}
                    <AnimatePresence>
                        {canScrollRight && (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="absolute right-0 top-0 bottom-0 z-10 flex items-center pr-1 pl-8 bg-gradient-to-l from-[#0A0F1E] to-transparent pointer-events-none"
                            >
                                <button
                                    onClick={() => scroll('right')}
                                    className="pointer-events-auto w-6 h-8 flex items-center justify-center rounded-md hover:bg-white/10 text-white transition-colors"
                                >
                                    <span className="material-symbols-outlined !text-[18px]">chevron_right</span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SceneHotbar;
