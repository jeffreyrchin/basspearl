import React, { useState } from 'react';
import { AuthProvider } from '../context/AuthContext';
import Navbar from './Navbar';
import AuthModal from './AuthModal';

const GalleryPage: React.FC = () => {
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

    const openAuthModal = (mode: 'login' | 'signup') => {
        setAuthMode(mode);
        setAuthModalOpen(true);
    };

    // Placeholder images - can be replaced with actual gallery content
    const placeholderArtworks = [
        { id: 1, title: 'Digital Chaos', artist: 'Anonymous', src: '/gallery/digital_chaos.png', alt: 'Digital Chaos' },
        { id: 2, title: 'Pixel Dreams', artist: 'Anonymous', src: '/gallery/pixel_dreams.png', alt: 'Pixel Dreams' },
        { id: 3, title: 'Chromatic Shift', artist: 'Anonymous', src: '/gallery/chromatic_shift.png', alt: 'Chromatic Shift' },
        { id: 4, title: 'Time Simulation', artist: 'Anonymous', src: '/gallery/time_simulation.png', alt: 'Time Simulation' },
        { id: 5, title: 'Vector', artist: 'Anonymous', src: '/gallery/vector.png', alt: 'Vector' },
        { id: 6, title: 'Rainbow Noise', artist: 'Anonymous', src: '/gallery/rainbow_noise.png', alt: 'Rainbow Noise' }
    ];

    // Lightbox State
    const [selectedArtwork, setSelectedArtwork] = useState<typeof placeholderArtworks[0] | null>(null);

    // Close on escape key
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSelectedArtwork(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Optimized Image Component with Skeleton Loading
    const GalleryImage = ({ src, alt, priority }: { src: string, alt: string, priority?: boolean }) => {
        const [isLoaded, setIsLoaded] = useState(false);

        return (
            <div className="relative group overflow-hidden w-full h-full bg-white/5">
                {/* Skeleton / Placeholder */}
                {!isLoaded && (
                    <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/5 via-white/10 to-white/5" />
                )}

                {/* The Real Image */}
                <img
                    src={src}
                    alt={alt}
                    loading={priority ? "eager" : "lazy"}
                    // @ts-ignore - fetchPriority is standard but missing in React types
                    fetchPriority={priority ? "high" : "auto"}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                    onLoad={() => setIsLoaded(true)}
                />

                {/* Hover Effects (Only active after load) */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${isLoaded ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'
                    }`} />
            </div>
        );
    };

    return (
        <AuthProvider>
            <div className="min-h-screen flex flex-col bg-background-dark text-white">
                <Navbar
                    onLoginClick={() => openAuthModal('login')}
                    onSignupClick={() => openAuthModal('signup')}
                />

                <main className="flex-1 relative grid-bg">
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

                    <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20">
                        {/* Hero Section */}
                        <div className="text-center mb-16 md:mb-20">
                            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold uppercase tracking-tighter mb-6 active-glow">
                                Community <span className="text-primary">Gallery</span>
                            </h1>
                            <p className="text-white/60 text-base md:text-lg max-w-2xl mx-auto">
                                Explore stunning glitch art creations from our community of digital artists
                            </p>
                        </div>

                        {/* Gallery Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-20">
                            {placeholderArtworks.map((artwork, index) => (
                                <div
                                    key={artwork.id}
                                    className="group glass-panel rounded-2xl border border-white/10 overflow-hidden hover:border-primary/30 transition-all cursor-pointer hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1"
                                    onClick={() => setSelectedArtwork(artwork)}
                                >
                                    {/* Placeholder Image Area */}
                                    <div className="aspect-square bg-gradient-to-br from-primary/20 via-background-dark to-accent-blue/20 relative overflow-hidden">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <GalleryImage
                                                src={artwork.src}
                                                alt={artwork.alt}
                                                priority={index < 3} // Prioritize first 3 images
                                            />
                                        </div>
                                    </div>

                                    {/* Artwork Info */}
                                    <div className="p-4">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-1">
                                            {artwork.title}
                                        </h3>
                                        <p className="text-xs text-white/60 uppercase tracking-wide">
                                            by {artwork.artist}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Call to Action */}
                        <div className="glass-panel rounded-3xl border border-primary/30 p-8 md:p-12 text-center space-y-8 cyber-glow">
                            <div className="space-y-6">
                                <div className="size-16 md:size-20 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto">
                                    <span className="material-symbols-outlined text-primary text-[40px] md:text-[48px]">send</span>
                                </div>
                                <h2 className="text-2xl md:text-4xl font-bold uppercase tracking-tight">
                                    Share Your Creation
                                </h2>
                                <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                                    Tag us on Instagram or X for a chance to be featured in our gallery.
                                    Showcase your unique glitch art style to the community!
                                </p>
                            </div>

                            {/* Social Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <a
                                    href="https://www.instagram.com/glitchbrain.io/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 px-8 py-4 bg-primary hover:bg-primary/80 text-white font-bold text-sm uppercase tracking-widest rounded-xl cyber-glow transition-all hover:scale-105 min-w-[200px] justify-center"
                                >
                                    Instagram
                                </a>
                                <a
                                    href="https://x.com/glitchbrain_io"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-sm uppercase tracking-widest rounded-xl transition-all hover:scale-105 min-w-[200px] justify-center"
                                >
                                    X
                                </a>
                            </div>

                            {/* Terms Card */}
                            <div className="bg-white/5 rounded-xl p-6 text-left border border-white/5 max-w-3xl mx-auto mt-8">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-white/90 mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
                                    <span className="material-symbols-outlined text-primary text-sm">assignment</span>
                                    Submission Guidelines
                                </h3>

                                <ul className="grid gap-3 text-xs text-white/60 leading-relaxed sm:grid-cols-2">
                                    <li className="flex gap-2 items-start">
                                        <span className="text-primary mt-[3px] text-[10px]">●</span>
                                        <span>You created the artwork using GlitchBrain.io, or you own all necessary rights to any source material used.</span>
                                    </li>
                                    <li className="flex gap-2 items-start">
                                        <span className="text-primary mt-[3px] text-[10px]">●</span>
                                        <span>Your submission does not contain illegal, sexually explicit, violent, copyrighted, hateful, or exploitative content.</span>
                                    </li>
                                    <li className="flex gap-2 items-start">
                                        <span className="text-primary mt-[3px] text-[10px]">●</span>
                                        <span>Your artwork does not depict anyone under the age of 18 without appropriate consent.</span>
                                    </li>
                                    <li className="flex gap-2 items-start">
                                        <span className="text-primary mt-[3px] text-[10px]">●</span>
                                        <span>If your artwork includes recognizable individuals, you have their permission to submit and share it.</span>
                                    </li>
                                    <li className="flex gap-2 items-start">
                                        <span className="text-primary mt-[3px] text-[10px]">●</span>
                                        <span>You grant GlitchBrain.io a non-exclusive, royalty-free license to share your work for promotional purposes.</span>
                                    </li>
                                    <li className="flex gap-2 items-start">
                                        <span className="text-primary mt-[3px] text-[10px]">●</span>
                                        <span>We may decline, remove, or stop featuring any submission at our discretion without notice or explanation.</span>
                                    </li>
                                    <li className="flex gap-2 items-start sm:col-span-2">
                                        <span className="text-primary mt-[3px] text-[10px]">●</span>
                                        <span>Tagging us does not guarantee that your artwork will be featured. You retain full copyright to your work.</span>
                                    </li>
                                </ul>

                                <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-white/40 uppercase tracking-widest text-center">
                                    By tagging us, you agree to these guidelines.
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                <footer className="py-4 md:h-8 bg-[#050510] border-t border-white/5 px-4 md:px-6 flex items-center justify-center">
                    <span className="text-[11px] font-bold tracking-widest text-white/70 uppercase">
                        © 2026 GlitchBrain<span className="lowercase">.io</span>
                    </span>
                </footer>

                <AuthModal
                    isOpen={authModalOpen}
                    onClose={() => setAuthModalOpen(false)}
                    initialMode={authMode}
                />
            </div>

            {/* Lightbox Modal */}
            {selectedArtwork && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop - Click anywhere to close */}
                    <div
                        className="absolute inset-0 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setSelectedArtwork(null)}
                    />

                    {/* Content Stack - Floating, Transparent */}
                    <div className="relative z-10 w-full max-w-5xl h-full max-h-[90vh] flex flex-col pointer-events-none">

                        {/* 1. Header (Floating Close Button) */}
                        <div className="flex justify-end pb-2 shrink-0 pointer-events-auto">
                            <button
                                onClick={() => setSelectedArtwork(null)}
                                className="text-white/80 hover:text-white p-2 rounded-full bg-black/50 backdrop-blur-md transition-all hover:bg-black/70"
                                title="Close"
                            >
                                <span className="material-symbols-outlined text-[24px]">close</span>
                            </button>
                        </div>

                        {/* 2. Image (Floating) */}
                        <div className="flex-1 min-h-0 flex items-center justify-center pointer-events-none">
                            <img
                                src={selectedArtwork.src}
                                alt={selectedArtwork.alt}
                                className="max-h-full max-w-full object-contain rounded-lg shadow-2xl border border-white/10 pointer-events-auto cursor-default"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>

                        {/* 3. Footer (Floating Caption) */}
                        <div className="mt-4 text-center shrink-0 pointer-events-auto">
                            <h3 className="text-xl font-bold uppercase tracking-widest text-white mb-1 drop-shadow-lg">
                                {selectedArtwork.title}
                            </h3>
                            <p className="text-sm text-white/60 uppercase tracking-wide drop-shadow-md">
                                by {selectedArtwork.artist}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </AuthProvider>
    );
};

export default GalleryPage;
