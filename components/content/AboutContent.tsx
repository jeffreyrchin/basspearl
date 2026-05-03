import React from 'react';

const AboutContent: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-12">
            {/* What is Muxels */}
            <section className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-primary active-glow">Audio-Reactive Effects Engine</h2>
                <p className="text-white/90 text-base md:text-lg leading-relaxed">
                    Muxels is a creative visual synthesizer that combines visual effects and audio to create audio-reactive visualizers. Your creations can be exported as MP4 files to share or use in any of your creative projects.
                </p>
            </section>

            {/* Features */}
            <section className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-primary active-glow">Core Technology</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                        { title: 'Dynamic Audio Analysis', desc: 'Advanced audio mapping for sub-frame accuracy across sub, bass, mid, and treble ranges.' },
                        { title: 'Hardware Acceleration', desc: 'Custom effect modules running directly on your GPU for real-time previews.' },
                        { title: 'MP4 Video Export', desc: 'High-definition video rendering with hardware-encoded MP4 support.' },
                        { title: 'Audio Reactivity', desc: 'Any parameter can be mapped to an audio frequency. Manually adjust effect levels or let the audio drive the effects.' }
                    ].map(feature => (
                        <div key={feature.title} className="glass-panel p-5 rounded-xl border border-white/10 hover:border-primary/30 transition-all">
                            <h3 className="text-[11px] font-bold uppercase tracking-widest text-white mb-2">{feature.title}</h3>
                            <p className="text-white/60 text-sm leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default AboutContent;
