import React from 'react';

const Shortcut: React.FC<{ keys: (string | string[])[]; description: string }> = ({ keys, description }) => {
    const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

    return (
        <div className="flex items-center justify-between group">
            <div className="flex items-center gap-1.5">
                {keys.map((segment, i) => (
                    <React.Fragment key={i}>
                        {i > 0 && <span className="text-[10px] text-white/60 font-bold px-0.5">+</span>}
                        <div className="flex items-center gap-1.5">
                            {(Array.isArray(segment) ? segment : [segment]).map((key, j) => (
                                <React.Fragment key={key + j}>
                                    {j > 0 && <span className="text-[10px] text-white/60 font-bold px-0.5">/</span>}
                                    <kbd className="min-w-[24px] h-6 px-1.5 flex items-center justify-center rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-white/90 group-hover:bg-white/10 group-hover:border-white/30 transition-all shadow-sm">
                                        {key === 'Mod' ? (isMac ? '⌘' : 'Ctrl') : key}
                                    </kbd>
                                </React.Fragment>
                            ))}
                        </div>
                    </React.Fragment>
                ))}
            </div>
            <span className="text-[11px] text-white/60 group-hover:text-white transition-colors uppercase tracking-wider">{description}</span>
        </div>
    );
};

const HelpContent: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-12">
            {/* Getting Started */}
            <section className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-primary active-glow">Getting Started</h2>
                <div className="space-y-8">
                    <div className="space-y-3">
                        <p className="text-white text-base leading-relaxed">
                            <span className="font-bold text-white">1. Select audio source:</span> In the main toolbar, click <span className="material-symbols-outlined">audio_file</span>, <span className="material-symbols-outlined">mic</span>, or <span className="material-symbols-outlined">present_to_all</span> to select your audio source. If you have a virtual audio driver installed such as BlackHole or Voicemeeter, you can select the microphone to route audio to Muxels from any application on your device.
                        </p>
                        <p className="text-white text-base leading-relaxed">
                            <span className="font-bold text-white">2. Add effects:</span> To add visual effects, click <span className="material-symbols-outlined">add_circle</span> in the main toolbar to open the library. Click on an effect to add it to your visualizer.
                        </p>
                        <p className="text-white text-base leading-relaxed">
                            <span className="font-bold text-white">3. Adjust effects:</span> Click <span className="material-symbols-outlined">format_list_bulleted</span> in the main toolbar to open the sidebar where you can view your added effects.
                        </p>
                    </div>

                    <ul className="space-y-6 list-none">
                        <li className="relative pl-6 space-y-1 before:content-[''] before:absolute before:left-0 before:top-1.5 before:w-1.5 before:h-1.5 before:bg-primary before:rounded-full">
                            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">Reordering effects:</h3>
                            <p className="text-white/70 text-sm leading-relaxed">
                                Effects and effect groups can be reordered by dragging the drag handles (<span className="material-symbols-outlined">drag_indicator</span>) in the effect cards.
                            </p>
                        </li>

                        <li className="relative pl-6 space-y-1 before:content-[''] before:absolute before:left-0 before:top-1.5 before:w-1.5 before:h-1.5 before:bg-primary before:rounded-full">
                            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">Creating effect groups:</h3>
                            <p className="text-white/70 text-sm leading-relaxed">
                                Select a contiguous group of effects to enable to the "Group" button (<span className="material-symbols-outlined">group_work</span>) in the sidebar toolbar. Grouping effects isolates them from the rest of the effect pipeline.
                            </p>
                        </li>

                        <li className="relative pl-6 space-y-1 before:content-[''] before:absolute before:left-0 before:top-1.5 before:w-1.5 before:h-1.5 before:bg-primary before:rounded-full">
                            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">Effect card buttons:</h3>
                            <p className="text-white/70 text-sm leading-relaxed">
                                In each effect card, toggle the <span className="material-symbols-outlined">pill</span> icon to solo/unsolo an effect, and toggle the <span className="material-symbols-outlined">visibility</span> icon to show/hide an effect. Double-clicking an effect card opens the inspector.
                            </p>
                        </li>

                        <li className="relative pl-6 space-y-1 before:content-[''] before:absolute before:left-0 before:top-1.5 before:w-1.5 before:h-1.5 before:bg-primary before:rounded-full">
                            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">Effect parameters:</h3>
                            <p className="text-white/70 text-sm leading-relaxed">
                                In the inspector, parameter levels can be adjusted by moving the slider handles. Select a frequency band in the dropdown menu above a parameter slider to sync the parameter to a frequency band. When a frequency band is selected, the frequency band will control the parameter level between the two slider handles. When “Off” is selected, the parameter level will be fixed.
                            </p>
                        </li>
                    </ul>

                    <p className="text-white text-base leading-relaxed">
                        <span className="font-bold text-white">4. Export video:</span> Click the <span className="material-symbols-outlined">download</span> button in the main toolbar to export your creation as an MP4 video.
                    </p>
                </div>
            </section>

            {/* Keyboard Shortcuts */}
            <section className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-primary active-glow">Keyboard Shortcuts</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Playback */}
                    <div className="space-y-4">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-white border-b border-white/5 pb-2">Playback & Timeline</h3>
                        <div className="space-y-3">
                            <Shortcut keys={['Space']} description="Play / Pause" />
                            <Shortcut keys={[['←', '→']]} description="Seek ±5 seconds" />
                            <Shortcut keys={['Shift', ['←', '→']]} description="Seek ±10 seconds" />
                            <Shortcut keys={[['J', 'L']]} description="Seek ±10 seconds" />
                        </div>
                    </div>

                    {/* Interface */}
                    <div className="space-y-4">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-white border-b border-white/5 pb-2">Interface</h3>
                        <div className="space-y-3">
                            <Shortcut keys={['H']} description="Hide UI" />
                            <Shortcut keys={['Esc']} description="Show UI / Close Modals" />
                            <Shortcut keys={['P']} description="Toggle Sidebar" />
                            <Shortcut keys={['I']} description="Toggle Inspector" />
                            <Shortcut keys={['Y']} description="Toggle Library" />
                            <Shortcut keys={['K']} description="Toggle Scene Bar" />
                        </div>
                    </div>

                    {/* Pipeline */}
                    <div className="space-y-4">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-white border-b border-white/5 pb-2">Pipeline & Effects</h3>
                        <div className="space-y-3">
                            <Shortcut keys={['Mod', 'A']} description="Select All Effects" />
                            <Shortcut keys={['Mod', 'D']} description="Duplicate Selected" />
                            <Shortcut keys={['Mod', 'G']} description="Group Selected" />
                            <Shortcut keys={['Mod', 'Shift', 'G']} description="Ungroup Selected" />
                            <Shortcut keys={['Del']} description="Remove Selected" />
                            <Shortcut keys={['Esc']} description="Clear Selection" />
                            <Shortcut keys={['O']} description="Add Image" />
                            <Shortcut keys={['C']} description="Add 'Color Select'" />
                        </div>
                    </div>

                    {/* Navigation & History */}
                    <div className="space-y-4">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-white border-b border-white/5 pb-2">Scenes & History</h3>
                        <div className="space-y-3">
                            <Shortcut keys={[['1', '...', '9']]} description="Switch to Scene 1-9" />
                            <Shortcut keys={['[']} description="Previous Scene" />
                            <Shortcut keys={[']']} description="Next Scene" />
                            <Shortcut keys={['Mod', 'Z']} description="Undo" />
                            <Shortcut keys={['Mod', 'Shift', 'Z']} description="Redo" />
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-primary active-glow">Frequently Asked Questions</h2>
                <div className="space-y-3">
                    <div className="glass-panel p-5 rounded-xl border border-white/10">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-2">Are my images and audio uploaded to a server?</h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                            No. All processing happens locally in your browser. Your images and audio never leave your device.
                        </p>
                    </div>
                    <div className="glass-panel p-5 rounded-xl border border-white/10">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-2">Which file formats are supported?</h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                            Images: .jpg, .jpeg, .png, .webp, .heic. Audio: .mp3, .wav, .m4a, .aac, .ogg. Export: .mp4 (H.264).
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HelpContent;
