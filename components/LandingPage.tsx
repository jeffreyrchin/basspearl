
import React, { useState } from 'react';
import { AppView } from '../types';
import UserMenu from './UserMenu';
import AuthModal from './AuthModal';
import ExportCreditsDisplay from './ExportCreditsDisplay';
import { useAuth } from '../context/AuthContext';
import { useUploadQuota } from '../hooks/useUploadQuota';

interface LandingPageProps {
  onFileUpload: (file: File) => void;
  onNavigate: (view: AppView) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onFileUpload, onNavigate }) => {
  const { user } = useAuth();
  const { canUpload, incrementUploads } = useUploadQuota();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (!canUpload) {
        setShowLimitModal(true);
        // Reset file input so user can try again after login
        e.target.value = '';
        return;
      }
      incrementUploads();
      onFileUpload(e.target.files[0]);
    }
  };

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-background-dark font-display text-white overflow-x-hidden">
      <header className="flex items-center justify-between px-8 py-6 z-50 border-b border-white/5 bg-background-dark/60 backdrop-blur-xl sticky top-0">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="size-8 text-primary active-glow group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[32px]">vibration</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tighter uppercase">Glitch<span className="text-primary">Brain</span></h1>
          </div>
        </div>
        <div className="flex items-center gap-6">
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

      <main className="flex-1 relative flex flex-col items-center justify-center p-8 grid-bg">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="relative z-10 w-full max-w-4xl text-center flex flex-col items-center">
          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase mb-12 max-w-3xl leading-none">
            Make Glitch Art
            <br />
            <span className="text-primary active-glow italic">in seconds</span>
          </h2>

          <label className="w-full aspect-[21/9] glass-panel rounded-3xl upload-zone-glow flex flex-col items-center justify-center border-dashed border-2 border-primary/30 hover:border-primary/60 transition-all group cursor-pointer overflow-hidden">
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            <div className="size-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-primary text-[48px]">upload_file</span>
            </div>
            <h3 className="text-lg font-bold uppercase tracking-widest mb-2">Drop your media here</h3>
            <p className="text-white/40 text-sm font-medium mb-8">PNG, JPG, TIFF (UP TO 50MB)</p>
            <div className="bg-accent-blue hover:bg-white text-black px-10 py-3 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all">
              Upload Image
            </div>
          </label>

          <div className="w-full flex items-center justify-center mt-24 mb-8">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-primary"></span>
              <h4 className="text-[13px] font-bold uppercase tracking-[0.2em] text-white/70">Distortion Protocols</h4>
              <span className="h-px w-8 bg-primary"></span>
            </div>
          </div>

          <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-6 pb-6">
            {[
              { title: 'Pixel Sorting', desc: 'Vertical scan data displacement', icon: 'sort' },
              { title: 'RGB Shifting', desc: 'Chromatic aberration artifacts', icon: 'layers' },
              { title: 'Data Moshing', desc: 'Delta compression distortion', icon: 'grid_4x4' },
              { title: 'CRT Simulation', desc: 'Synthetic cathode ray rendering', icon: 'reorder' }
            ].map(feature => (
              <div key={feature.title} className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-primary/20 transition-all group text-left">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <span className="material-symbols-outlined text-primary text-[24px]">{feature.icon}</span>
                </div>
                <h5 className="text-[14px] font-bold uppercase tracking-wider mb-1 text-white">{feature.title}</h5>
                <p className="text-[12px] text-white/60 font-medium uppercase tracking-wide">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="h-8 bg-[#050510] border-t border-white/5 px-6 flex items-center justify-between z-50">
        <div className="flex items-center gap-6 text-[11px] font-bold tracking-widest text-white/80 uppercase">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-primary/50 shadow-sm shadow-primary/50"></span>
            System: Online
          </div>
        </div>
        <div className="flex items-center gap-6 text-[11px] font-bold tracking-widest text-white/70 uppercase">
          <a href="#" className="hover:text-white transition-colors">Privacy & Terms</a>
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
