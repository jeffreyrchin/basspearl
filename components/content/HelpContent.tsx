import React from 'react';

const HelpContent: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-12">
            {/* Getting Started */}
            <section className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-primary active-glow">Getting Started</h2>
                <div className="space-y-3">
                    <p className="text-white/70 text-base leading-relaxed">
                        <span className="font-bold text-white">1. Load your assets:</span> Choose a preset for an instant setup, or upload your own image and audio files.
                    </p>
                    <p className="text-white/70 text-base leading-relaxed">
                        <span className="font-bold text-white">2. Enable effects:</span> Browse visual effects in the sidebar. Click on a power icon to activate an effect. Effect controls can be opened by clicking on the effect.
                    </p>
                    <p className="text-white/70 text-base leading-relaxed">
                        <span className="font-bold text-white">3. Adjust parameters:</span> Adjust parameter sliders to control effect levels. For each parameter, toggle “Sync” mode to sync the parameter level to the selected frequency at the bottom of the parameter controls. In “Sync” mode, the parameter will fluctuate between 0 and the set parameter level. Toggle “Manual” mode to apply a fixed parameter level for the effect.
                    </p>
                    <p className="text-white/70 text-base leading-relaxed">
                        <span className="font-bold text-white">4. Export video:</span> Click the "Export Video" button below the viewport to export your creation as an MP4 video synced to your audio.
                    </p>
                </div>
            </section>

            {/* Audio Controls */}
            <section className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-primary active-glow">Audio-Reactive Controls</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="glass-panel p-5 rounded-xl border border-white/10">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2">Manual Mode</h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                            The parameter stays at your chosen value, providing a consistent visual look regardless of the audio levels.
                        </p>
                    </div>
                    <div className="glass-panel p-5 rounded-xl border border-white/10">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2">Sync Mode (Audio-Driven)</h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                            The parameter value fluctuates based on the audio frequency data (sub, bass, mids, or treble) for a particular frame.
                        </p>
                    </div>
                </div>
            </section>

            {/* Effect Descriptions */}
            <section className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-primary active-glow">Some Effect Descriptions</h2>
                <div className="space-y-4">
                    {[
                        { name: 'Pixel Sort', desc: 'Streaks pixels based on the set brightness threshold.' },
                        { name: 'RGB Shift', desc: 'Separates color channels vertically and horizontally.' },
                        { name: 'Wave Distortion', desc: 'Applies orthogonal sine-wave displacement. In Sync mode, higher audio energy increases the frequency and amplitude of the waves.' },
                        { name: 'Scan Lines', desc: 'Applies horizontal rows of pixels to emulate the look of CRT monitors. Spacing between rows can be adjusted or synced to an audio frequency range.' },
                        { name: 'Color Bleed', desc: 'Smears and bleeds colors across the image. This effect can be used to apply a glow that reacts to your audio.' },
                        { name: 'Acid Trip', desc: 'Rotates color hues across the spectrum for psychedelic color shifts.' },
                        { name: 'Starfield', desc: 'Adds a particle system that can accelerate outward to the frequencies of the audio.' }
                    ].map(effect => (
                        <div key={effect.name} className="glass-panel p-4 rounded-xl border border-white/10">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-1.5">{effect.name}</h3>
                            <p className="text-white/60 text-sm leading-relaxed">{effect.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Export & Share */}
            <section className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-primary active-glow">Exporting Video</h2>
                <div className="space-y-3">
                    <p className="text-white/70 text-base leading-relaxed">
                        When you're ready, click the <span className="font-bold text-white">Export Video</span> button. The engine uses hardware-accelerated encoding to generate an MP4 file.
                    </p>

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
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-2">What file formats are supported?</h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                            Images: PNG, JPG, WebP. Audio: MP3, WAV, OGG. Export: MP4 (H.264).
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HelpContent;
