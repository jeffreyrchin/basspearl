import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffectStore } from '../store/useEffectStore';

const SceneHotbar: React.FC = () => {
    const isSceneHotbarOpen = useEffectStore(s => s.isSceneHotbarOpen);
    const scenes = useEffectStore(s => s.scenes);
    const activeSceneIndex = useEffectStore(s => s.activeSceneIndex);
    const liveEffects = useEffectStore(s => s.effects);
    const switchScene = useEffectStore(s => s.switchScene);
    const addScene = useEffectStore(s => s.addScene);

    return (
        <AnimatePresence>
            {isSceneHotbarOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0A0F1E]/95 border border-white/10 shadow-[0_12px_48px_rgba(0,0,0,0.5),0_0_20px_rgba(251,0,255,0.06)] ring-1 ring-white/5"
                    title="Scene Bar - press 1-9 to switch scenes."
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
                                    relative w-9 h-9 flex flex-col items-center justify-center rounded-lg border transition-all outline-none
                                    focus-visible:ring-2 focus-visible:ring-primary/70
                                    ${isActive
                                        ? 'bg-primary/15 border-primary/40 text-primary'
                                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/25 hover:text-white'
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
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/25 transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                    >
                        <span className="material-symbols-outlined !text-[20px]">add</span>
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SceneHotbar;
