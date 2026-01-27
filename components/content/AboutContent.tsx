import React from 'react';

const AboutContent: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-12">
            {/* What is GlitchBrain */}
            <section className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-primary active-glow">What is GlitchBrain?</h2>
                <p className="text-white/70 text-base md:text-lg leading-relaxed">
                    GlitchBrain is a powerful web-based glitch art generator that transforms your images into stunning digital artifacts.
                    Harness the beauty of controlled chaos with our suite of professional-grade distortion effects - all running directly in your browser.
                </p>
                <p className="text-white/70 text-base md:text-lg leading-relaxed">
                    Whether you're a digital artist, designer, or creative enthusiast, GlitchBrain provides an intuitive interface
                    for exploring the aesthetic possibilities of data corruption, pixel manipulation, and chromatic aberration.
                </p>
            </section>

            {/* Features */}
            <section className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-primary active-glow">Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                        { title: '13+ Glitch Effects', desc: 'Pixel sorting, RGB shifting, datamoshing, and more' },
                        { title: 'Real-Time Preview', desc: 'See your changes instantly with our optimized rendering engine' },
                        { title: 'Full Resolution Export', desc: 'Download your creations in original quality' },
                        { title: 'Preset Library', desc: 'Quick-start templates for instant glitch aesthetics' },
                        { title: 'Layer System', desc: 'Stack and combine multiple effects for complex results' },
                        { title: 'Undo/Redo', desc: 'Experiment freely with history control' }
                    ].map(feature => (
                        <div key={feature.title} className="glass-panel p-5 rounded-xl border border-white/10 hover:border-primary/30 transition-all">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-2">{feature.title}</h3>
                            <p className="text-white/60 text-sm leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How It Works */}
            <section className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-primary active-glow">How It Works</h2>
                <div className="space-y-4">
                    <div className="glass-panel p-6 rounded-xl border border-white/10">
                        <div className="flex items-start gap-4">
                            <div className="size-10 shrink-0 rounded-lg bg-primary/20 flex items-center justify-center">
                                <span className="text-primary font-bold text-xl">1</span>
                            </div>
                            <div>
                                <h3 className="text-base font-bold uppercase tracking-wider text-white mb-1">Upload Your Image</h3>
                                <p className="text-white/60 text-sm leading-relaxed">
                                    Drag and drop any image file (PNG, JPG, TIFF) up to 50MB. Your image is processed entirely in your browser - nothing is uploaded to our servers.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-panel p-6 rounded-xl border border-white/10">
                        <div className="flex items-start gap-4">
                            <div className="size-10 shrink-0 rounded-lg bg-primary/20 flex items-center justify-center">
                                <span className="text-primary font-bold text-xl">2</span>
                            </div>
                            <div>
                                <h3 className="text-base font-bold uppercase tracking-wider text-white mb-1">Apply Effects</h3>
                                <p className="text-white/60 text-sm leading-relaxed">
                                    Choose from our extensive effect library or use presets. Adjust effect parameters for precise control.
                                    Our Web Worker-based engine ensures smooth, real-time processing even at full resolution.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-panel p-6 rounded-xl border border-white/10">
                        <div className="flex items-start gap-4">
                            <div className="size-10 shrink-0 rounded-lg bg-primary/20 flex items-center justify-center">
                                <span className="text-primary font-bold text-xl">3</span>
                            </div>
                            <div>
                                <h3 className="text-base font-bold uppercase tracking-wider text-white mb-1">Export & Share</h3>
                                <p className="text-white/60 text-sm leading-relaxed">
                                    Download your glitched masterpiece in PNG format. Signed-in users can export without watermarks and share directly to social media.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tech Stack */}
            <section className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-primary active-glow">Technology</h2>
                <p className="text-white/70 text-base md:text-lg leading-relaxed">
                    Built with modern web technologies including React, TypeScript, and Web Workers for maximum performance.
                    To ensure your privacy, all image processing happens client-side using the Canvas API.
                </p>
            </section>
        </div>
    );
};

export default AboutContent;
