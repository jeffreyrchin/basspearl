import React, { useState, useEffect, useRef } from 'react';
import { GlitchState, EffectConfig, AppView } from '../types';
import { EFFECT_METADATA, PRESETS } from '../constants';
import { useAuth } from '../context/AuthContext';

import AuthModal from './AuthModal';
import ExportCreditsDisplay from './ExportCreditsDisplay';
import UserMenu from './UserMenu';
import ShareModal from './ShareModal';
import InfoModal from './InfoModal';
import { trackEvent } from '../services/analytics';

interface EditorViewProps {
  state: GlitchState;
  onUpdateState: (newState: Partial<GlitchState>) => void;
  onNavigate: (view: AppView) => void;
  onOpenLegal: (force: boolean) => void;
}

const EditorView: React.FC<EditorViewProps> = ({ state, onUpdateState, onNavigate, onOpenLegal }) => {
  const { user } = useAuth();

  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'layers' | 'presets'>('layers');
  const [searchTerm, setSearchTerm] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showMobileEffects, setShowMobileEffects] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoModalType, setInfoModalType] = useState<'help' | 'about'>('help');

  const isDraggingRef = useRef(false);
  const isDraggingFromHandleRef = useRef(false);
  const startYRef = useRef(0);
  const currentDragYRef = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync refs for the processing loop & stale closures
  const stateRef = useRef(state);
  const userRef = useRef(user);

  useEffect(() => {
    stateRef.current = state;
    userRef.current = user;
  }, [state, user]);

  useEffect(() => {
    // Force a re-process to update the main-thread watermark visibility
    if (state.originalImage) {
      applyGlitches(false);
    }
  }, [user]);

  // Worker Reference
  const workerRef = useRef<Worker | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize Worker
  useEffect(() => {
    try {
      const worker = new Worker(new URL('../services/glitchWorker.ts', import.meta.url), { type: 'module' });
      workerRef.current = worker;

      worker.onmessage = (e) => {
        const { success, imageBitmap, error } = e.data;
        if (success && imageBitmap && previewCanvasRef.current) {
          const canvas = previewCanvasRef.current;
          if (canvas.width !== imageBitmap.width || canvas.height !== imageBitmap.height) {
            canvas.width = imageBitmap.width;
            canvas.height = imageBitmap.height;
          }

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(imageBitmap, 0, 0);

            // Simple main-thread watermark using userRef to avoid stale closures
            if (!userRef.current) {
              const width = canvas.width;
              const height = canvas.height;
              const fontSize = Math.max(24, Math.floor(width * 0.04));

              ctx.save();
              ctx.font = `800 ${fontSize}px "Genos", sans-serif`;
              ctx.textAlign = 'right';
              ctx.textBaseline = 'bottom';
              ctx.lineJoin = 'round';

              const padding = Math.floor(fontSize * 0.5);
              const brainWidth = ctx.measureText('BRAIN').width;
              const ioWidth = ctx.measureText('.io').width;
              const xR = width - padding;
              const y = height - padding;

              ctx.lineWidth = fontSize * 0.15;
              ctx.strokeStyle = '#000000';
              ctx.strokeText('.io', xR, y);
              ctx.strokeText('BRAIN', xR - ioWidth, y);
              ctx.strokeText('GLITCH', xR - ioWidth - brainWidth, y);

              ctx.fillStyle = '#ffffff';
              ctx.fillText('.io', xR, y);
              ctx.fillStyle = '#fb00ff';
              ctx.fillText('BRAIN', xR - ioWidth, y);
              ctx.fillStyle = '#ffffff';
              ctx.fillText('GLITCH', xR - ioWidth - brainWidth, y);
              ctx.restore();
            }

            // Clear any existing timeout
            if (renderingTimeoutRef.current) clearTimeout(renderingTimeoutRef.current);

            isProcessingRef.current = false;

            if (!pendingStateRef.current) {
              renderingTimeoutRef.current = setTimeout(() => {
                setIsProcessing(false);
              }, 200);
            }
          }

          processPending();
        } else if (error) {
          console.error('Worker Error:', error);
          if (renderingTimeoutRef.current) clearTimeout(renderingTimeoutRef.current);
          renderingTimeoutRef.current = setTimeout(() => {
            setIsProcessing(false);
          }, 200);
          isProcessingRef.current = false;
        }
      };

      return () => {
        worker.terminate();
      };
    } catch (err) {
      console.error("Failed to initialize worker", err);
    }
  }, []);

  // Initial render process
  useEffect(() => {
    if (state.originalImage) {
      applyGlitches(true);
    }
  }, []);
  const lastProcessTimeRef = useRef(0);
  const throttleFrameRef = useRef<number | null>(null);

  // Hysteresis ref for rendering indicator to prevent flicker
  const renderingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleEffectChange = async (index: number, updates: Partial<EffectConfig>, shouldThrottle: boolean = true) => {
    const newEffects = [...state.effects];
    const seed = newEffects[index].seed ?? Math.floor(Math.random() * 1000000);
    newEffects[index] = { ...newEffects[index], ...updates, seed };

    if (updates.active !== undefined) {
      trackEvent('effect_applied', { effect_type: newEffects[index].type, action: updates.active ? 'on' : 'off' });
    }

    onUpdateState({ effects: newEffects });

    if (throttleFrameRef.current !== null) {
      cancelAnimationFrame(throttleFrameRef.current);
    }

    throttleFrameRef.current = requestAnimationFrame(() => {
      const now = performance.now();
      const timeSinceLastProcess = now - lastProcessTimeRef.current;

      if (timeSinceLastProcess >= 32) {
        lastProcessTimeRef.current = now;
        applyGlitches(false, newEffects);
      } else {
        throttleFrameRef.current = requestAnimationFrame(() => {
          applyGlitches(false, newEffects);
        });
      }
    });
  };

  // Processing Loop Logic
  const isProcessingRef = useRef(false);
  const pendingStateRef = useRef<{ effects: EffectConfig[] } | null>(null);

  const processPending = async () => {
    if (isProcessingRef.current || !pendingStateRef.current || !stateRef.current.originalImage || !workerRef.current) return;

    // Clear any pending cooldown timeout - we are working again!
    if (renderingTimeoutRef.current) {
      clearTimeout(renderingTimeoutRef.current);
      renderingTimeoutRef.current = null;
    }

    isProcessingRef.current = true;
    setIsProcessing(true);

    const targetEffects = pendingStateRef.current.effects;
    pendingStateRef.current = null;

    try {
      const img = new Image();
      img.src = stateRef.current.originalImage;
      await img.decode();
      const bitmap = await createImageBitmap(img);

      workerRef.current.postMessage({
        id: Date.now().toString(),
        type: 'PROCESS',
        imageBitmap: bitmap,
        effects: targetEffects
      }, [bitmap]);

    } catch (err) {
      console.error(err);
      isProcessingRef.current = false;

      // Error case - also use hysteresis
      if (renderingTimeoutRef.current) clearTimeout(renderingTimeoutRef.current);
      renderingTimeoutRef.current = setTimeout(() => {
        setIsProcessing(false);
      }, 200);
    }
  };

  const applyGlitches = async (commitToHistory: boolean = false, overrideEffects?: EffectConfig[]) => {
    if (!stateRef.current.originalImage) return;

    const targetEffects = overrideEffects || stateRef.current.effects;

    if (commitToHistory) {
      const currentHistoryItem = stateRef.current.history[stateRef.current.historyIndex];
      const effectsChanged = !currentHistoryItem || JSON.stringify(currentHistoryItem.effects) !== JSON.stringify(targetEffects);

      if (effectsChanged) {
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push({ effects: targetEffects });
        if (newHistory.length > 30) newHistory.shift();

        onUpdateState({
          history: newHistory,
          historyIndex: newHistory.length - 1,
          effects: targetEffects
        });
      } else {
        onUpdateState({ effects: targetEffects });
      }
    }

    pendingStateRef.current = { effects: targetEffects };
    if (!isProcessingRef.current) {
      processPending();
    }
  };

  const handleShare = async () => {
    if (!previewCanvasRef.current) return;

    // WYSIWYG: The canvas IS the full resolution result
    const canvasUrl = previewCanvasRef.current.toDataURL('image/png');

    onUpdateState({
      processedImage: canvasUrl,
      processedImagePreview: canvasUrl
    });
    setShareModalOpen(true);
  };

  const handleUndo = () => {
    if (state.historyIndex > 0) {
      const prevIndex = state.historyIndex - 1;
      const prevItem = state.history[prevIndex];
      onUpdateState({ historyIndex: prevIndex, effects: prevItem.effects });
      applyGlitches(false, prevItem.effects);
    }
  };

  const handleRedo = () => {
    if (state.historyIndex < state.history.length - 1) {
      const nextIndex = state.historyIndex + 1;
      const nextItem = state.history[nextIndex];
      onUpdateState({ historyIndex: nextIndex, effects: nextItem.effects });
      applyGlitches(false, nextItem.effects);
    }
  };

  const handleHistoryCommit = () => {
    applyGlitches(true);
  };

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleApplyPreset = (presetName: string) => {
    const presetEffects = PRESETS[presetName];
    if (presetEffects) {
      const seededEffects = presetEffects.map(e => ({
        ...e,
        seed: e.seed ?? Math.floor(Math.random() * 1000000)
      }));

      onUpdateState({ effects: seededEffects });
      trackEvent('effect_applied', { effect_type: 'preset', preset_name: presetName });
      applyGlitches(true, seededEffects);
      setActiveTab('layers');
    }
  };

  // Mobile Swipe-to-Hide Logic
  const handleCloseLocal = () => {
    setIsClosing(true);
    setDragY(window.innerHeight);
  };

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;

      // Don't start drag if clicking interactive elements (buttons, inputs)
      if (target.closest('button, a, input, select, textarea')) {
        return;
      }

      startYRef.current = e.clientY;
      isDraggingRef.current = true;
      setIsDragging(true);

      isDraggingFromHandleRef.current = !!target.closest('[data-drag-handle="true"]');

      // Capture pointer to ensure we get events even if cursor moves outside panel
      try {
        panel.setPointerCapture(e.pointerId);
      } catch (err) {
        // Ignore capture errors
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;

      const currentY = e.clientY;
      const deltaY = currentY - startYRef.current;
      const scrollTop = scrollRef.current?.scrollTop || 0;

      // Engage if dragging from handle OR at top and swiping down
      if ((isDraggingFromHandleRef.current || scrollTop <= 0) && deltaY > 0) {
        setDragY(deltaY);
        currentDragYRef.current = deltaY;
      } else {
        setDragY(0);
        currentDragYRef.current = 0;
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;

      isDraggingRef.current = false;
      setIsDragging(false);
      isDraggingFromHandleRef.current = false;

      if (currentDragYRef.current > 100) {
        handleCloseLocal();
      } else {
        setDragY(0);
      }
      currentDragYRef.current = 0;

      try {
        panel.releasePointerCapture(e.pointerId);
      } catch (err) {
        // Ignore capture release errors
      }
    };

    // Selective touchmove prevention for mobile scroll interference
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startYRef.current;
      const scrollTop = scrollRef.current?.scrollTop || 0;

      // If at top and pulling down, prevent native scroll to allow swipe-to-hide
      if (scrollTop <= 0 && deltaY > 0 && e.cancelable) {
        e.preventDefault();
      }
    };

    panel.addEventListener('pointerdown', handlePointerDown);
    panel.addEventListener('pointermove', handlePointerMove);
    panel.addEventListener('pointerup', handlePointerUp);
    panel.addEventListener('pointercancel', handlePointerUp);
    panel.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      panel.removeEventListener('pointerdown', handlePointerDown);
      panel.removeEventListener('pointermove', handlePointerMove);
      panel.removeEventListener('pointerup', handlePointerUp);
      panel.removeEventListener('pointercancel', handlePointerUp);
      panel.removeEventListener('touchmove', handleTouchMove);
    };
  }, [showMobileEffects]);

  // Initial load
  useEffect(() => {
    applyGlitches(false);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // Standard browser confirmation
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.effects, user]); // Run when effects change or user status changes (watermark)

  const renderEffectsList = () => (
    <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2 overscroll-contain">
      {state.effects.map((effect, idx) => {
        const meta = EFFECT_METADATA[effect.type];
        const isActive = idx === state.currentEffectIndex;
        if (!meta.label.toLowerCase().includes(searchTerm.toLowerCase()) && searchTerm !== '') return null;

        return (
          <div key={effect.type} className={`p-3 rounded-xl transition-all ${isActive ? 'bg-primary/10 border border-primary/20' : 'hover:bg-white/5 border border-transparent hover:border-white/5'}`}>
            <div onClick={() => onUpdateState({ currentEffectIndex: isActive ? -1 : idx })} className="flex items-center justify-between mb-2 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className={`size-8 rounded-lg flex items-center justify-center transition-colors ${isActive ? 'bg-primary text-white cyber-glow' : 'bg-white/5 text-white/60'}`}>
                  <span className="material-symbols-outlined text-[20px]">{meta.icon}</span>
                </div>
                <div>
                  <p className={`text-[11px] font-bold uppercase tracking-wider ${isActive ? 'text-primary active-glow' : 'text-white/80'}`}>{meta.label}</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newEffects = [...state.effects];
                  newEffects[idx] = { ...newEffects[idx], active: !effect.active };
                  onUpdateState({ effects: newEffects });
                  trackEvent('effect_applied', { effect_type: newEffects[idx].type, action: newEffects[idx].active ? 'on' : 'off' });
                  applyGlitches(true, newEffects);
                }}
                className="material-symbols-outlined text-[16px]" style={{ color: effect.active ? '#0d7ff2' : 'rgba(255,255,255,0.2)' }}
              >
                {effect.active ? 'check_circle' : 'circle'}
              </button>
            </div>
            {isActive && (
              <div className="space-y-4 px-1 pb-2 mt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-white/60"><span>{meta.intensityLabel?.toUpperCase() || 'INTENSITY'}</span><span>{effect.intensity}%</span></div>
                  <input type="range" min="0" max="100" value={effect.intensity} onChange={(e) => handleEffectChange(idx, { intensity: parseInt(e.target.value) }, true)} onMouseUp={handleHistoryCommit} onTouchEnd={handleHistoryCommit} className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary" />
                </div>
                {(meta.showThreshold ?? true) && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-white/60"><span>{meta.thresholdLabel?.toUpperCase() || 'THRESHOLD'}</span><span>{effect.threshold}%</span></div>
                    <input type="range" min="0" max="100" value={effect.threshold} onChange={(e) => handleEffectChange(idx, { threshold: parseInt(e.target.value) }, true)} onMouseUp={handleHistoryCommit} onTouchEnd={handleHistoryCommit} className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary" />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderPresetsList = () => (
    <div ref={activeTab === 'presets' ? scrollRef : null} className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 overscroll-contain">
      {Object.entries(PRESETS).map(([name, config]) => (
        <button key={name} onClick={() => handleApplyPreset(name)} className="w-full p-4 rounded-xl border border-white/10 hover:border-primary/50 hover:bg-white/5 transition-all text-left">
          <span className="text-xs font-bold uppercase tracking-widest text-white">{name.replace('_', ' ')}</span>
        </button>
      ))}
    </div>
  );

  // New State for Preview (Previewing Original vs Processed)
  // We repurpose "Preview" button to show Original Image temporarily
  const [isPreviewingOriginal, setIsPreviewingOriginal] = useState(false);

  return (
    <div className="fixed inset-0 flex h-[100dvh] w-full flex-col overflow-hidden bg-background-dark text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-6 py-4 z-50 border-b border-white/5 bg-background-dark/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate(AppView.LANDING)}>
            <h2 className="text-lg md:text-xl font-bold tracking-normal uppercase">Glitch<span className="text-primary">Brain</span><span className="lowercase">.io</span></h2>
          </div>
          <div className="h-4 w-px bg-white/10 hidden md:block"></div>
          <nav className="hidden md:flex gap-6 text-sm font-medium tracking-wide text-white/50">
            <button className={`uppercase hover:text-primary transition-colors ${activeTab === 'layers' ? 'text-primary active-glow' : ''}`} onClick={() => setActiveTab('layers')}>Layers</button>
            <button className={`uppercase hover:text-primary transition-colors ${activeTab === 'presets' ? 'text-primary active-glow' : ''}`} onClick={() => setActiveTab('presets')}>Presets</button>
          </nav>
          <button onClick={() => setShowMobileEffects(!showMobileEffects)} className="lg:hidden flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 uppercase text-xs font-bold">Effects</button>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => { setInfoModalType('help'); setInfoModalOpen(true); }}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-white/60 hover:text-white transition-colors"
            title="Help & Documentation"
          >
            <span className="material-symbols-outlined text-[18px]">help</span>
            <span className="text-xs font-bold uppercase tracking-wider">Help</span>
          </button>
          <button
            onClick={() => { setInfoModalType('about'); setInfoModalOpen(true); }}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-white/60 hover:text-white transition-colors"
            title="About GlitchBrain"
          >
            <span className="material-symbols-outlined text-[18px]">info</span>
            <span className="text-xs font-bold uppercase tracking-wider">About</span>
          </button>
          <UserMenu onLoginClick={() => openAuthModal('login')} onSignupClick={() => openAuthModal('signup')} />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 relative bg-background-dark grid-bg overflow-hidden fade-in">
        <div className="flex-1 flex flex-col items-center justify-center p-0 overflow-hidden relative">
          <div className="w-full shrink-0 h-12 md:h-14 flex items-center justify-center z-30">
            <div className="flex items-center gap-1.5 glass-panel p-1.5 rounded-xl shadow-lg border border-white/10 scale-90 md:scale-100">
              <button onClick={handleUndo} disabled={state.historyIndex <= 0} className={`size-8 flex items-center justify-center rounded-lg ${state.historyIndex <= 0 ? 'text-white/20' : 'text-white/60 hover:text-white'}`}><span className="material-symbols-outlined text-[20px]">undo</span></button>
              <button onClick={handleRedo} disabled={state.historyIndex >= state.history.length - 1} className={`size-8 flex items-center justify-center rounded-lg ${state.historyIndex >= state.history.length - 1 ? 'text-white/20' : 'text-white/60 hover:text-white'}`}><span className="material-symbols-outlined text-[20px]">redo</span></button>
              <div className="w-px h-4 bg-white/10 mx-1"></div>
              <button
                onMouseDown={() => setIsPreviewingOriginal(true)}
                onMouseUp={() => setIsPreviewingOriginal(false)}
                onMouseLeave={() => setIsPreviewingOriginal(false)}
                onTouchStart={(e) => {
                  e.preventDefault();
                  setIsPreviewingOriginal(true);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  setIsPreviewingOriginal(false);
                }}
                onContextMenu={(e) => e.preventDefault()}
                className={`flex items-center gap-2 px-3 md:px-4 h-8 rounded-lg text-white text-[10px] font-bold uppercase tracking-[0.15em] cyber-glow transition-all border border-primary select-none ${isPreviewingOriginal ? 'bg-white text-black border-white' : 'bg-black text-white'}`}
              >
                <span className="material-symbols-outlined text-[16px]">compare</span>
                <span className="hidden sm:inline">{isPreviewingOriginal ? 'Original' : 'Preview'}</span>
              </button>
              <div className="w-px h-4 bg-white/10 mx-1"></div>
              <button onClick={handleShare} className="flex items-center gap-2 px-3 md:px-4 h-8 rounded-lg bg-black text-white text-[10px] font-bold uppercase tracking-[0.15em] cyber-glow hover:bg-primary/30 border border-primary">
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          <div className="relative w-full h-full flex-1 min-h-0 overflow-hidden group border-white/5 bg-black/5 flex items-center justify-center">
            <canvas
              ref={previewCanvasRef}
              className={`max-w-full max-h-full object-contain transition-all duration-150 shadow-2xl rounded-lg ${isProcessing && !isPreviewingOriginal ? 'opacity-90' : 'opacity-100'} ${isPreviewingOriginal ? 'hidden' : ''}`}
              style={{ willChange: 'contents' }}
            />

            {isPreviewingOriginal && state.originalImage && (
              <img src={state.originalImage} className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" alt="Original" />
            )}

            <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay bg-gradient-to-t from-primary/20 to-transparent"></div>

            {isProcessing && !isPreviewingOriginal && (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                <div className="size-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] font-mono text-primary animate-pulse uppercase tracking-widest">Rendering...</span>
              </div>
            )}
          </div>
        </div>

        <aside className="w-80 shrink-0 glass-panel flex flex-col border-l border-white/10 shadow-2xl h-full hidden lg:flex">
          <div className="p-5 border-b border-white/5 shrink-0">
            <div className="flex gap-2 mb-4">
              <button onClick={() => setActiveTab('layers')} className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-colors border ${activeTab === 'layers' ? 'bg-primary/10 text-primary active-glow border-primary/30' : 'bg-white/5 text-white/40 hover:text-white border-white/5'}`}>Layers</button>
              <button onClick={() => setActiveTab('presets')} className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-colors border ${activeTab === 'presets' ? 'bg-primary/10 text-primary active-glow border-primary/30' : 'bg-white/5 text-white/40 hover:text-white border-white/5'}`}>Presets</button>
            </div>
            {activeTab === 'layers' && (
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-white/40 text-[20px]">search</span>
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white/5 border-none rounded-lg pl-10 pr-4 py-2 text-[10px] font-bold tracking-widest focus:ring-1 focus:ring-primary uppercase placeholder:text-white/20" placeholder="SEARCH EFFECTS..." type="text" />
              </div>
            )}
          </div>
          {activeTab === 'layers' ? renderEffectsList() : renderPresetsList()}
          {!user && (
            <div className="p-3 mt-auto border-t border-white/5 bg-primary/5">
              <div className="flex items-start gap-2 text-white/60 text-[11px] leading-tight font-medium">
                <span className="material-symbols-outlined text-[14px] text-primary shrink-0">info</span>
                <p>Watermark active. <button onClick={() => openAuthModal('login')} className="text-primary font-bold hover:underline cursor-pointer">Sign in</button> to remove.</p>
              </div>
            </div>
          )}
        </aside>

        {showMobileEffects && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <div
              className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
              onClick={handleCloseLocal}
            />
            <div
              ref={panelRef}
              onTransitionEnd={(e) => {
                if (isClosing && e.propertyName === 'transform') {
                  setShowMobileEffects(false);
                  setIsClosing(false);
                  setDragY(0);
                }
              }}
              className="absolute inset-x-0 bottom-0 glass-panel rounded-t-3xl border-t border-white/10 max-h-[80vh] flex flex-col animate-in slide-in-from-bottom duration-300"
              style={{
                transform: isClosing ? `translateY(100%)` : (dragY > 0 ? `translateY(${dragY}px)` : 'none'),
                transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'none'
              }}
            >
              <div data-drag-handle="true" className="flex justify-center p-2"><div className="w-12 h-1 bg-white/20 rounded-full"></div></div>

              {/* Quick Actions: Help & About */}
              <div className="flex items-center gap-2 px-5 py-2.5 border-b border-white/5">
                <button
                  onClick={() => { setInfoModalType('help'); setInfoModalOpen(true); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/80 flex-1"
                >
                  <span className="material-symbols-outlined text-[18px]">help</span>
                  <span className="text-xs font-bold uppercase tracking-wider">Help</span>
                </button>
                <button
                  onClick={() => { setInfoModalType('about'); setInfoModalOpen(true); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/80 flex-1"
                >
                  <span className="material-symbols-outlined text-[18px]">info</span>
                  <span className="text-xs font-bold uppercase tracking-wider">About</span>
                </button>
              </div>

              <div data-drag-handle="true" className="flex items-center justify-between px-5 py-3 border-b border-white/5">
                <div className="flex gap-4">
                  <button onClick={() => setActiveTab('layers')} className={`text-xs font-bold uppercase tracking-widest ${activeTab === 'layers' ? 'text-primary' : 'text-white/40'}`}>Layers</button>
                  <button onClick={() => setActiveTab('presets')} className={`text-xs font-bold uppercase tracking-widest ${activeTab === 'presets' ? 'text-primary' : 'text-white/40'}`}>Presets</button>
                </div>
                <button onClick={handleCloseLocal} className="p-1"><span className="material-symbols-outlined text-white/60">close</span></button>
              </div>
              {activeTab === 'layers' ? renderEffectsList() : renderPresetsList()}
            </div>
          </div>
        )}
      </main>

      <footer className="h-6 bg-[#050510] border-t border-white/5 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4 text-[11px] font-bold tracking-widest text-white/80 uppercase">
          <div className="flex items-center gap-1.5 mr-2 sm:mr-4">
            <span className={`size-1.5 rounded-full ${isProcessing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'} shadow-sm shadow-green-500/50`}></span>
            <span className="hidden sm:inline">{isProcessing ? 'Rendering' : 'Ready'}</span>
          </div>
          <div className="h-3 w-px bg-white/10"></div>
          <div className="flex gap-2 sm:gap-4 text-[9px] text-white/70">
            <span>EFFECTS: {state.effects.filter(e => e.active).length}</span>
            <span className="hidden sm:inline">ENGINE: WEB WORKER (FULL RES)</span>
          </div>
        </div>
        <div className="flex items-center gap-6 text-[11px] font-bold tracking-widest text-white/70 uppercase">
          <ExportCreditsDisplay variant="inline" />
          <button onClick={() => onOpenLegal(false)} className="hover:text-white transition-colors uppercase"><span className="hidden sm:inline">Privacy & </span>Terms</button>
        </div>
      </footer>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} initialMode={authMode} />
      <ShareModal isOpen={shareModalOpen} onClose={() => setShareModalOpen(false)} imageUrl={state.processedImage} previewUrl={state.processedImagePreview} />
      <InfoModal isOpen={infoModalOpen} onClose={() => setInfoModalOpen(false)} type={infoModalType} />
    </div>
  );
};

export default EditorView;
