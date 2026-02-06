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
import { drawWatermarkToCanvas, Watermark } from '../services/watermarkService';

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
  const [showCropMenu, setShowCropMenu] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  // Aspect ratio presets
  const aspectRatios = [
    { label: 'Original', ratio: null },
    { label: 'Profile Picture', ratio: 1, targetWidth: 1080, targetHeight: 1080 },
    { label: 'Instagram Portrait', ratio: 4 / 5, targetWidth: 1080, targetHeight: 1350 },
    { label: 'Instagram Story', ratio: 9 / 16, targetWidth: 1080, targetHeight: 1920 },
    { label: 'Landscape', ratio: 1.91, targetWidth: 1080, targetHeight: 566 },
    { label: 'YouTube Thumbnail', ratio: 16 / 9, targetWidth: 1280, targetHeight: 720 }
  ];

  // Viewport tracking for robust crop sizing
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  const isDraggingRef = useRef(false);
  const isDraggingFromHandleRef = useRef(false);
  const startYRef = useRef(0);
  const currentDragYRef = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync refs for the processing loop & stale closures
  const stateRef = useRef(state);
  const userRef = useRef(user);

  // Crop viewport refs
  const viewportRef = useRef<HTMLDivElement>(null);
  const cropWindowRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef({ x: 0, y: 0 });
  const currentTransformRef = useRef({ x: 0, y: 0, scale: 1.0 });
  const animationFrameRef = useRef<number | null>(null);

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

  // Sync currentTransformRef with crop state
  // Sync currentTransformRef with crop state
  // We guard this to prevent "stuttering" where the slightly-stale React state
  // overwrites the fresh imperative ref state during active gestures.
  const isZoomingRef = useRef(false);
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // If we are actively interacting, DO NOT sync from state.
    // The ref is the source of truth during interaction.
    if (isPanning || isZoomingRef.current) return;

    currentTransformRef.current = {
      x: state.crop.x,
      y: state.crop.y,
      scale: state.crop.scale
    };
  }, [state.crop, isPanning]);

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
            setImageSize({ width: imageBitmap.width, height: imageBitmap.height });
          }

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(imageBitmap, 0, 0);

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
    const sourceCanvas = previewCanvasRef.current;
    if (!sourceCanvas) return;

    let canvasUrl: string;

    if (state.crop.aspectRatio === null) {
      // No crop: export full canvas
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = sourceCanvas.width;
      tempCanvas.height = sourceCanvas.height;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(sourceCanvas, 0, 0);
        if (!user) {
          drawWatermarkToCanvas(ctx, tempCanvas.width, tempCanvas.height);
        }
        canvasUrl = tempCanvas.toDataURL('image/png');
      } else {
        canvasUrl = sourceCanvas.toDataURL('image/png');
      }
    } else {
      // Stationary Crop Window Export Logic
      const tempCanvas = document.createElement('canvas');

      const cropWindow = cropWindowRef.current;
      if (!cropWindow) return;
      const cropRect = cropWindow.getBoundingClientRect();
      const canvasRect = sourceCanvas.getBoundingClientRect();

      const scaleX = sourceCanvas.width / canvasRect.width;
      const scaleY = sourceCanvas.height / canvasRect.height;

      const relativeX = cropRect.left - canvasRect.left;
      const relativeY = cropRect.top - canvasRect.top;

      const sourceX = relativeX * scaleX;
      const sourceY = relativeY * scaleY;
      const sourceW = cropRect.width * scaleX;
      const sourceH = cropRect.height * scaleY;

      // Use target dimensions if available, otherwise fallback to source crop dimensions
      tempCanvas.width = state.crop.targetWidth || sourceW;
      tempCanvas.height = state.crop.targetHeight || sourceH;

      const ctx = tempCanvas.getContext('2d');
      if (!ctx) return;

      // Draw with scaling to the target dimensions (9-argument version of drawImage)
      ctx.drawImage(
        sourceCanvas,
        sourceX, sourceY, sourceW, sourceH,
        0, 0, tempCanvas.width, tempCanvas.height
      );

      if (!user) {
        drawWatermarkToCanvas(ctx, tempCanvas.width, tempCanvas.height);
      }

      canvasUrl = tempCanvas.toDataURL('image/png');
    }

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

  const handleRandomize = () => {
    // 1. Pick 3-5 random effects to activate
    const numEffects = Math.floor(Math.random() * 3) + 3;
    const shuffledEffects = [...state.effects].sort(() => 0.5 - Math.random());
    const activeTypes = new Set(shuffledEffects.slice(0, numEffects).map(e => e.type));

    const randomizedEffects = state.effects.map(effect => {
      const isActive = activeTypes.has(effect.type);
      return {
        ...effect,
        active: isActive,
        intensity: Math.floor(Math.random() * 80) + 10, // 10-90%
        threshold: Math.floor(Math.random() * 80) + 10,
        seed: Math.floor(Math.random() * 1000000)
      };
    });

    onUpdateState({ effects: randomizedEffects });
    trackEvent('effect_applied', { effect_type: 'randomize', action: 'click' });
    applyGlitches(true, randomizedEffects);
  };

  const [showMagicMenu, setShowMagicMenu] = useState(false);

  // Crop handlers
  const handleAspectRatioChange = (ratio: number | null, label: string, targetWidth?: number, targetHeight?: number) => {
    // 1. Calculate new containment scale so image fits in viewport
    let newScale = 1.0;
    if (ratio !== null && previewCanvasRef.current && viewportRef.current) {
      const imgW = previewCanvasRef.current.width;
      const imgH = previewCanvasRef.current.height;
      const viewW = viewportRef.current.clientWidth;
      const viewH = viewportRef.current.clientHeight;

      // Target dimensions for the crop window (with 20px padding * 2 = 40px safety - REDUCED for larger view)
      const safeW = viewW - 40;
      const safeH = viewH - 40;

      // Calculate crop window dimensions based on ratio
      let cropW = safeW;
      let cropH = safeW / ratio;

      if (cropH > safeH) {
        cropH = safeH;
        cropW = safeH * ratio;
      }

      // "Cover" means the image fills the crop.
      const scaleX = cropW / imgW;
      const scaleY = cropH / imgH;
      newScale = Math.max(scaleX, scaleY);
    }

    const newCrop = { aspectRatio: ratio, aspectLabel: label, scale: newScale, x: 0, y: 0, targetWidth, targetHeight };
    currentTransformRef.current = { x: 0, y: 0, scale: newScale };
    onUpdateState({ crop: newCrop });
    setShowCropMenu(false);
  };

  const handleResetCrop = () => {
    handleAspectRatioChange(
      state.crop.aspectRatio,
      state.crop.aspectLabel || '',
      state.crop.targetWidth,
      state.crop.targetHeight
    );
  };

  const applyTransform = () => {
    if (!previewCanvasRef.current || state.crop.aspectRatio === null) return;
    const canvas = previewCanvasRef.current;

    // Enforce bounds: Image must always cover the crop window
    if (cropWindowRef.current) {
      const cropW = cropWindowRef.current.clientWidth;
      const cropH = cropWindowRef.current.clientHeight;
      const imgW = canvas.width;
      const imgH = canvas.height;
      const { scale } = currentTransformRef.current;

      const sw = imgW * scale;
      const sh = imgH * scale;

      const maxX = Math.max(0, (sw - cropW) / 2);
      const maxY = Math.max(0, (sh - cropH) / 2);

      currentTransformRef.current.x = Math.max(-maxX, Math.min(maxX, currentTransformRef.current.x));
      currentTransformRef.current.y = Math.max(-maxY, Math.min(maxY, currentTransformRef.current.y));
    }

    const { x, y, scale } = currentTransformRef.current;
    canvas.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  };

  const handleCropZoom = (delta: number, clientX?: number, clientY?: number) => {
    if (!viewportRef.current || !previewCanvasRef.current) return;

    // Mark as zooming so effects don't overwrite us
    isZoomingRef.current = true;
    if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
    zoomTimeoutRef.current = setTimeout(() => {
      isZoomingRef.current = false;
    }, 100);

    let minScale = 0.1;
    if (state.crop.aspectRatio !== null && cropWindowRef.current) {
      const cropW = cropWindowRef.current.clientWidth;
      const cropH = cropWindowRef.current.clientHeight;
      const imgW = previewCanvasRef.current.width;
      const imgH = previewCanvasRef.current.height;
      minScale = Math.max(cropW / imgW, cropH / imgH);
    }

    const newScale = Math.max(minScale, Math.min(5.0, currentTransformRef.current.scale - delta * 0.001));

    currentTransformRef.current.scale = newScale;

    applyTransform();

    // Debounce state update
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(() => {
      onUpdateState({ crop: { ...state.crop, ...currentTransformRef.current } });
    });
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
      if (target.closest('button, a, input, select, textarea, [data-interactive="true"]')) {
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

  // Track viewport size changes
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewportSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });

    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

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
            <div data-interactive="true" onClick={() => onUpdateState({ currentEffectIndex: isActive ? -1 : idx })} className="flex items-center justify-between mb-2 cursor-pointer">
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
                className={`material-symbols-outlined text-[24px] ${effect.active ? 'text-primary' : 'text-[rgb(255,255,255,0.2)]'}`}
              >
                {'mode_off_on'}
              </button>
            </div>
            {isActive && (
              <div className="space-y-4 px-1 pb-2 mt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-white/60"><span>{meta.intensityLabel?.toUpperCase() || 'INTENSITY'}</span><span>{effect.intensity}%</span></div>
                  <input type="range" min="0" max="100" value={effect.intensity} onChange={(e) => handleEffectChange(idx, { intensity: parseInt(e.target.value) }, true)} onMouseUp={handleHistoryCommit} onTouchEnd={handleHistoryCommit} className="w-full h-6 bg-transparent appearance-none cursor-pointer custom-slider" />
                </div>
                {(meta.showThreshold ?? true) && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-white/60"><span>{meta.thresholdLabel?.toUpperCase() || 'THRESHOLD'}</span><span>{effect.threshold}%</span></div>
                    <input type="range" min="0" max="100" value={effect.threshold} onChange={(e) => handleEffectChange(idx, { threshold: parseInt(e.target.value) }, true)} onMouseUp={handleHistoryCommit} onTouchEnd={handleHistoryCommit} className="w-full h-6 bg-transparent appearance-none cursor-pointer custom-slider" />
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
          <nav className="hidden lg:flex gap-6 text-sm font-medium tracking-wide text-white/50">
            <button className={`uppercase hover:text-primary transition-colors ${activeTab === 'layers' ? 'text-primary active-glow' : ''}`} onClick={() => setActiveTab('layers')}>Effects</button>
            <button className={`uppercase hover:text-primary transition-colors ${activeTab === 'presets' ? 'text-primary active-glow' : ''}`} onClick={() => setActiveTab('presets')}>Presets</button>
          </nav>
          <button onClick={() => setShowMobileEffects(!showMobileEffects)} className="lg:hidden flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 uppercase text-xs font-bold">Effects</button>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => { setInfoModalType('help'); setInfoModalOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-white/60 hover:text-white transition-colors"
            title="Help & Documentation"
          >
            <span className="material-symbols-outlined text-[18px]">help</span>
            <span className="hidden md:block text-xs font-bold uppercase tracking-wider">Help</span>
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

              {/* Magic/Random Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowMagicMenu(!showMagicMenu)}
                  className="flex items-center gap-2 px-3 md:px-4 h-8 rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 hover:border-primary active-glow transition-all"
                  title="Instant Magic"
                >
                  <span className="material-symbols-outlined text-[18px]">auto_fix_high</span>
                  <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-[0.15em]">Magic</span>
                </button>

                {showMagicMenu && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black/95 backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-50 min-w-[200px] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <button onClick={() => { handleRandomize(); setShowMagicMenu(false); }} className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-white/10 border-b border-white/10 group">
                      <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">casino</span>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-white">Surprise Me</div>
                        <div className="text-[10px] text-white/50">Randomize everything</div>
                      </div>
                    </button>
                    <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/40">Instant styles</div>
                    {[
                      { id: 'GLITCH_RAIN', label: 'Glitch Rain', icon: 'terminal' },
                      { id: 'CYBERPUNK', label: 'Cyberpunk', icon: 'corporate_fare' },
                      { id: 'VAPORWAVE', label: 'Vaporwave', icon: 'filter_drama' }
                    ].map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => { handleApplyPreset(preset.id); setShowMagicMenu(false); }}
                        className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-white/10 transition-colors"
                      >
                        <span className="material-symbols-outlined text-white/60 text-[16px]">{preset.icon}</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-white/80">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
              {/* Aspect Ratio Button */}
              <div className="relative">
                <button
                  onClick={() => setShowCropMenu(!showCropMenu)}
                  className="flex items-center gap-2 px-3 md:px-4 h-8 rounded-lg bg-black text-white text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-white/10 border border-white/20"
                >
                  <span className="material-symbols-outlined text-[16px]">crop</span>
                  <span className="hidden sm:inline">{state.crop.aspectLabel || 'Crop'}</span>
                </button>
                {showCropMenu && (
                  <div className="absolute top-full mt-2 right-0 bg-black/95 backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-50 min-w-[180px]">
                    {aspectRatios.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => handleAspectRatioChange(preset.ratio, preset.label, preset.targetWidth, preset.targetHeight)}
                        className="w-full px-4 py-2 text-left text-xs font-bold uppercase tracking-wider hover:bg-primary/20 transition-colors first:rounded-t-lg last:rounded-b-lg"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {state.crop.aspectRatio !== null && (
                <button
                  onClick={handleResetCrop}
                  className="size-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white"
                  title="Reset Crop"
                >
                  <span className="material-symbols-outlined text-[20px]">restart_alt</span>
                </button>
              )}
              <div className="w-px h-4 bg-white/10 mx-1"></div>
              <button onClick={handleShare} className="flex items-center gap-2 px-3 md:px-4 h-8 rounded-lg bg-black text-white text-[10px] font-bold uppercase tracking-[0.15em] cyber-glow hover:bg-primary/30 border border-primary">
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          <div
            ref={viewportRef}
            className="relative w-full h-full flex-1 min-h-0 overflow-hidden group border-white/5 bg-black/5 flex items-center justify-center"
            onWheel={(e) => {
              if (state.crop.aspectRatio !== null) {
                e.preventDefault();
                handleCropZoom(e.deltaY, e.clientX, e.clientY);
              }
            }}
            onPointerDown={(e) => {
              if (state.crop.aspectRatio !== null && !isPanning) {
                e.preventDefault();
                setIsPanning(true);
                panStartRef.current = {
                  x: e.clientX - currentTransformRef.current.x,
                  y: e.clientY - currentTransformRef.current.y
                };
              }
            }}
            onPointerMove={(e) => {
              if (isPanning && state.crop.aspectRatio !== null) {
                currentTransformRef.current.x = e.clientX - panStartRef.current.x;
                currentTransformRef.current.y = e.clientY - panStartRef.current.y;
                applyTransform();
              }
            }}
            onPointerUp={() => {
              if (isPanning) {
                setIsPanning(false);
                onUpdateState({ crop: { ...state.crop, ...currentTransformRef.current } });
              }
            }}
            onPointerLeave={() => {
              if (isPanning) {
                setIsPanning(false);
                onUpdateState({ crop: { ...state.crop, ...currentTransformRef.current } });
              }
            }}
            style={{ cursor: state.crop.aspectRatio !== null ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
          >
            {/* 1. Canvas Wrapper - Handles safe positioning for Original mode */}
            <div
              className="relative flex items-center justify-center transform-gpu"
              style={{
                ...(state.crop.aspectRatio === null
                  ? {
                    maxWidth: '100%',
                    maxHeight: '100%',
                    aspectRatio: imageSize ? `${imageSize.width} / ${imageSize.height}` : 'auto',
                    width: 'auto',
                    height: 'auto'
                  }
                  : {
                    width: 'fit-content',
                    height: 'fit-content'
                  })
              }}
            >
              <canvas
                ref={previewCanvasRef}
                className={`shadow-2xl rounded-lg ${isProcessing && !isPreviewingOriginal ? 'opacity-90' : 'opacity-100'} ${isPreviewingOriginal ? 'hidden' : ''}`}
                style={{
                  willChange: 'transform',
                  // CRITICAL: No transition-all here, ensures instant drag response
                  transition: 'opacity 0.15s ease',
                  maxWidth: state.crop.aspectRatio === null ? '100%' : 'none',
                  maxHeight: state.crop.aspectRatio === null ? '100%' : 'none',
                  objectFit: 'contain',
                  transform: state.crop.aspectRatio !== null
                    ? `translate(${state.crop.x}px, ${state.crop.y}px) scale(${state.crop.scale})`
                    : 'none',
                  transformOrigin: 'center center'
                }}
              />

              {isPreviewingOriginal && state.originalImage && (
                <img
                  src={state.originalImage}
                  className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                  alt="Original"
                  style={{
                    maxWidth: state.crop.aspectRatio === null ? '100%' : 'none',
                    maxHeight: state.crop.aspectRatio === null ? '100%' : 'none',
                    transform: state.crop.aspectRatio !== null
                      ? `translate(${state.crop.x}px, ${state.crop.y}px) scale(${state.crop.scale})`
                      : 'none',
                    transformOrigin: 'center center'
                  }}
                />
              )}

              {/* No-crop Watermark - Now strictly over the image */}
              {state.crop.aspectRatio === null && !user && !isPreviewingOriginal && state.originalImage && (
                <div className="absolute bottom-[4%] right-[4%] w-[30%] aspect-[5.33/1] z-[60]">
                  <Watermark className="w-full h-full" />
                </div>
              )}
            </div>

            {/* 2. Crop Overlay - The Fixed Window */}
            {state.crop.aspectRatio !== null && !isPreviewingOriginal && (
              <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center p-[20px]">
                {/* This div creates the dimming via broad box-shadow and frame via border */}
                <div
                  ref={cropWindowRef}
                  className="relative shadow-2xl border-2 border-white/50"
                  style={{
                    // Robust sizing: Check Viewport Ratio vs Crop Ratio
                    // If Viewport is wider than crop (Landscape screen, Portrait crop) -> Height constrained -> height: 100%
                    // If Crop is wider than Viewport (Portrait screen, Landscape crop) -> Width constrained -> width: 100%
                    ...(state.crop.aspectRatio && viewportSize.width && viewportSize.height
                      ? (state.crop.aspectRatio > (viewportSize.width / viewportSize.height)
                        ? { width: '100%', height: 'auto' } // Crop is "wider" relative to view -> maximize width
                        : { height: '100%', width: 'auto' } // Crop is "taller" relative to view -> maximize height
                      )
                      : { width: '100%', height: 'auto' } // Fallback
                    ),
                    maxWidth: '100%',
                    maxHeight: '100%',
                    aspectRatio: `${state.crop.aspectRatio}`,
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)'
                  }}
                >
                  {/* Visual Guides (Rule of Thirds) */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20">
                    <div className="border-r border-b border-white"></div>
                    <div className="border-r border-b border-white"></div>
                    <div className="border-b border-white"></div>
                    <div className="border-r border-b border-white"></div>
                    <div className="border-r border-b border-white"></div>
                    <div className="border-b border-white"></div>
                    <div className="border-r border-white"></div>
                    <div className="border-r border-white"></div>
                    <div></div>
                  </div>

                  {/* Profile Circle Guide */}
                  {state.crop.aspectRatio === 1 && state.crop.aspectLabel === 'Profile Picture' && (
                    <div className="absolute inset-0 m-auto border-2 border-dashed border-white/80 rounded-full w-[90%] h-[90%] opacity-80" />
                  )}

                  {/* Fixed Watermark Overlay */}
                  {!user && (
                    <div className="absolute bottom-[4%] right-[4%] w-[30%] aspect-[5.33/1] z-[60]">
                      <Watermark className="w-full h-full" />
                    </div>
                  )}
                </div>
              </div>
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
              <button onClick={() => setActiveTab('layers')} className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-colors border ${activeTab === 'layers' ? 'bg-primary/10 text-primary active-glow border-primary/30' : 'bg-white/5 text-white/40 hover:text-white border-white/5'}`}>Effects</button>
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
                  <button onClick={() => setActiveTab('layers')} className={`text-xs font-bold uppercase tracking-widest ${activeTab === 'layers' ? 'text-primary' : 'text-white/40'}`}>Effects</button>
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
