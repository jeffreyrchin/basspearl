
import React, { useState, useEffect, useRef } from 'react';
import { GlitchState, EffectConfig, AppView } from '../types';
import { EFFECT_METADATA, PRESETS } from '../constants';
import { glitchEngine } from '../services/glitchEngine';
import { useAuth } from '../context/AuthContext';

import AuthModal from './AuthModal';
import ExportCreditsDisplay from './ExportCreditsDisplay';
import UserMenu from './UserMenu';
import ShareModal from './ShareModal';

interface EditorViewProps {
  state: GlitchState;
  onUpdateState: (newState: Partial<GlitchState>) => void;
  onNavigate: (view: AppView) => void;
}

const EditorView: React.FC<EditorViewProps> = ({ state, onUpdateState, onNavigate }) => {
  const { user } = useAuth();

  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'layers' | 'presets'>('layers');
  const [searchTerm, setSearchTerm] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showMobileEffects, setShowMobileEffects] = useState(false);

  // New State for Preview
  const [isPreviewing, setIsPreviewing] = useState(false);

  // History Navigation Ref
  const isNavigatingHistory = useRef(false);

  const handleEffectChange = async (index: number, updates: Partial<EffectConfig>) => {
    const newEffects = [...state.effects];
    newEffects[index] = { ...newEffects[index], ...updates };
    onUpdateState({ effects: newEffects });
  };

  const applyGlitches = async () => {
    if (!state.originalImage) return;
    setIsProcessing(true);
    try {
      const processed = await glitchEngine.processImage(state.originalImage, state.effects, !user);

      // History Logic
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({ image: processed, effects: state.effects });

      onUpdateState({
        processedImage: processed,
        history: newHistory,
        historyIndex: newHistory.length - 1
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = () => {
    if (!state.processedImage) return;
    setShareModalOpen(true);
  };

  const handleUndo = () => {
    if (state.historyIndex > 0) {
      isNavigatingHistory.current = true;
      const prevIndex = state.historyIndex - 1;
      const prevItem = state.history[prevIndex];
      onUpdateState({
        historyIndex: prevIndex,
        effects: prevItem.effects,
        processedImage: prevItem.image
      });
    }
  };

  const handleRedo = () => {
    if (state.historyIndex < state.history.length - 1) {
      isNavigatingHistory.current = true;
      const nextIndex = state.historyIndex + 1;
      const nextItem = state.history[nextIndex];
      onUpdateState({
        historyIndex: nextIndex,
        effects: nextItem.effects,
        processedImage: nextItem.image
      });
    }
  };

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleApplyPreset = (presetName: string) => {
    const newEffects = PRESETS[presetName];
    if (newEffects) {
      onUpdateState({ effects: newEffects });
      setActiveTab('layers'); // Switch back to layers to see effects
    }
  };

  useEffect(() => {
    if (isNavigatingHistory.current) {
      isNavigatingHistory.current = false;
      return;
    }
    const timer = setTimeout(() => {
      applyGlitches();
    }, 300);
    return () => clearTimeout(timer);
  }, [state.effects, user]);



  const renderEffectsList = () => (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
      {state.effects.map((effect, idx) => {
        const meta = EFFECT_METADATA[effect.type];
        const isActive = idx === state.currentEffectIndex;
        const matchesSearch = meta.label.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch && searchTerm !== '') return null;

        return (
          <div
            key={effect.type}
            className={`p-3 rounded-xl transition-all ${isActive ? 'bg-primary/10 border border-primary/20' : 'hover:bg-white/5 border border-transparent hover:border-white/5'}`}
          >
            <div
              onClick={() => onUpdateState({ currentEffectIndex: isActive ? -1 : idx })}
              className="flex items-center justify-between mb-2 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`size-8 rounded-lg flex items-center justify-center transition-colors ${isActive ? 'bg-primary text-white cyber-glow' : 'bg-white/5 text-white/60'}`}>
                  <span className="material-symbols-outlined text-[20px]">{meta.icon}</span>
                </div>
                <div>
                  <p className={`text-[11px] font-bold uppercase tracking-wider ${isActive ? 'text-primary active-glow' : 'text-white/80'}`}>{meta.label}</p>
                  <p className="text-[9px] text-white/40 font-medium">{meta.subLabel}</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEffectChange(idx, { active: !effect.active });
                }}
                className="material-symbols-outlined text-[16px] transition-colors"
                style={{ color: effect.active ? '#0d7ff2' : 'rgba(255,255,255,0.2)' }}
              >
                {effect.active ? 'check_circle' : 'circle'}
              </button>
            </div>

            {isActive && (
              <div className="space-y-4 px-1 pb-2 mt-4 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-white/60">
                    <span>INTENSITY</span>
                    <span>{effect.intensity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={effect.intensity}
                    onChange={(e) => handleEffectChange(idx, { intensity: parseInt(e.target.value) })}
                    className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-white/60">
                    <span>THRESHOLD</span>
                    <span>{effect.threshold}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={effect.threshold}
                    onChange={(e) => handleEffectChange(idx, { threshold: parseInt(e.target.value) })}
                    className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderPresetsList = () => (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
      {Object.entries(PRESETS).map(([name, config]) => (
        <button
          key={name}
          onClick={() => handleApplyPreset(name)}
          className="w-full p-4 rounded-xl border border-white/10 hover:border-primary/50 hover:bg-white/5 transition-all group text-left relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-primary/0 group-hover:from-primary/10 group-hover:to-transparent transition-all"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-widest text-white">{name.replace('_', ' ')}</span>
              <span className="material-symbols-outlined text-[16px] text-primary opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 -translate-x-2">arrow_forward</span>
            </div>
            <div className="text-[10px] text-white/40">
              {config.filter(e => e.active).length} Active Effects
            </div>
          </div>
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 flex h-screen w-full flex-col overflow-hidden bg-background-dark">
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-6 py-4 z-50 border-b border-white/5 bg-background-dark/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate(AppView.LANDING)}>
            <div className="size-7 md:size-8 text-primary active-glow">
              <span className="material-symbols-outlined text-[28px] md:text-[32px]">vibration</span>
            </div>
            <h2 className="text-lg md:text-xl font-bold tracking-tighter uppercase">Glitch<span className="text-primary">Brain</span></h2>
          </div>
          <div className="h-4 w-px bg-white/10 hidden md:block"></div>
          <nav className="hidden md:flex gap-6 text-sm font-medium tracking-wide text-white/50">
            <button
              className={`uppercase hover:text-primary transition-colors ${activeTab === 'layers' ? 'text-primary active-glow' : ''}`}
              onClick={() => setActiveTab('layers')}
            >
              Layers
            </button>
            <button
              className={`uppercase hover:text-primary transition-colors ${activeTab === 'presets' ? 'text-primary active-glow' : ''}`}
              onClick={() => setActiveTab('presets')}
            >
              Presets
            </button>
          </nav>
          {/* Mobile Effects Toggle */}
          <button
            onClick={() => setShowMobileEffects(!showMobileEffects)}
            className="lg:hidden flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            Effects
          </button>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={handleShare}
            className="bg-primary hover:bg-primary/80 text-white px-3 md:px-5 py-1.5 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-widest cyber-glow transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">ios_share</span>
            <span className="hidden sm:inline">Share</span>
          </button>
          <UserMenu
            onLoginClick={() => openAuthModal('login')}
            onSignupClick={() => openAuthModal('signup')}
          />
        </div>
      </header>

      {/* Main Content - Flex Layout */}
      <main className="flex flex-1 relative bg-background-dark grid-bg overflow-hidden faed-in">
        {/* Canvas Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden relative">
          {/* Floating Canvas Controls */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 glass-panel p-2 rounded-xl z-30">
            <button
              onClick={handleUndo}
              disabled={state.historyIndex <= 0}
              className={`p-2 transition-colors ${state.historyIndex <= 0 ? 'text-white/20 cursor-not-allowed' : 'text-white/60 hover:text-white'}`}
            >
              <span className="material-symbols-outlined text-[20px]">undo</span>
            </button>
            <button
              onClick={handleRedo}
              disabled={state.historyIndex >= state.history.length - 1}
              className={`p-2 transition-colors ${state.historyIndex >= state.history.length - 1 ? 'text-white/20 cursor-not-allowed' : 'text-white/60 hover:text-white'}`}
            >
              <span className="material-symbols-outlined text-[20px]">redo</span>
            </button>
            <div className="w-px h-4 bg-white/10 mx-1"></div>
            <button
              onMouseDown={() => setIsPreviewing(true)}
              onMouseUp={() => setIsPreviewing(false)}
              onMouseLeave={() => setIsPreviewing(false)}
              className={`flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-lg text-white text-[10px] font-bold uppercase tracking-[0.15em] cyber-glow transition-all ${isPreviewing ? 'bg-white text-black' : 'bg-primary text-white'}`}
            >
              <span className="material-symbols-outlined text-[16px]">compare</span>
              <span className="hidden sm:inline">{isPreviewing ? 'Original' : 'Preview'}</span>
            </button>
          </div>

          {/* Image Canvas Container */}
          <div className="relative w-full max-w-5xl aspect-video rounded-lg shadow-2xl overflow-hidden group border border-white/5 bg-black/20">
            {(state.processedImage || state.originalImage) && (
              <img
                src={isPreviewing && state.originalImage ? state.originalImage : state.processedImage || ''}
                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${isProcessing && !isPreviewing ? 'opacity-50' : 'opacity-100'}`}
                alt="Canvas"
              />
            )}

            <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay bg-gradient-to-t from-primary/20 to-transparent"></div>



            {isProcessing && !isPreviewing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                <div className="flex flex-col items-center gap-2">
                  <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[10px] font-mono text-primary animate-pulse uppercase tracking-[0.2em]">Processing...</span>
                </div>
              </div>
            )}
          </div>

          <div className="w-full max-w-5xl mt-4 flex flex-col gap-2 items-start text-[10px] text-white/40 font-mono">
            <div className="flex gap-4">
              <span>ACTIVE: {state.effects.filter(e => e.active).length}</span>
              <span className="hidden sm:inline">ENGINE: GLITCH_V4</span>
              {isPreviewing && <span className="text-primary font-bold">PREVIEWING ORIGINAL</span>}
            </div>
            {!user && (
              <div className="flex items-center gap-2 text-white/60 bg-white/5 border border-white/10 px-3 py-2 rounded-lg">
                <span className="material-symbols-outlined text-[14px] text-primary">info</span>
                <span>Watermark active on previews & downloads. <button onClick={() => openAuthModal('login')} className="text-primary font-bold hover:underline cursor-pointer">Sign in</button> to remove.</span>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Sidebar - Fixed Width, Scrollable */}
        <aside className="w-80 shrink-0 glass-panel flex flex-col border-l border-white/10 shadow-2xl h-full hidden lg:flex">
          {/* Tab Header for Mobile/Search */}
          <div className="p-5 border-b border-white/5 shrink-0">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab('layers')}
                className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'layers' ? 'bg-primary text-white' : 'bg-white/5 text-white/40 hover:text-white'}`}
              >
                Layers
              </button>
              <button
                onClick={() => setActiveTab('presets')}
                className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'presets' ? 'bg-primary text-white' : 'bg-white/5 text-white/40 hover:text-white'}`}
              >
                Presets
              </button>
            </div>

            {activeTab === 'layers' && (
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-white/40 text-[20px]">search</span>
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border-none rounded-lg pl-10 pr-4 py-2 text-[10px] font-bold tracking-widest focus:ring-1 focus:ring-primary transition-all uppercase placeholder:text-white/20"
                  placeholder="SEARCH EFFECTS..."
                  type="text"
                />
              </div>
            )}
          </div>

          {activeTab === 'layers' ? renderEffectsList() : renderPresetsList()}

          {/* Bottom Actions */}
          <div className="p-4 border-t border-white/5 flex items-center justify-between shrink-0">
            <div className="flex gap-2">
              <button
                onClick={handleUndo}
                disabled={state.historyIndex <= 0}
                className={`p-2 rounded-lg bg-white/5 transition-colors ${state.historyIndex <= 0 ? 'text-white/20 cursor-not-allowed' : 'text-white hover:text-primary'}`}
              >
                <span className="material-symbols-outlined text-[20px]">undo</span>
              </button>
              <button
                onClick={handleRedo}
                disabled={state.historyIndex >= state.history.length - 1}
                className={`p-2 rounded-lg bg-white/5 transition-colors ${state.historyIndex >= state.history.length - 1 ? 'text-white/20 cursor-not-allowed' : 'text-white hover:text-primary'}`}
              >
                <span className="material-symbols-outlined text-[20px]">redo</span>
              </button>
            </div>

            <a href="#" className="flex items-center gap-2 text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-widest transition-colors">
              Help
              <span className="material-symbols-outlined text-[16px]">help</span>
            </a>
          </div>
        </aside>

        {/* Mobile Effects Panel */}
        {showMobileEffects && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setShowMobileEffects(false)}
            />
            <div className="absolute inset-x-0 bottom-0 glass-panel rounded-t-3xl border-t border-white/10 max-h-[80vh] flex flex-col animate-in slide-in-from-bottom duration-300">
              {/* Handle */}
              <div className="flex justify-center p-2">
                <div className="w-12 h-1 bg-white/20 rounded-full"></div>
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveTab('layers')}
                    className={`text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'layers' ? 'text-primary' : 'text-white/40'}`}
                  >
                    Layers
                  </button>
                  <button
                    onClick={() => setActiveTab('presets')}
                    className={`text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'presets' ? 'text-primary' : 'text-white/40'}`}
                  >
                    Presets
                  </button>
                </div>
                <button onClick={() => setShowMobileEffects(false)} className="p-1">
                  <span className="material-symbols-outlined text-white/60">close</span>
                </button>
              </div>

              {activeTab === 'layers' && (
                <div className="p-4 border-b border-white/5 shrink-0">
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-white/40 text-[20px]">search</span>
                    <input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white/5 border-none rounded-lg pl-10 pr-4 py-2 text-[10px] font-bold tracking-widest focus:ring-1 focus:ring-primary transition-all uppercase placeholder:text-white/20"
                      placeholder="SEARCH EFFECTS..."
                      type="text"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'layers' ? renderEffectsList() : renderPresetsList()}
            </div>
          </div>
        )}
      </main>

      {/* Footer Status Bar */}
      <footer className="h-6 bg-[#050510] border-t border-white/5 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4 text-[9px] font-bold tracking-widest text-white/30 uppercase">
          <div className="flex items-center gap-1.5">
            <span className={`size-1.5 rounded-full ${isProcessing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'} shadow-sm shadow-green-500/50`}></span>
            {isProcessing ? 'Processing' : 'Ready'}
          </div>
          <span className="hidden md:inline">Render Engine: v4.2.0</span>
          <ExportCreditsDisplay variant="inline" />
        </div>
        <div className="hidden md:flex items-center gap-6 text-[9px] font-mono text-white/30">
          <span>FPS: 60.0</span>
        </div>
      </footer>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        imageUrl={state.processedImage}
      />
    </div>
  );
};

export default EditorView;
