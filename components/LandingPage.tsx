
import React, { useState } from 'react';
import { AppView } from '../types';
import UserMenu from './UserMenu';
import AuthModal from './AuthModal';
import ExportCreditsDisplay from './ExportCreditsDisplay';
import { useAuth } from '../context/AuthContext';

interface LandingPageProps {
  onFileUpload: (file: File) => void;
  onNavigate: (view: AppView) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onFileUpload, onNavigate }) => {
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
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
          <nav className="hidden md:flex gap-10 text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
            <button className="hover:text-primary transition-colors" onClick={() => onNavigate(AppView.GALLERY)}>Gallery</button>
            <button className="hover:text-primary transition-colors">About</button>
            <button className="hover:text-primary transition-colors">Docs</button>
          </nav>
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

          <div className="w-full flex items-center justify-between mt-24 mb-8">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-primary"></span>
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Featured Community Glitches</h4>
            </div>
            <div className="flex gap-2">
              <button className="size-8 rounded border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors">
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button className="size-8 rounded border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors">
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="w-full flex gap-6 overflow-x-auto custom-scrollbar pb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex-none w-[320px] group cursor-pointer">
                <div className="relative aspect-video rounded-xl overflow-hidden mb-3 border border-white/10">
                  <img src={`https://picsum.photos/seed/glitch${i}/400/225`} className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <div className="text-center">
                      <div className="text-[9px] font-bold uppercase tracking-widest mb-1 text-primary">View</div>
                      <div className="size-10 rounded border border-primary/20 bg-primary/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary">visibility</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-bold text-white/60 uppercase">NEO_TOKYO_0{i}.JPG</span>
                  <span className="text-[9px] font-mono text-white/30 uppercase">@CYBER_ARTIST</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="h-8 bg-[#050510] border-t border-white/5 px-6 flex items-center justify-between z-50">
        <div className="flex items-center gap-6 text-[9px] font-bold tracking-widest text-white/30 uppercase">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-primary/50 shadow-sm shadow-primary/50"></span>
            System: Online
          </div>
          <span>v4.2.0-Glitch Engine</span>
          <span className="text-primary/50">Global Artists: 12,482</span>
        </div>
        <div className="flex items-center gap-6 text-[9px] font-mono text-white/20">
          <span>LAT: 35.6895° N, LONG: 139.6917° E</span>
          <span>SECURED CONNECTION [AES-256]</span>
        </div>
      </footer>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
};

export default LandingPage;
