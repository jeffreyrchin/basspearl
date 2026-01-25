
import React, { useState } from 'react';
import { AppView } from '../types';
import UserMenu from './UserMenu';
import AuthModal from './AuthModal';
import ExportCreditsDisplay from './ExportCreditsDisplay';
import { useAuth } from '../context/AuthContext';
import { useUploadQuota } from '../hooks/useUploadQuota';
import { trackEvent } from '../services/analytics';

interface LandingPageProps {
  onFileUpload: (file: File) => void;
  onNavigate: (view: AppView) => void;
  onOpenLegal: (force: boolean, callback?: () => void) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onFileUpload, onNavigate, onOpenLegal }) => {
  const { user } = useAuth();
  const { canUpload, incrementUploads } = useUploadQuota();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // New State for DND and Consent
  const [isDragging, setIsDragging] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(() => {
    return !!localStorage.getItem('glitch_consent_v1');
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    if (hasAcceptedTerms) {
      fileInputRef.current?.click();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (hasAcceptedTerms) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processValidatedFile = (file: File) => {
    // 50MB Limit Check
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > MAX_SIZE) {
      alert("File too large. Please upload an image under 50MB.");
      return;
    }

    if (!canUpload) {
      setShowLimitModal(true);
      return;
    }
    incrementUploads();
    trackEvent('image_upload', { file_size: file.size, file_type: file.type });
    onFileUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (!hasAcceptedTerms) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processValidatedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processValidatedFile(e.target.files[0]);
      e.target.value = ''; // Reset input
    }
  };

  const handleToggleTerms = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setHasAcceptedTerms(checked);
    if (checked) {
      localStorage.setItem('glitch_consent_v1', 'true');
      trackEvent('terms_accepted');
    } else {
      localStorage.removeItem('glitch_consent_v1');
    }
  };

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-background-dark font-display text-white overflow-x-hidden">
      <header className="flex items-center justify-between px-4 md:px-8 py-4 md:py-6 z-50 border-b border-white/5 bg-background-dark/60 backdrop-blur-xl sticky top-0">
        <div className="flex items-center gap-4 md:gap-10">
          <div className="flex items-center gap-2 cursor-pointer group">

            <h1 className="text-2xl font-bold tracking-normal uppercase">Glitch<span className="text-primary">Brain</span></h1>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-6">
          {!user && (
            <ExportCreditsDisplay
              variant="badge"
              onLoginClick={() => openAuthModal('login')}
            />
          )}
          <UserMenu
            onLoginClick={() => openAuthModal('login')}
            onSignupClick={() => openAuthModal('signup')}
          />
        </div>
      </header>

      <main className="flex-1 relative flex flex-col items-center justify-center p-4 md:p-8 grid-bg">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="relative z-10 w-full max-w-4xl text-center flex flex-col items-center">
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter uppercase mb-8 md:mb-12 max-w-3xl leading-none">
            Create Glitch Art
            <br />
            <span className="text-primary active-glow italic">in seconds</span>
          </h2>

          <div
            onClick={handleUploadClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-full min-h-[400px] md:min-h-[500px] glass-panel rounded-2xl md:rounded-3xl upload-zone-glow flex flex-col items-center justify-center border-dashed border-2 transition-all group overflow-hidden relative ${hasAcceptedTerms ? 'border-primary/30 hover:border-primary/60 cursor-pointer' : 'border-white/5 cursor-default opacity-80'} ${isDragging ? 'bg-primary/10 border-primary scale-[1.02]' : ''}`}
          >
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              ref={fileInputRef}
            />

            <div className={`flex flex-col items-center transition-all pb-20 ${isDragging ? 'scale-110' : ''}`}>
              <div className={`size-16 md:size-20 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 transition-all ${hasAcceptedTerms ? 'bg-primary/10 text-primary group-hover:scale-110' : 'bg-white/5 text-white/20'}`}>
                <span className="material-symbols-outlined text-[32px] md:text-[48px]">{isDragging ? 'download' : 'upload_file'}</span>
              </div>
              <h3 className={`text-base md:text-lg font-bold uppercase tracking-widest mb-2 px-4 ${hasAcceptedTerms ? 'text-white' : 'text-white/20'}`}>
                Drop your media here
              </h3>
              <p className="text-white/40 text-[10px] md:text-sm font-medium mb-6 md:mb-8">PNG, JPG, TIFF (UP TO 50MB)</p>

              {hasAcceptedTerms ? (
                <div className="bg-accent-blue hover:bg-white text-black px-6 md:px-10 py-2.5 md:py-3 rounded-full text-[10px] md:text-xs font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all">
                  Upload Image
                </div>
              ) : (
                <div className="text-[14px] md:text-[16px] font-bold text-primary uppercase tracking-widest bg-transparent px-4 py-2 animate-pulse drop-shadow-[0_0_8px_rgba(13,127,242,0.8)]">
                  Accept Privacy & Terms to Upload
                </div>
              )}
            </div>

            {/* Localized Legal Checkbox */}
            <div
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/40 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/5 hover:border-white/10 transition-colors group/check"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                id="terms-check"
                checked={hasAcceptedTerms}
                onChange={handleToggleTerms}
                className="size-5 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/50 transition-all cursor-pointer"
              />
              <label
                htmlFor="terms-check"
                className="text-[10px] font-bold uppercase tracking-widest cursor-pointer whitespace-nowrap"
              >
                I agree to the <button onClick={() => onOpenLegal(false)} className="text-primary uppercase hover:underline underline-offset-4">Privacy & Terms</button>
              </label>
            </div>
          </div>

          <div className="w-full flex items-center justify-center mt-12 md:mt-24 mb-6 md:mb-8">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-primary"></span>
              <h4 className="text-[13px] font-bold uppercase tracking-[0.2em] text-white/70">Distortion Protocols</h4>
              <span className="h-px w-8 bg-primary"></span>
            </div>
          </div>

          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 pb-6">
            {[
              { title: 'Pixel Sorting', desc: 'Vertical scan data displacement', icon: 'sort' },
              { title: 'RGB Shifting', desc: 'Chromatic aberration artifacts', icon: 'layers' },
              { title: 'Data Moshing', desc: 'Delta compression distortion', icon: 'grid_4x4' },
              { title: 'CRT Simulation', desc: 'Synthetic cathode ray rendering', icon: 'reorder' }
            ].map(feature => (
              <div key={feature.title} className="glass-panel p-4 md:p-6 rounded-xl md:rounded-2xl border border-white/5 hover:border-primary/20 transition-all group text-left">
                <div className="size-8 md:size-10 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center mb-3 md:mb-4 group-hover:bg-primary/20 transition-colors">
                  <span className="material-symbols-outlined text-primary text-[20px] md:text-[24px]">{feature.icon}</span>
                </div>
                <h5 className="text-[12px] md:text-[14px] font-bold uppercase tracking-wider mb-1 text-white">{feature.title}</h5>
                <p className="text-[10px] md:text-[12px] text-white/60 font-medium uppercase tracking-wide leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="py-4 md:h-8 bg-[#050510] border-t border-white/5 px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 z-50">
        <div className="flex items-center gap-6 text-[10px] md:text-[11px] font-bold tracking-widest text-white/80 uppercase">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-primary/50 shadow-sm shadow-primary/50"></span>
            <span className="hidden sm:inline">System: Online</span>
          </div>
        </div>
        <span className="text-[11px] font-bold tracking-widest text-white/70 uppercase">© 2026 GlitchBrain</span>
        <div className="flex items-center gap-6 text-[11px] font-bold tracking-widest text-white/70 uppercase">
          <button onClick={() => onOpenLegal(false)} className="hover:text-white transition-colors uppercase">Privacy & Terms</button>
        </div>
      </footer>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
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
              You've reached your daily limit of 5 uploads. Sign in for unlimited glitching!
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
