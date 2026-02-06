
import React, { useState, useEffect, useRef } from 'react';
import { AppView } from '../types';
import Navbar from './Navbar';
import AuthModal from './AuthModal';
import { useAuth } from '../context/AuthContext';
import { useUploadQuota } from '../hooks/useUploadQuota';
import { trackEvent } from '../services/analytics';

interface LandingPageProps {
  onFileUpload: (file: File) => void;
  onNavigate: (view: AppView) => void;
  onOpenLegal: (force: boolean, callback?: () => void) => void;
  hasAcceptedTerms: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ onFileUpload, onNavigate, onOpenLegal, hasAcceptedTerms }) => {
  const { user } = useAuth();
  const { canUpload, incrementUploads } = useUploadQuota();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Refined Drag State
  const [activeDropZone, setActiveDropZone] = useState<'image' | 'audio' | null>(null);

  // Carousel state
  const [marqueeKey, setMarqueeKey] = useState(0);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastWidthRef = useRef<number>(typeof window !== 'undefined' ? window.innerWidth : 0);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  // We need a ref to track which type of file input we opened (since we reuse one or need distinct ones)
  // Actually, cleanest is to just use one input but know what we expect, or just check file type after selection.
  // For the button click 'Upload Photo', we expect photo.
  const expectedInputTypeRef = useRef<'image' | 'audio' | null>(null);

  // Handle window resize to prevent carousel glitches
  useEffect(() => {
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      if (currentWidth !== lastWidthRef.current) {
        if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
        resizeTimeoutRef.current = setTimeout(() => {
          setMarqueeKey(prev => prev + 1);
          lastWidthRef.current = currentWidth;
        }, 150);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
    };
  }, []);

  const handleStartCreating = () => {
    const uploadSection = document.getElementById('upload-section');
    if (uploadSection) {
      uploadSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleUploadClick = (type: 'image' | 'audio') => {
    expectedInputTypeRef.current = type;
    if (fileInputRef.current) {
      // Optional: set accept attribute based on type for better UX
      fileInputRef.current.accept = type === 'image' ? "image/*" : "audio/*";
      fileInputRef.current.click();
    }
  };

  const handleDragOver = (e: React.DragEvent, type: 'image' | 'audio') => {
    e.preventDefault();
    setActiveDropZone(type);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setActiveDropZone(null);
  };

  const processValidatedFile = (file: File, expectedType?: 'image' | 'audio') => {
    const isImage = file.type.startsWith('image/');
    const isAudio = file.type.startsWith('audio/');

    if (!isImage && !isAudio) {
      alert("Please upload an image or audio file.");
      return;
    }

    // Strict Validation
    if (expectedType === 'image' && !isImage) {
      alert("Please upload an image file here.");
      return;
    }
    if (expectedType === 'audio' && !isAudio) {
      alert("Please upload an audio file here.");
      return;
    }

    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_SIZE) {
      alert("File too large. Please upload a file under 50MB.");
      return;
    }

    if (!canUpload) {
      setShowLimitModal(true);
      return;
    }
    incrementUploads();
    trackEvent('media_upload', { file_size: file.size, file_type: file.type, media_type: file.type.split('/')[0] });
    onFileUpload(file);
  };

  const handleDrop = (e: React.DragEvent, expectedType: 'image' | 'audio') => {
    e.preventDefault();
    setActiveDropZone(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processValidatedFile(e.dataTransfer.files[0], expectedType);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Use the ref to check what we expected, or fallback to generic validation
      processValidatedFile(e.target.files[0], expectedInputTypeRef.current || undefined);
      e.target.value = '';
    }
    expectedInputTypeRef.current = null;
  };

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  // Section 1: Hero
  const HeroSection = () => (
    <section className="relative flex flex-col items-center text-center px-4 overflow-hidden pt-12 pb-12 md:pb-20">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="/hero.jpg"
          alt="Glitch World"
          className="w-full h-full object-cover scale-105 opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background-dark/30 via-background-dark/60 to-background-dark"></div>
      </div>

      <div className="relative z-10 max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-1000 flex flex-col items-center">
        <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold tracking-tighter uppercase mb-6 leading-[0.9] drop-shadow-2xl active-glow">
          Create Professional
          <br />
          <span className="text-primary">Glitch Art</span>
          <br />
          In Your Browser
        </h1>
        <p className="text-white/80 text-md md:text-lg font-medium uppercase tracking-[0.3em] max-w-2xl mx-auto drop-shadow-lg mb-4">
          Upload images or generate from audio
        </p>

        <div className="flex flex-col items-center w-full">
          <button
            onClick={handleStartCreating}
            className="group relative px-10 py-4 bg-black border-primary border-2 text-white font-bold text-base uppercase tracking-[0.3em] rounded-full overflow-hidden transition-all hover:scale-105 cyber-glow mb-6"
          >
            <span className="relative z-10 flex items-center gap-2">
              Start Creating <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
            </span>
            <div className="absolute inset-0 bg-white/30 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </button>

          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-[10px] md:text-xs font-bold uppercase tracking-widest text-white/50 px-4">
            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px] text-primary">check_circle</span> No Sign-up Required</span>
            <span className="hidden md:block w-1 h-1 rounded-full bg-white/20"></span>
            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px] text-primary">check_circle</span> Real-time Preview</span>
            <span className="hidden md:block w-1 h-1 rounded-full bg-white/20"></span>
            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px] text-primary">check_circle</span> Free</span>
          </div>
        </div>
      </div>
    </section>
  );

  // Section 2: Examples/Social Proof
  const ExamplesSection = () => (
    <section className="relative pt-12 pb-24 bg-background-dark overflow-hidden border-t border-white/5">
      <div className="text-center mb-10">
        <h2 className="text-xl md:text-2xl font-bold uppercase tracking-[0.3em] text-white/40">Made With GlitchBrain.io</h2>
      </div>

      <div className="w-full max-w-[100vw] overflow-hidden relative fade-mask-x">
        <style>{`
          @keyframes marquee {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-50%, 0, 0); }
          }
          .animate-marquee {
            animation: marquee 40s linear infinite;
          }
          .fade-mask-x {
             mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
            -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
          }
         `}</style>
        <div key={marqueeKey} className="flex animate-marquee w-max py-4 transform-gpu">
          {[
            { src: '/gallery/digital_chaos.png', label: 'Digital Chaos' },
            { src: '/gallery/pixel_dreams.png', label: 'Pixel Dreams' },
            { src: '/gallery/vector.png', label: 'Vector' },
            { src: '/gallery/rainbow_noise.png', label: 'Rainbow Noise' },
            { src: '/gallery/chromatic_shift.png', label: 'Chromatic Shift' },
            { src: '/gallery/digital_chaos.png', label: 'Digital Chaos' },
            { src: '/gallery/pixel_dreams.png', label: 'Pixel Dreams' },
            { src: '/gallery/vector.png', label: 'Vector' },
            { src: '/gallery/rainbow_noise.png', label: 'Rainbow Noise' },
            { src: '/gallery/chromatic_shift.png', label: 'Chromatic Shift' },
          ].map((item, i) => (
            <div key={i} className="relative w-[300px] aspect-square rounded-xl overflow-hidden border border-white/10 shrink-0 transform-gpu mr-6 bg-black">
              <img src={item.src} alt="Inspiration" className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  // Section 3: Upload
  const UploadSection = () => (
    <section id="upload-section" className="relative py-24 px-4 flex flex-col items-center justify-center grid-bg">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight mb-4">Choose Your Starting Point</h2>
          <p className="text-white/60 text-sm md:text-base font-medium uppercase tracking-widest">Select input method to begin glitching</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 max-w-4xl mx-auto">
          {/* Image Upload Card */}
          <div
            onClick={() => handleUploadClick('image')}
            onDragOver={(e) => handleDragOver(e, 'image')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'image')}
            className={`group glass-panel p-1 border-white/10 hover:border-primary/50 transition-all duration-300 rounded-3xl cursor-pointer relative overflow-hidden ${activeDropZone === 'image' ? 'scale-105 border-primary ring-2 ring-primary/20 bg-primary/5' : 'hover:-translate-y-2'}`}
          >
            <div className="bg-background-dark/50 backdrop-blur-xl rounded-[20px] p-8 md:p-12 h-full flex flex-col items-center text-center relative z-10">
              <div className={`size-20 rounded-2xl flex items-center justify-center mb-6 transition-transform ${activeDropZone === 'image' ? 'scale-110 bg-primary/20' : 'bg-gradient-to-br from-primary/20 to-transparent group-hover:scale-110'}`}>
                <span className="material-symbols-outlined text-4xl text-primary">{activeDropZone === 'image' ? 'download' : 'image'}</span>
              </div>
              <h3 className="text-2xl font-bold uppercase tracking-wide mb-2">Upload Image</h3>
              <p className="text-white/50 text-sm mb-8 leading-relaxed">Glitch your photos with pixel sorting, datamoshing, and more.</p>

              <div className={`mt-auto px-8 py-3 rounded-full border text-xs font-bold uppercase tracking-widest transition-all ${activeDropZone === 'image' ? 'bg-primary text-black border-primary' : 'bg-primary/10 border-primary/20 text-primary group-hover:bg-primary group-hover:text-black'}`}>
                {activeDropZone === 'image' ? 'Drop Image Here' : 'Upload Photo'}
              </div>
            </div>
            {/* Glow effect */}
            <div className={`absolute -inset-1 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 blur-xl transition-opacity ${activeDropZone === 'image' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></div>
          </div>

          {/* Audio Upload Card */}
          <div
            onClick={() => handleUploadClick('audio')}
            onDragOver={(e) => handleDragOver(e, 'audio')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'audio')}
            className={`group glass-panel p-1 border-white/10 hover:border-accent-blue/50 transition-all duration-300 rounded-3xl cursor-pointer relative overflow-hidden ${activeDropZone === 'audio' ? 'scale-105 border-accent-blue ring-2 ring-accent-blue/20 bg-accent-blue/5' : 'hover:-translate-y-2'}`}
          >
            <div className="bg-background-dark/50 backdrop-blur-xl rounded-[20px] p-8 md:p-12 h-full flex flex-col items-center text-center relative z-10">
              <div className={`size-20 rounded-2xl flex items-center justify-center mb-6 transition-transform ${activeDropZone === 'audio' ? 'scale-110 bg-accent-blue/20' : 'bg-gradient-to-br from-accent-blue/20 to-transparent group-hover:scale-110'}`}>
                <span className="material-symbols-outlined text-4xl text-accent-blue">{activeDropZone === 'audio' ? 'download' : 'graphic_eq'}</span>
              </div>
              <h3 className="text-2xl font-bold uppercase tracking-wide mb-2">Generate From Audio</h3>
              <p className="text-white/50 text-sm mb-8 leading-relaxed">Generate visuals based on audio characteristics.</p>

              <div className={`mt-auto px-8 py-3 rounded-full border text-xs font-bold uppercase tracking-widest transition-all ${activeDropZone === 'audio' ? 'bg-accent-blue text-black border-accent-blue' : 'bg-accent-blue/10 border-accent-blue/20 text-accent-blue group-hover:bg-accent-blue group-hover:text-black'}`}>
                {activeDropZone === 'audio' ? 'Drop Audio Here' : 'Upload Audio'}
              </div>
            </div>
            {/* Glow effect */}
            <div className={`absolute -inset-1 bg-gradient-to-r from-accent-blue/0 via-accent-blue/10 to-accent-blue/0 blur-xl transition-opacity ${activeDropZone === 'audio' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-white text-[13px] uppercase tracking-widest">
            By uploading, you agree to our <button onClick={(e) => { e.stopPropagation(); onOpenLegal(false); }} className="underline hover:text-white transition-colors">Privacy Policy</button> and <button onClick={(e) => { e.stopPropagation(); onOpenLegal(false); }} className="underline hover:text-white transition-colors">Terms of Service</button>.
          </p>
        </div>

        <input
          type="file"
          className="hidden"
          accept="image/*,audio/*"
          onChange={handleFileChange}
          ref={fileInputRef}
        />
      </div>
    </section>
  );

  // Section 4: How It Works
  const HowItWorksSection = () => (
    <section className="relative py-24 px-4 bg-background-dark/50 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight mb-4">How It Works</h2>
          <div className="w-16 h-1 bg-primary mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-[48px] left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent z-0"></div>

          {[
            { step: '01', title: 'Upload', desc: 'Drag & drop any image or audio file directly into your browser.', icon: 'upload_file' },
            { step: '02', title: 'Glitch', desc: 'Experiment with pixel sorting, datamoshing, and other artifacts.', icon: 'tune' },
            { step: '03', title: 'Export', desc: 'Download your high-resolution artwork instantly.', icon: 'download' }
          ].map((item, idx) => (
            <div key={idx} className="relative z-10 flex flex-col items-center text-center group">
              <div className="size-24 rounded-full bg-background-dark border border-white/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover:border-primary/50 group-hover:shadow-[0_0_30px_rgba(251,0,255,0.2)] transition-all duration-300">
                <span className="material-symbols-outlined text-4xl text-white group-hover:text-primary transition-colors">{item.icon}</span>
              </div>
              <span className="text-primary font-bold text-sm tracking-widest mb-2 opacity-50">STEP {item.step}</span>
              <h3 className="text-2xl font-bold uppercase tracking-wide mb-3">{item.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed max-w-xs">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  return (
    <div className="relative min-h-screen flex flex-col bg-background-dark font-display text-white overflow-x-hidden">
      <Navbar
        onLoginClick={() => openAuthModal('login')}
        onSignupClick={() => openAuthModal('signup')}
      />

      {HeroSection()}
      {ExamplesSection()}
      {UploadSection()}
      {HowItWorksSection()}

      <footer className="py-4 md:h-8 bg-[#050510] border-t border-white/5 px-4 md:px-6 flex flex-row items-center justify-between gap-4 z-50">
        <span className="text-[11px] font-bold tracking-widest text-white/70 uppercase">© 2026 GlitchBrain<span className="lowercase">.io</span></span>
        <div className="flex items-center gap-6 text-[11px] font-bold tracking-widest text-white/70 uppercase">
          <button onClick={() => onOpenLegal(false)} className="hover:text-white transition-colors uppercase">Privacy & Terms</button>
        </div>
      </footer>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        onOpenLegal={onOpenLegal}
      />

      {/* Upload Limit Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setShowLimitModal(false)}
          />
          <div className="relative w-full max-w-sm glass-panel rounded-2xl border border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-300 p-8 text-center">
            <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-primary text-[32px]">cloud_off</span>
            </div>
            <h3 className="text-xl font-bold uppercase tracking-tight mb-2">Daily Upload Limit Reached</h3>
            <p className="text-white/40 text-sm mb-6">
              You've reached your daily limit of 20 uploads. Sign in for unlimited glitching!
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowLimitModal(false);
                  openAuthModal('signup');
                }}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary/80 text-white font-bold text-sm uppercase tracking-widest cyber-glow transition-all"
              >
                Sign In for Unlimited
              </button>
              <button
                onClick={() => setShowLimitModal(false)}
                className="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 text-white/60 font-bold text-sm uppercase tracking-widest transition-all"
              >
                Maybe Tomorrow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
