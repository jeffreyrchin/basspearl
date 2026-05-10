import React from 'react';
import { useEffectStore } from '../store/useEffectStore';
import { TRANSITION_OPTIONS } from '../constants';

interface SceneSettingsPanelProps {
    showEndlessControls?: boolean;
}

export const SceneSettingsPanel: React.FC<SceneSettingsPanelProps> = ({
    showEndlessControls = false
}) => {
    const transitionType = useEffectStore(s => s.transitionType);
    const setTransitionType = useEffectStore(s => s.setTransitionType);
    const transitionDuration = useEffectStore(s => s.transitionDuration);
    const setTransitionDuration = useEffectStore(s => s.setTransitionDuration);
    const endlessInterval = useEffectStore(s => s.endlessInterval);
    const setEndlessInterval = useEffectStore(s => s.setEndlessInterval);

    return (
        <div className={`w-fit rounded-xl bg-black/80 border border-white/8 px-4 py-3 flex flex-col gap-2 ${showEndlessControls ? 'mx-auto' : 'mt-1'}`}>
            {/* Transition type */}
            <div className="flex items-center gap-3">
                <span className="text-[9px] font-bold text-white uppercase tracking-widest whitespace-nowrap w-16 shrink-0">Transition</span>
                <div className="flex items-center gap-1">
                    {TRANSITION_OPTIONS.map((opt) => {
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
                    })}
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
                    <span className="text-[9px] w-7 text-right font-medium tabular-nums text-white/60">{transitionDuration.toFixed(1)}s</span>
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
                            className="grow h-0.5 bg-amber-400/30 rounded-full appearance-none cursor-pointer accent-amber-400"
                        />
                        <span className="text-[9px] w-7 text-right font-medium tabular-nums text-amber-400/80">{endlessInterval}s</span>
                    </div>
                </div>
            )}
        </div>
    );
};
