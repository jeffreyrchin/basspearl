import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffectStore } from '../store/useEffectStore';
import { useProStore } from '@/store/useProStore';
import { MAX_FREE_SCENES } from '../constants';
import { SceneSettingsPanel } from './SceneSettingsPanel';

const SceneHotbar: React.FC = () => {
    const isSceneHotbarOpen = useEffectStore(s => s.isSceneHotbarOpen);
    const scenes = useEffectStore(s => s.scenes);
    const activeSceneIndex = useEffectStore(s => s.activeSceneIndex);
    const liveEffects = useEffectStore(s => s.effects);
    const switchScene = useEffectStore(s => s.switchScene);
    const addScene = useEffectStore(s => s.addScene);
    const isPro = useProStore(s => s.isPro);
    const openProModal = useProStore(s => s.openProModal);
    const canAddScene = isPro || scenes.length < MAX_FREE_SCENES;

    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

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
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="pointer-events-auto flex flex-col gap-1.5 w-fit max-w-[300px] lg:max-w-[370px] xl:max-w-[430px]"
                    title="Scene Bar (1-9 to switch scenes, [ / ] to navigate scenes)"
                >
                    {/* TOP ROW: actions */}
                    <div className="flex items-center justify-between gap-2 px-5">
                        <span className="text-[12px] font-display font-bold text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.8)] uppercase tracking-widest select-none">Scenes</span>
                        <div className="flex items-center gap-2">
                            {/* Add scene */}
                            <button
                                onClick={() => canAddScene ? addScene() : openProModal()}
                                title={canAddScene ? 'Add New Scene' : 'Pro Required for Additional Scenes'}
                                className="relative flex items-center justify-center bg-[#0a0a1a]/70 hover:bg-[#0a0a1a] w-10 h-6 rounded-full border border-indigo-300/70 hover:border-indigo-300 hover:text-indigo-300 text-white transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 group shadow-lg"
                            >
                                <span className="material-symbols-outlined !text-[16px]">add</span>
                                {!canAddScene && (
                                    <span className="material-symbols-outlined !text-[10px] text-indigo-300 absolute -top-1.5 -right-1.5 bg-[#0a0a1a] rounded-full p-0.5 border border-indigo-300/30 shadow-sm">lock</span>
                                )}
                            </button>
                            {/* Settings toggle */}
                            <button
                                onClick={() => setShowSettings(s => !s)}
                                title="Scene Settings"
                                className={`flex items-center justify-center w-10 h-6 rounded-full border transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary group shadow-lg
                                    ${showSettings
                                        ? 'bg-primary border-primary text-[#0a0a1a] shadow-[0_0_15px_rgba(240,171,252,0.8)]'
                                        : 'bg-[#0a0a1a]/70 border-primary/70 text-white hover:bg-[#0a0a1a] hover:border-primary hover:text-primary'}`}
                            >
                                <span className={`material-symbols-outlined !text-[14px] transition-transform duration-300 ${showSettings ? 'rotate-90' : ''}`}>settings</span>
                            </button>
                        </div>
                    </div>

                    {/* STRIP ROW */}
                    <div className="relative flex items-center">
                        {/* Left scroll fade + arrow */}
                        <AnimatePresence>
                            {canScrollLeft && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute left-0 top-0 bottom-0 z-10 flex items-center bg-gradient-to-r from-[#0a0a1a] to-transparent pointer-events-none rounded-l-lg"
                                >
                                    <button
                                        onClick={() => scroll('left')}
                                        className="pointer-events-auto flex items-center justify-center w-10 h-6 rounded-l-lg bg-transparent hover:bg-[#0a0a1a]/40 text-white hover:text-primary transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    >
                                        <span className="material-symbols-outlined !text-[18px]">chevron_left</span>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Scrollable strip — dark pill backdrop ensures readability on any bg */}
                        <div
                            ref={scrollRef}
                            className="flex items-center gap-[1px] overflow-x-auto no-scrollbar px-5 py-[8px] rounded-lg bg-[#0a0a1a]"
                        >
                            {scenes.map((slot, i) => {
                                const isActive = i === activeSceneIndex;
                                // For the active slot, use the live effects count (reactive); for parked slots, use the stored snapshot count
                                const effectCount = isActive ? liveEffects.length : slot.effects.length;
                                const hasFx = effectCount > 0;

                                return (
                                    <button
                                        key={i}
                                        onClick={() => switchScene(i)}
                                        title={`Scene ${i + 1}${hasFx ? ` · ${effectCount} effect${effectCount !== 1 ? 's' : ''}` : ' · Empty'}`}

                                        className={`h-[20px]
                                            relative shrink-0 transition-all duration-200 outline-none
                                            focus-visible:outline-2 focus-visible:outline-white/60
                                            ${isActive
                                                ? 'w-12 bg-white hover:brightness-110'
                                                : hasFx
                                                    ? 'w-10 bg-indigo-300 hover:bg-white'
                                                    : 'w-10 bg-white/35 hover:bg-white/60'
                                            }
                                        `}
                                    />
                                );
                            })}
                        </div>

                        {/* Right scroll fade + arrow */}
                        <AnimatePresence>
                            {canScrollRight && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute right-0 top-0 bottom-0 z-10 flex items-center bg-gradient-to-l from-[#0a0a1a] to-transparent pointer-events-none rounded-r-lg"
                                >
                                    <button
                                        onClick={() => scroll('right')}
                                        className="pointer-events-auto flex items-center justify-center w-10 h-6 rounded-r-lg bg-transparent hover:bg-[#0a0a1a]/40 text-white hover:text-primary transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    >
                                        <span className="material-symbols-outlined !text-[18px]">chevron_right</span>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* SETTINGS PANEL */}
                    <AnimatePresence>
                        {showSettings && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                className="overflow-hidden"
                            >
                                <SceneSettingsPanel />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SceneHotbar;
