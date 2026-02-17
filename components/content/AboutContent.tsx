import React from 'react';

const AboutContent: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-12">
            {/* What is GlitchBrain */}
            <section className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-primary active-glow">Audio-Reactive Graphics Engine</h2>
                <p className="text-white/70 text-base md:text-lg leading-relaxed">
                    GlitchBrain is a high-performance visual synthesizer that combines images and audio to create audio-reactive visualizers. Your creations can be exported as MP4 files to share or use in any of your creative projects.
                </p>
            </section>

            {/* Features */}
            <section className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-primary active-glow">Core Technology</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                        { title: 'Dynamic FFT Analysis', desc: 'Precomputed audio mapping for sub-frame accuracy across Bass, Mid, and Treble ranges.' },
                        { title: 'Hardware Acceleration', desc: 'Custom GLSL shaders running directly on your GPU for real-time previews.' },
                        { title: 'MP4 Video Export', desc: 'High-definition video rendering with hardware-encoded MP4 support.' },
                        { title: 'Dual-Mode Control', desc: 'Toggle between Manual mode for fixed effect levels or Sync mode for audio-reactive effects.' }
                    ].map(feature => (
                        <div key={feature.title} className="glass-panel p-5 rounded-xl border border-white/10 hover:border-primary/30 transition-all">
                            <h3 className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2">{feature.title}</h3>
                            <p className="text-white/60 text-sm leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How It Works */}
            <section className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-primary active-glow">The Process</h2>
                <div className="space-y-4">
                    <div className="glass-panel p-6 rounded-xl border border-white/10">
                        <div className="flex items-start gap-4">
                            <div className="size-10 shrink-0 rounded-lg bg-primary/20 flex items-center justify-center">
                                <span className="text-primary font-black text-xl">1</span>
                            </div>
                            <div>
                                <h3 className="text-base font-bold uppercase tracking-wider text-white mb-1">Load Assets</h3>
                                <p className="text-white/60 text-sm leading-relaxed">
                                    Upload your own image and audio files, or choose a preset located above the viewport. Audio is analyzed locally to create high-fidelity reactivity maps.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-panel p-6 rounded-xl border border-white/10">
                        <div className="flex items-start gap-4">
                            <div className="size-10 shrink-0 rounded-lg bg-primary/20 flex items-center justify-center">
                                <span className="text-primary font-black text-xl">2</span>
                            </div>
                            <div>
                                <h3 className="text-base font-bold uppercase tracking-wider text-white mb-1">Build your effects</h3>
                                <p className="text-white/60 text-sm leading-relaxed">
                                    Activate effects such as Pixel Sort, RGB Shift, and Wave Distortion. Click on an effect to open its controls.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-panel p-6 rounded-xl border border-white/10">
                        <div className="flex items-start gap-4">
                            <div className="size-10 shrink-0 rounded-lg bg-primary/20 flex items-center justify-center">
                                <span className="text-primary font-black text-xl">3</span>
                            </div>
                            <div>
                                <h3 className="text-base font-bold uppercase tracking-wider text-white mb-1">Export your video</h3>
                                <p className="text-white/60 text-sm leading-relaxed">
                                    Click the Export Video button below the viewport to download your creation as an MP4 video, ready for social media or live performance.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tech Stack */}
            <section className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-primary active-glow">Under the Hood</h2>
                <p className="text-white/70 text-base md:text-lg leading-relaxed">
                    GlitchBrain uses advanced Web Audio and WebGL 2.0 APIs to deliver workstation-grade performance in the browser.
                    By leveraging client-side processing, your creative data remains private and never leaves your machine.
                </p>
            </section>
        </div>
    );
};

export default AboutContent;
