import React from 'react';
import { useEffectStore } from '../store/useEffectStore';
import { TRANSITION_OPTIONS } from '../constants';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface SceneSettingsPanelProps {
    showEndlessControls?: boolean;
}

const TransitionDropdown: React.FC<{
    value: string;
    onChange: (val: any) => void;
}> = ({ value, onChange }) => {
    const activeDropdownId = useEffectStore(s => s.activeDropdownId);
    const setActiveDropdownId = useEffectStore(s => s.setActiveDropdownId);
    const dropdownId = 'scene-transition';
    const isOpen = activeDropdownId === dropdownId;

    const triggerRef = React.useRef<HTMLButtonElement>(null);

    const activeOption = TRANSITION_OPTIONS.find(opt => opt.value === value);

    return (
        <div className="relative">
            <button
                ref={triggerRef}
                data-dropdown-ignore="true"
                onClick={() => setActiveDropdownId(isOpen ? null : dropdownId)}
                className="group flex items-center gap-2 bg-white/5 hover:bg-white/10 active:scale-[0.98] text-white text-[9px] font-bold uppercase tracking-widest pl-3 pr-2 py-1.5 rounded-lg border border-white/10 transition-all cursor-pointer"
            >
                <span>{activeOption?.label}</span>
                <span className={`material-symbols-outlined !text-[16px] transition-all duration-300 group-hover:text-white text-white/60 ${isOpen ? 'rotate-180' : ''}`}>
                    expand_more
                </span>
            </button>

            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            key="transition-dropdown-menu"
                            initial={{ opacity: 0, y: -6, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            style={{
                                position: 'fixed',
                                top: triggerRef.current ? triggerRef.current.getBoundingClientRect().bottom + 6 : 0,
                                left: triggerRef.current ? triggerRef.current.getBoundingClientRect().left : 0,
                                width: '130px',
                            }}
                            data-dropdown-ignore="true"
                            className="bg-zinc-900 border border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[9999] overflow-hidden p-1"
                        >
                            {TRANSITION_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setActiveDropdownId(null);
                                    }}
                                    className={`w-full px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all
                                        ${value === opt.value
                                            ? 'bg-white/10 text-white'
                                            : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

export const SceneSettingsPanel: React.FC<SceneSettingsPanelProps> = ({
    showEndlessControls = false
}) => {
    const transitionType = useEffectStore(s => s.transitionType);
    const setTransitionType = useEffectStore(s => s.setTransitionType);
    const transitionDuration = useEffectStore(s => s.transitionDuration);
    const setTransitionDuration = useEffectStore(s => s.setTransitionDuration);
    const endlessInterval = useEffectStore(s => s.endlessInterval);
    const setEndlessInterval = useEffectStore(s => s.setEndlessInterval);
    const isMobile = useEffectStore(s => s.isMobile);

    return (
        <div className={`w-fit rounded-xl bg-black/80 border border-white/8 px-5 py-3 flex flex-col gap-2 ${showEndlessControls ? 'mx-auto' : 'mt-1'}`}>
            {/* Transition type */}
            <div className="flex items-center gap-3">
                <span className="text-[9px] font-bold text-white uppercase tracking-widest whitespace-nowrap w-16 shrink-0">Transition</span>
                <div className="flex items-center gap-1">
                    {isMobile ? (
                        <TransitionDropdown value={transitionType} onChange={setTransitionType} />
                    ) : (
                        TRANSITION_OPTIONS.map((opt) => {
                            const isActive = transitionType === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => setTransitionType(opt.value as any)}
                                    className={`px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-wide transition-all
                                        ${isActive
                                            ? 'bg-white/20 text-white border border-white/10'
                                            : 'text-white/60 hover:text-white border border-transparent hover:border-white/10'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Duration slider */}
            <div className="flex items-center gap-3">
                <span className="text-[9px] font-bold text-white uppercase tracking-widest whitespace-nowrap w-16 shrink-0">Duration</span>
                <div className="flex items-center gap-3 grow max-w-50">
                    <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.1"
                        value={transitionDuration}
                        onChange={(e) => setTransitionDuration(parseFloat(e.target.value))}
                        className="grow h-0.5 bg-white/30 rounded-full appearance-none cursor-pointer accent-white"
                    />
                    <span className="text-[9px] w-7 text-right font-medium tabular-nums text-white/80">{transitionDuration.toFixed(1)}s</span>
                </div>
            </div>

            {/* Endless Mode "Every" parameter */}
            {showEndlessControls && (
                <div className="flex items-center gap-3">
                    <span className="text-[9px] font-bold text-white uppercase tracking-widest whitespace-nowrap w-16 shrink-0">Every</span>
                    <div className="flex items-center gap-3 grow max-w-50">
                        <input
                            type="range"
                            min="1"
                            max="60"
                            step="1"
                            value={endlessInterval}
                            onChange={(e) => setEndlessInterval(parseInt(e.target.value))}
                            className="grow h-0.5 bg-white/30 rounded-full appearance-none cursor-pointer accent-white"
                        />
                        <span className="text-[9px] w-7 text-right font-medium tabular-nums text-white/80">{endlessInterval}s</span>
                    </div>
                </div>
            )}
        </div>
    );
};
