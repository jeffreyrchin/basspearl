import React from 'react';

const HelpContent: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-12">
            {/* Getting Started */}
            <section className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-primary active-glow">Getting Started</h2>
                <div className="space-y-3">
                    <p className="text-white/70 text-base leading-relaxed">
                        <span className="font-bold text-white">1. Upload an Image:</span> Click the upload zone or drag and drop an image or audio file up to 50MB.
                    </p>
                    <p className="text-white/70 text-base leading-relaxed">
                        <span className="font-bold text-white">2. Select Effects:</span> Browse the Effects panel and enable/disable individual effects by clicking on the individual power icons.
                    </p>
                    <p className="text-white/70 text-base leading-relaxed">
                        <span className="font-bold text-white">3. Adjust Parameters:</span> Clicking on an effect will open its parameter controls. Adjust the sliders to find your perfect glitch aesthetic.
                    </p>
                    <p className="text-white/70 text-base leading-relaxed">
                        <span className="font-bold text-white">4. Export:</span> Click the Export button to download your creation. Sign in to remove watermarks.
                    </p>
                </div>
            </section>

            {/* Effect Descriptions */}
            <section className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-primary active-glow">Effect Descriptions</h2>
                <div className="space-y-4">
                    {[
                        { name: 'Pixel Sort', desc: 'Sorts pixels in vertical or horizontal lines based on brightness thresholds, creating signature glitch art streaks.' },
                        { name: 'RGB Shift', desc: 'Separates and offsets RGB color channels to create chromatic aberration and displacement effects.' },
                        { name: 'Datamosh', desc: 'Randomly corrupts pixel data to simulate digital file degradation and artifacts.' },
                        { name: 'Deep Fry', desc: 'Extreme saturation, contrast, and compression.' },
                        { name: 'Scan Lines', desc: 'Adds horizontal scanlines reminiscent of CRT monitors and VHS tapes.' },
                        { name: 'Bit Crush', desc: 'Reduces color bit depth for a pixelated, low-fi digital look.' },
                        { name: 'Wave Distortion', desc: 'Applies sine wave displacement for fluid, wavy distortions.' },
                        { name: 'Color Bleed', desc: 'Smears and bleeds colors across the image for analog video-style artifacts.' },
                        { name: 'Compression Hell', desc: 'Simulates aggressive JPEG compression with blocky artifacts and banding.' },
                        { name: 'Random Chaos', desc: 'Unpredictable visual noise and disruption for maximum entropy.' },
                        { name: 'Analog Noise', desc: 'Film grain and static noise overlays for a vintage analog feel.' },
                        { name: 'Acid Trip', desc: 'Rotates color hues across the spectrum for psychedelic color shifts.' },
                        { name: 'Spectral', desc: 'Creates ghosted inverted color trails and afterimages.' }
                    ].map(effect => (
                        <div key={effect.name} className="glass-panel p-4 rounded-xl border border-white/10">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-1.5">{effect.name}</h3>
                            <p className="text-white/60 text-sm leading-relaxed">{effect.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Tips & Tricks */}
            <section className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-primary active-glow">Tips & Tricks</h2>
                <div className="space-y-3">
                    <div className="glass-panel p-5 rounded-xl border border-white/10">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-2">Layering Effects</h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                            Combine multiple effects for complex results. Try Pixel Sort + RGB Shift for classic glitch art, or Deep Fry + Compression Hell for deep-fried memes.
                        </p>
                    </div>
                    <div className="glass-panel p-5 rounded-xl border border-white/10">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-2">Subtle vs. Extreme</h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                            Low intensity values (10-30) create subtle, artistic effects. High values (70-100) produce dramatic, abstract transformations.
                        </p>
                    </div>
                    <div className="glass-panel p-5 rounded-xl border border-white/10">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-2">Preview Original</h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                            Hold down the Preview button to temporarily view your original image for comparison.
                        </p>
                    </div>
                </div>
            </section>

            {/* Presets */}
            <section className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-primary active-glow">Using Presets</h2>
                <p className="text-white/70 text-base leading-relaxed">
                    Presets are pre-configured effect combinations that instantly apply a specific aesthetic. Switch to the Presets tab
                    to browse and apply various presets. Each preset can be further customized by adjusting individual effect parameters.
                </p>
            </section>

            {/* Export & Share */}
            <section className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-primary active-glow">Export & Share</h2>
                <div className="space-y-3">
                    <p className="text-white/70 text-base leading-relaxed">
                        Click the <span className="font-bold text-white">Export</span> button in the toolbar to open the share modal.
                        From there you can download your glitched image as a PNG file.
                    </p>
                    <p className="text-white/70 text-base leading-relaxed">
                        <span className="font-bold text-primary">Logged-out users:</span> Exports include a GlitchBrain watermark. Sign in for unlimited watermark-free exports.
                    </p>
                    <p className="text-white/70 text-base leading-relaxed">
                        <span className="font-bold text-primary">File size:</span> Original-size exports are full resolution PNG files, which may be large. Consider re-compressing for web use if needed.
                    </p>
                </div>
            </section>

            {/* FAQ */}
            <section className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-primary active-glow">Frequently Asked Questions</h2>
                <div className="space-y-3">
                    <div className="glass-panel p-5 rounded-xl border border-white/10">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-2">Is my image uploaded to a server?</h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                            No. All processing happens locally in your browser using Web Workers. Your images never leave your device.
                        </p>
                    </div>
                    <div className="glass-panel p-5 rounded-xl border border-white/10">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-2">What file formats are supported?</h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                            PNG, JPG, and TIFF files up to 50MB are supported for input. All exports are PNG format.
                        </p>
                    </div>
                    <div className="glass-panel p-5 rounded-xl border border-white/10">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-2">Can I undo changes?</h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                            Yes. Use the Undo/Redo buttons in the toolbar to step through your editing history.
                        </p>
                    </div>
                    <div className="glass-panel p-5 rounded-xl border border-white/10">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-2">Why is processing slow?</h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                            Large images (10MP+) may take longer to process. We maintain full resolution throughout editing for maximum quality.
                            The rendering indicator shows when processing is active.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HelpContent;
