
import React, { useState, useEffect } from 'react';
import { GlitchState, EffectConfig, AppView } from '../types';
import { EFFECT_METADATA } from '../constants';
import { glitchEngine } from '../services/glitchEngine';

interface EditorViewProps {
  state: GlitchState;
  onUpdateState: (newState: Partial<GlitchState>) => void;
  onNavigate: (view: AppView) => void;
}

const EditorView: React.FC<EditorViewProps> = ({ state, onUpdateState, onNavigate }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'layers' | 'history' | 'assets'>('layers');
  const [searchTerm, setSearchTerm] = useState('');

  const handleEffectChange = async (index: number, updates: Partial<EffectConfig>) => {
    const newEffects = [...state.effects];
    newEffects[index] = { ...newEffects[index], ...updates };
    onUpdateState({ effects: newEffects });
  };

  const applyGlitches = async () => {
    if (!state.originalImage) return;
    setIsProcessing(true);
    try {
      const processed = await glitchEngine.processImage(state.originalImage, state.effects);
      onUpdateState({ processedImage: processed });
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      applyGlitches();
    }, 300);
    return () => clearTimeout(timer);
  }, [state.effects]);

  return (
    <div className="fixed inset-0 flex h-screen w-full flex-col overflow-hidden bg-background-dark z-[100]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 z-50 border-b border-white/5 bg-background-dark/80 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate(AppView.LANDING)}>
            <div className="size-8 text-primary active-glow">
              <span className="material-symbols-outlined text-[32px]">vibration</span>
            </div>
            <h2 className="text-xl font-bold tracking-tighter uppercase">Glitch<span className="text-primary">Brain</span></h2>
          </div>
          <div className="h-4 w-px bg-white/10 hidden md:block"></div>
          <nav className="hidden md:flex gap-6 text-sm font-medium tracking-wide text-white/50">
            <button className={`uppercase hover:text-primary transition-colors ${activeTab === 'layers' ? 'text-primary active-glow' : ''}`} onClick={() => setActiveTab('layers')}>Layers</button>
            <button className={`uppercase hover:text-primary transition-colors ${activeTab === 'history' ? 'text-primary active-glow' : ''}`} onClick={() => setActiveTab('history')}>History</button>
            <button className={`uppercase hover:text-primary transition-colors ${activeTab === 'assets' ? 'text-primary active-glow' : ''}`} onClick={() => setActiveTab('assets')}>Assets</button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest">
            <span className="material-symbols-outlined text-[18px]">settings</span>
            Config
          </button>
          <button
            onClick={() => {
              if (state.processedImage) {
                const link = document.createElement('a');
                link.href = state.processedImage;
                link.download = `glitchbrain-${Date.now()}.png`;
                link.click();
              }
            }}
            className="bg-primary hover:bg-primary/80 text-white px-5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest cyber-glow transition-all"
          >
            Export
          </button>
          <div className="size-9 rounded-full bg-cover bg-center border border-primary/40 p-0.5" style={{ backgroundImage: `url('https://picsum.photos/100')` }}>
            <div className="w-full h-full rounded-full bg-background-dark"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 relative bg-background-dark grid-bg overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 relative flex flex-col items-center justify-center p-8 overflow-hidden">
          {/* Floating Canvas Controls */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 glass-panel p-2 rounded-xl z-30">
            <button className="p-2 text-white/60 hover:text-white transition-colors"><span className="material-symbols-outlined">undo</span></button>
            <button className="p-2 text-white/60 hover:text-white transition-colors"><span className="material-symbols-outlined">redo</span></button>
            <div className="w-px h-4 bg-white/10 mx-1"></div>
            <button className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-primary text-white text-[10px] font-bold uppercase tracking-[0.15em] cyber-glow">
              <span className="material-symbols-outlined text-[16px]">compare</span>
              Preview
            </button>
            <div className="w-px h-4 bg-white/10 mx-1"></div>
            <button className="p-2 text-white/60 hover:text-white transition-colors"><span className="material-symbols-outlined">zoom_in</span></button>
            <div className="text-[10px] font-medium text-white/40 px-2 min-w-[40px]">FIT</div>
          </div>

          {/* Image Canvas Container */}
          <div className="relative w-full max-w-4xl aspect-video rounded-lg shadow-2xl overflow-hidden group border border-white/5 bg-black/20">
            {state.processedImage && (
              <img
                src={state.processedImage}
                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${isProcessing ? 'opacity-50' : 'opacity-100'}`}
                alt="Processed"
              />
            )}

            <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay bg-gradient-to-t from-primary/20 to-transparent"></div>

            <div className="absolute bottom-4 left-4 flex gap-4 text-[10px] text-white/40 font-mono">
              <span>ACTIVE LAYERS: {state.effects.filter(e => e.active).length}</span>
              <span>ENGINE: GLITCH_V4</span>
            </div>

            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                <div className="flex flex-col items-center gap-2">
                  <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[10px] font-mono text-primary animate-pulse uppercase tracking-[0.2em]">Processing...</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Shortcuts */}
          <div className="absolute bottom-8 flex gap-4 glass-panel p-2 rounded-full border-white/10">
            <button className="size-10 flex items-center justify-center rounded-full hover:bg-primary/20 hover:text-primary transition-all">
              <span className="material-symbols-outlined">pan_tool</span>
            </button>
            <button className="size-10 flex items-center justify-center rounded-full bg-primary/20 text-primary transition-all">
              <span className="material-symbols-outlined">near_me</span>
            </button>
            <button className="size-10 flex items-center justify-center rounded-full hover:bg-primary/20 hover:text-primary transition-all">
              <span className="material-symbols-outlined">crop</span>
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="absolute right-8 top-1/2 -translate-y-1/2 w-80 glass-panel rounded-2xl flex flex-col z-40 border-l border-white/10 shadow-2xl max-h-[85vh]">
          {/* Search */}
          <div className="p-5 border-b border-white/5">
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

          {/* Effects Stack */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
            {state.effects.map((effect, idx) => {
              const meta = EFFECT_METADATA[effect.type];
              const isActive = idx === state.currentEffectIndex;
              const matchesSearch = meta.label.toLowerCase().includes(searchTerm.toLowerCase());

              if (!matchesSearch && searchTerm !== '') return null;

              return (
                <div
                  key={effect.type}
                  onClick={() => onUpdateState({ currentEffectIndex: idx })}
                  className={`p-3 rounded-xl transition-all cursor-pointer ${isActive ? 'bg-primary/10 border border-primary/20' : 'hover:bg-white/5 border border-transparent hover:border-white/5'}`}
                >
                  <div className="flex items-center justify-between mb-2">
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

          {/* Bottom Actions */}
          <div className="p-4 border-t border-white/5 flex items-center justify-between">
            <div className="flex gap-2">
              <button className="p-2 rounded-lg bg-white/5 hover:text-primary transition-colors"><span className="material-symbols-outlined text-[20px]">history</span></button>
              <button className="p-2 rounded-lg bg-white/5 hover:text-primary transition-colors"><span className="material-symbols-outlined text-[20px]">auto_fix</span></button>
            </div>
            <button className="flex items-center gap-2 text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-widest transition-colors">
              Presets
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </button>
          </div>
        </aside>

        {/* HUD Minimap View */}
        <div className="absolute bottom-8 left-8 w-48 h-32 glass-panel rounded-xl overflow-hidden border border-white/5 group">
          <div className="absolute inset-0 opacity-40 mix-blend-screen bg-cover bg-center" style={{ backgroundImage: `url('https://picsum.photos/seed/glitch/300')` }}></div>
          <div className="absolute inset-0 flex flex-col justify-between p-2">
            <div className="flex justify-between items-start">
              <div className="text-[8px] font-mono text-primary active-glow uppercase">View-Port.01</div>
              <span className="material-symbols-outlined text-white/20 text-[14px]">grid_view</span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <button className="size-5 flex items-center justify-center rounded bg-white/5 hover:bg-primary/20 transition-colors"><span className="material-symbols-outlined text-[14px]">add</span></button>
              <button className="size-5 flex items-center justify-center rounded bg-white/5 hover:bg-primary/20 transition-colors"><span className="material-symbols-outlined text-[14px]">remove</span></button>
            </div>
          </div>
          <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border border-primary cyber-glow pointer-events-none"></div>
        </div>
      </main>

      {/* Footer Status Bar */}
      <footer className="h-6 bg-[#050510] border-t border-white/5 px-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-4 text-[9px] font-bold tracking-widest text-white/30 uppercase">
          <div className="flex items-center gap-1.5">
            <span className={`size-1.5 rounded-full ${isProcessing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'} shadow-sm shadow-green-500/50`}></span>
            {isProcessing ? 'Processing' : 'Ready'}
          </div>
          <span>Render Engine: v4.2.0-Glitch</span>
          <span>GPU: Accelerated</span>
        </div>
        <div className="flex items-center gap-6 text-[9px] font-mono text-white/30">
          <span>COORD: X=1042 Y=843</span>
          <span>FPS: 60.0</span>
        </div>
      </footer>
    </div>
  );
};

export default EditorView;
