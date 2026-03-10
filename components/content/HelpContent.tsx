import React from 'react';

const HelpContent: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-12">
            {/* Getting Started */}
            <section className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-primary active-glow">Getting Started</h2>
                <div className="space-y-8">
                    <div className="space-y-3">
                        <p className="text-white/70 text-base leading-relaxed">
                            <span className="font-bold text-white">1. Load assets:</span> In the horizontal bar above the viewport, select a preset or click the media buttons to upload image/audio files.
                        </p>
                        <p className="text-white/70 text-base leading-relaxed">
                            <span className="font-bold text-white">2. Add effects:</span> To add visual effects, click the far-right “sliders” button above the viewport to open the sidebar. In the sidebar, click the “Effects” tab to browse effects. Click on an effect to add it to your video.
                        </p>
                        <p className="text-white/70 text-base leading-relaxed">
                            <span className="font-bold text-white">3. Adjust effects:</span> In the sidebar, click the “Pipe” tab to view your added effects.
                        </p>
                    </div>

                    <ul className="space-y-6 list-none">
                        <li className="relative pl-6 space-y-1 before:content-[''] before:absolute before:left-0 before:top-1.5 before:w-1.5 before:h-1.5 before:bg-primary before:rounded-full">
                            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">Reordering effects:</h3>
                            <p className="text-white/70 text-sm leading-relaxed">
                                Effects and effect groups can be reordered by dragging the drag icons to the left of the effects.
                            </p>
                        </li>

                        <li className="relative pl-6 space-y-1 before:content-[''] before:absolute before:left-0 before:top-1.5 before:w-1.5 before:h-1.5 before:bg-primary before:rounded-full">
                            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">Creating effect groups:</h3>
                            <p className="text-white/70 text-sm leading-relaxed">
                                To isolate groups of effects, click the triangle icons between the effects to meld them.
                            </p>
                        </li>

                        <li className="relative pl-6 space-y-1 before:content-[''] before:absolute before:left-0 before:top-1.5 before:w-1.5 before:h-1.5 before:bg-primary before:rounded-full">
                            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">Effect card buttons:</h3>
                            <p className="text-white/70 text-sm leading-relaxed">
                                In each effect card, toggle the egg icon to solo/unsolo an effect, and click the eye icon to show/hide an effect. Clicking the “X” icon removes the effect from the video. Clicking the effect name opens its parameters.
                            </p>
                        </li>

                        <li className="relative pl-6 space-y-1 before:content-[''] before:absolute before:left-0 before:top-1.5 before:w-1.5 before:h-1.5 before:bg-primary before:rounded-full">
                            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">Effect parameters:</h3>
                            <p className="text-white/70 text-sm leading-relaxed">
                                In the effect parameters view, parameter levels can be adjusted by moving the slider handles in each parameter card. Select a frequency band in the dropdown menu above a parameter slider to sync the parameter to a frequency band. When a frequency band is selected, the frequency band will animate the parameter level between the two slider handles. When “Manual” is selected, the parameter level will be fixed.
                            </p>
                        </li>
                    </ul>

                    <p className="text-white/70 text-base leading-relaxed">
                        <span className="font-bold text-white">4. Export video:</span> Click the Export button below the viewport to export your creation as an MP4 video synced to your audio.
                    </p>
                </div>
            </section>

            {/* Audio Controls */}
            <section className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-primary active-glow">Audio-Reactive Controls</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="glass-panel p-5 rounded-xl border border-white/10">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-white mb-2">Manual Mode</h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                            The parameter level stays at your chosen slider value.
                        </p>
                    </div>
                    <div className="glass-panel p-5 rounded-xl border border-white/10">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-white mb-2">Sync Mode (Audio-Driven)</h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                            The parameter level will fluctuate based on the selected frequency band (sub, bass, mid, or treble).
                        </p>
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
