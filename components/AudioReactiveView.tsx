import React, { useState, useRef, useEffect } from 'react';
import { EffectConfig } from '../types';
import { mainGlitchEngine } from '../services/glitchEngine';
import SidebarNavigation from './SidebarNavigation';
import PlaybackBar from './PlaybackBar';
import Navbar from './Navbar';
import MainToolbar from './MainToolbar';
import { Footer } from './Footer';
import ExportModal from './ExportModal';
import { useAudioProcessor } from '@/hooks/useAudioProcessor';
import { exportVideo } from '@/services/exportService';
import { analytics } from '@/services/analytics';
import LandingModal from './LandingModal';
import InspectorWindow from './InspectorWindow';
import LibraryWindow from './LibraryWindow';
import { loadMuxelsFile } from '@/services/sanitizeImportedEffects';
import { useEffectStore } from '../store/useEffectStore';
import { SHARED_AUDIO_STATE } from '../services/audioState';

interface AudioReactiveViewProps {
}

const AudioReactiveView: React.FC<AudioReactiveViewProps> = () => {
    const {
        audioFile,
        isPlaying,
        currentTime,
        duration,
        handleAudioUpload,
        togglePlay,
        handleSeek,
        getElapsedSeconds,
        formatTime,
        isPlayingRef,
        reactivityMapRef,
        integratedReactivityMapRef,
        audioBufferRef,
        isProcessing,
        processingProgress,
        loadAudioFromUrl,
        loadAudioFromFile
    } = useAudioProcessor();

    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportResult, setExportResult] = useState<{ fileUrl: string, fileName: string } | null>(null);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const effects = useEffectStore(s => s.effects);
    const setEffects = useEffectStore(s => s.setEffects);
    const isSidebarOpen = useEffectStore(s => s.isSidebarOpen);
    const setIsSidebarOpen = useEffectStore(s => s.setIsSidebarOpen);
    const focusStack = useEffectStore(s => s.focusStack);
    const pushFocus = useEffectStore(s => s.pushFocus);
    const removeFocus = useEffectStore(s => s.removeFocus);

    const undo = useEffectStore(s => s.undo);
    const redo = useEffectStore(s => s.redo);

    const isInspectorOpen = focusStack.includes('inspector');
    const isLibraryOpen = focusStack.includes('library');

    const setActiveDropdownId = useEffectStore(s => s.setActiveDropdownId);

    const [isLandingOpen, setIsLandingOpen] = useState(effects.length === 0 && audioFile === null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    const currentTimeLabelRef = useRef<HTMLSpanElement>(null);
    const scrubberRef = useRef<HTMLInputElement>(null);
    const effectsRef = useRef<EffectConfig[]>(effects);
    const imageFileRef = useRef<string | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const isDraggingScrubberRef = useRef(false);
    const frameCounterRef = useRef(0);
    const abortControllerRef = useRef<AbortController | null>(null);
    const handleGlobalPtrDownLogicRef = useRef<(e: PointerEvent) => void>(() => { });
    const handleGlobalFocusInLogicRef = useRef<(e: FocusEvent) => void>(() => { });
    const handleGlobalKbdDownLogicRef = useRef<(e: KeyboardEvent) => void>(() => { });

    // Sync refs with store state (Direct update during render)
    useEffect(() => {
        effectsRef.current = effects;
    }, [effects]);

    // Update global interaction logic on every render
    useEffect(() => {
        handleGlobalPtrDownLogicRef.current = (e: PointerEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest?.('[data-dropdown-ignore]')) return;

            setActiveDropdownId(null);

            // Find the parent section to manage logical focus
            const container = target.closest?.('[data-section]') as HTMLElement;
            const section = container?.dataset.section;

            // Update focus based on section
            if (section === 'window') {
                const windowType = container?.dataset.window as 'inspector' | 'library' | undefined;
                if (windowType) pushFocus(windowType);
            } else {
                pushFocus('pipeline');
            }
        };

        handleGlobalFocusInLogicRef.current = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            const container = target.closest?.('[data-section]') as HTMLElement;
            const section = container?.dataset.section;

            if (section === 'window') {
                const windowType = container?.dataset.window as 'inspector' | 'library' | undefined;
                if (windowType) pushFocus(windowType);
            } else {
                pushFocus('pipeline');
            }
        };

        handleGlobalKbdDownLogicRef.current = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isTyping = target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable;

            const isModalOpen = document.querySelector('[data-section="modal"]');

            if (isTyping || isModalOpen) return;

            const key = e.key.toLowerCase();

            // Global Undo/Redo - Cmd/Ctrl + (Shift) + Z/Y
            const isMod = e.metaKey || e.ctrlKey;
            if (isMod && key === 'z') {
                if (e.shiftKey) redo();
                else undo();
                e.preventDefault();
            } else if (isMod && key === 'y') {
                redo();
                e.preventDefault();
            }

            // Toggle Sidebar - P
            if (key === 'p') {
                setIsSidebarOpen(!isSidebarOpen);
            }
            // Toggle Inspector - I
            else if (key === 'i') {
                if (isInspectorOpen) removeFocus('inspector');
                else pushFocus('inspector');
            }
            // Toggle Library - Y
            else if (key === 'y' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                if (isLibraryOpen) removeFocus('library');
                else pushFocus('library');
            }

            // Handle Space for Play/Pause
            if (e.code === 'Space' && !e.metaKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault(); // Prevent page scroll down
                if (target.tagName === 'BUTTON') target.blur(); // If a button is focused, blurring it prevents it from being natively clicked again.
                handleTogglePlay();
                return;
            }

            // Handle Seeking
            const isForward = e.key === 'ArrowRight' || e.key.toLowerCase() === 'l';
            const isBackward = e.key === 'ArrowLeft' || e.key.toLowerCase() === 'j';

            if (isForward || isBackward) {
                // If it's a shifted arrow, we handle it as a 10s jump
                e.preventDefault();
                const delta = (e.shiftKey || e.key.toLowerCase() === 'j' || e.key.toLowerCase() === 'l') ? 10 : 5;
                const time = getElapsedSeconds();
                const nextTime = Math.max(0, Math.min(duration, time + (isForward ? delta : -delta)));

                updateScrubberUI(nextTime);
                handleSeek({ target: { value: nextTime.toString() } } as any, () => {
                    if (!requestRef.current) requestRef.current = requestAnimationFrame(animate);
                });
            }
        };
    });

    // Global Interaction Handlers (Stable Listeners)
    useEffect(() => {
        const handleUp = () => { isDraggingScrubberRef.current = false; }; // Fix for scrubber not releasing on pointer up/cancel
        const handleDown = (e: PointerEvent) => handleGlobalPtrDownLogicRef.current(e);
        const handleFocus = (e: FocusEvent) => handleGlobalFocusInLogicRef.current(e);
        const handleKeyDown = (e: KeyboardEvent) => handleGlobalKbdDownLogicRef.current(e);

        window.addEventListener('pointerup', handleUp);
        window.addEventListener('pointercancel', handleUp);
        document.addEventListener('pointerdown', handleDown, { capture: true });
        document.addEventListener('focusin', handleFocus);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('pointerup', handleUp);
            window.removeEventListener('pointercancel', handleUp);
            document.removeEventListener('pointerdown', handleDown, { capture: true });
            document.removeEventListener('focusin', handleFocus);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []); // Attached once, logic lives in the Ref

    useEffect(() => {
        // Render initial imageless frame on mount
        renderFrame(0);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    const handleLandingStart = (audioOption: 'demo' | 'upload', audioFile?: File, muxelsFile?: File) => {
        setIsLandingOpen(false);

        // 1. Handle Audio Option
        if (audioOption === 'demo') {
            loadAudioFromUrl('/trip.mp3', 'Demo Track').catch(err => {
                console.error('Failed to load demo track:', err);
            });
        } else if (audioOption === 'upload' && audioFile) {
            loadAudioFromFile(audioFile).catch(err => {
                console.error('Failed to load uploaded audio:', err);
            });
        }

        // 2. Handle Project Loading (.muxels)
        if (muxelsFile) {
            loadMuxelsFile(muxelsFile)
                .then(sanitized => {
                    setEffects(sanitized);
                })
                .catch(err => {
                    alert(err.message);
                });
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            analytics.image.started(file);
            setImageFile(file);
            const imageBlob = URL.createObjectURL(file);
            imageFileRef.current = imageBlob; // Store the URL string for the animation loop

            const img = new Image();
            img.src = imageBlob;

            // Use .decode() to get a real promise that rejects with a meaningful error
            img.decode()
                .then(() => {
                    // Success!
                    if (canvasRef.current) {
                        mainGlitchEngine.renderToCanvas(
                            canvasRef.current,
                            imageBlob,
                            effects,
                            { maxSize: 1920 }
                        );
                        analytics.image.succeeded(file, img.width, img.height);
                    }
                })
                .catch((err: any) => {
                    analytics.image.failed(file, err);
                    console.error("Image decode failed:", err);
                    URL.revokeObjectURL(imageBlob);
                    imageFileRef.current = null;
                    setImageFile(null);
                });
        }
    };

    const renderFrame = async (time: number) => {
        if (!canvasRef.current) return;
        const fractionalFrame = time * 60;
        const frameIndex = Math.floor(fractionalFrame);
        const nextFrameIndex = Math.min(frameIndex + 1, (reactivityMapRef.current?.bass.length || 1) - 1);
        const t = fractionalFrame - frameIndex; // Interpolation factor (0.0 to 1.0)

        let smoothed: { sub: number, bass: number, mid: number, treble: number } | undefined;
        let frameIntegrated: { sub: number, bass: number, mid: number, treble: number } | undefined;

        // 1. Get Instantaneous Reactivity for standard effects (with Linear Interpolation)
        if (reactivityMapRef.current) {
            const map = reactivityMapRef.current;
            const f = Math.min(map.bass.length - 1, frameIndex); // Ensures frame <= last valid FFT frame index
            const nf = Math.min(map.bass.length - 1, nextFrameIndex);

            smoothed = {
                sub: map.sub[f] + (map.sub[nf] - map.sub[f]) * t,
                bass: map.bass[f] + (map.bass[nf] - map.bass[f]) * t,
                mid: map.mid[f] + (map.mid[nf] - map.mid[f]) * t,
                treble: map.treble[f] + (map.treble[nf] - map.treble[f]) * t
            };

            // Update global "state bucket" (Shared Float32Array)
            SHARED_AUDIO_STATE[0] = smoothed.sub;
            SHARED_AUDIO_STATE[1] = smoothed.bass;
            SHARED_AUDIO_STATE[2] = smoothed.mid;
            SHARED_AUDIO_STATE[3] = smoothed.treble;
        }

        // 2. Get Integrated Reactivity for motion effects (with Linear Interpolation)
        if (integratedReactivityMapRef.current) {
            const iMap = integratedReactivityMapRef.current;
            const f = Math.min(iMap.bass.length - 1, frameIndex);
            const nf = Math.min(iMap.bass.length - 1, nextFrameIndex);

            frameIntegrated = {
                sub: iMap.sub[f] + (iMap.sub[nf] - iMap.sub[f]) * t,
                bass: iMap.bass[f] + (iMap.bass[nf] - iMap.bass[f]) * t,
                mid: iMap.mid[f] + (iMap.mid[nf] - iMap.mid[f]) * t,
                treble: iMap.treble[f] + (iMap.treble[nf] - iMap.treble[f]) * t
            };
        }

        await mainGlitchEngine.renderToCanvas(
            canvasRef.current,
            imageFileRef.current,
            effectsRef.current,
            {
                maxSize: 1920,
                reactivity: smoothed,
                integratedReactivity: frameIntegrated,
                currentTime: time
            }
        );
    };

    const scrubberPercent = (time: number, duration: number) => {
        return duration > 0 ? (time / duration) * 100 : 0;
    }

    const updateScrubberUI = (time: number) => {
        if (currentTimeLabelRef.current) currentTimeLabelRef.current.innerText = formatTime(time);
        if (scrubberRef.current) {
            scrubberRef.current.value = time.toString();
            const percent = scrubberPercent(time, duration);
            scrubberRef.current.style.setProperty('--progress', `${percent}%`);
        }
    };

    const animate = async () => {
        if (!isPlayingRef.current) {
            requestRef.current = undefined;
            return;
        }

        const elapsed = Math.min(getElapsedSeconds(), duration);
        // Only throttle if not dragging scrubber
        if (frameCounterRef.current % 4 === 0 && !isDraggingScrubberRef.current) {
            updateScrubberUI(elapsed);
        }
        frameCounterRef.current++;

        await renderFrame(elapsed);

        requestRef.current = requestAnimationFrame(animate); // Keep animation loop going even if no image or canvas
    };

    // Update preview and scrubber UI when not playing (seeking while paused, audio upload)
    useEffect(() => {
        if (!isPlaying) {
            renderFrame(currentTime);
            updateScrubberUI(currentTime);
        }
    }, [effects, imageFile, currentTime, isPlaying, audioFile, duration]);

    const handleTogglePlay = () => {
        if (!audioFile || isProcessing) return;
        analytics.playback.toggled(!isPlaying);
        togglePlay(() => {
            // Start animation loop if not already running
            if (!requestRef.current) {
                requestRef.current = requestAnimationFrame(animate);
            }
        });
    };

    const handleExport = () => {
        setIsExportModalOpen(true);
    };

    const handleActualExport = async (options: { fps: number; resolution: number }) => {
        if (!reactivityMapRef.current || !audioBufferRef.current) return;

        setExportResult(null);
        setIsExporting(true);
        setExportProgress(0);

        // Create fresh controller for this export
        abortControllerRef.current = new AbortController();

        try {
            analytics.export.started();
            const result = await exportVideo({
                audioBuffer: audioBufferRef.current,
                reactivityMap: reactivityMapRef.current,
                integratedReactivity: integratedReactivityMapRef.current,
                imageSrc: imageFileRef.current,
                effects: effects,
                duration: duration,
                fps: options.fps,
                maxSize: options.resolution,
                onProgress: (p) => setExportProgress(p * 100),
                signal: abortControllerRef.current.signal
            });
            analytics.export.succeeded(effects);
            setExportResult(result);
        } catch (err: any) {
            if (err.name === 'AbortError') {
                console.log("Export was canceled by user.");
                return;
            }
            analytics.export.failed(err);
            console.error("Export failed:", err);
            alert("Export failed. See console for details.");
        } finally {
            setIsExporting(false);
            setExportProgress(0);
            abortControllerRef.current = null;
        }
    };

    const handleCancelExport = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    };

    return (
        <div
            className="text-white flex flex-col overflow-hidden font-display leading-relaxed relative"
            style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
        >
            <Navbar />
            <div className="flex-1 flex flex-row min-h-0 overflow-hidden relative">
                {/* Main Content Area */}
                <main className={`flex-1 flex flex-col min-h-0 min-w-0 transition-all duration-500 ease-in-out ${isSidebarOpen ? 'lg:mr-0' : ''}`}>
                    <MainToolbar
                        imageInputRef={imageInputRef}
                        audioInputRef={audioInputRef}
                        imageFile={imageFile}
                        audioFile={audioFile}
                        handleImageUpload={handleImageUpload}
                        handleAudioUpload={handleAudioUpload}
                    />

                    {/* Viewport */}
                    <div className="flex-1 flex items-center justify-center min-h-0 relative group">
                        {/* Mobile Floating Toggle */}
                        {!isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="absolute top-6 right-6 z-20 w-12 h-12 rounded-2xl bg-black/90 border border-[#FB00FF]/40 text-white shadow-[0_0_30px_rgba(0,0,0,0.5),0_0_15px_rgba(251,0,255,0.2)] flex items-center justify-center lg:hidden animate-in fade-in zoom-in duration-300 active:scale-90 hover:bg-black transition-all"
                                aria-label="Show sidebar">
                                <span className="material-symbols-outlined text-2xl">tune</span>
                            </button>
                        )}

                        <div
                            className="relative w-full h-full overflow-hidden bg-white/5 flex items-center justify-center"
                            style={{ transform: 'translateZ(0)' }}
                        >
                            <canvas ref={canvasRef} className="max-w-full max-h-full border-l border-r border-white/5 object-contain" />
                            {isProcessing && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300 z-10 backdrop-blur-sm">
                                    <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                    <div className="flex flex-col items-center gap-1">
                                        <h3 className="text-xs font-bold tracking-widest text-white uppercase">Analyzing Audio</h3>
                                        <p className="text-[9px] text-white/60 uppercase tracking-[0.2em]">{processingProgress}%</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Bar: Playback & Export */}
                    <div className="h-14 bg-white/5 border-t border-white/5 flex items-center pr-3 sm:pr-6 shrink-0 w-full">
                        <PlaybackBar
                            isPlaying={isPlaying}
                            audioFile={audioFile}
                            isProcessing={isProcessing}
                            formatTime={formatTime}
                            currentTime={currentTime}
                            duration={duration}
                            currentTimeLabelRef={currentTimeLabelRef}
                            scrubberRef={scrubberRef}
                            isDraggingScrubberRef={isDraggingScrubberRef}
                            onPlayPause={handleTogglePlay}
                            onScrubberChange={(e) => {
                                const val = parseFloat(e.target.value);
                                updateScrubberUI(val);
                                handleSeek(e, () => {
                                    if (!requestRef.current) {
                                        requestRef.current = requestAnimationFrame(animate);
                                    }
                                });
                            }}
                        />

                        {/* Export Button */}
                        <div className="flex items-center pl-2 sm:pl-4 border-l border-white/10 ml-1 sm:ml-2 shrink-0">
                            <button
                                onClick={handleExport}
                                disabled={!audioFile || isExporting || isProcessing}
                                className={`h-9 px-3 sm:px-4 rounded-xl flex items-center transition-all border disabled:bg-white/5 disabled:border-white/5 disabled:text-white/40 bg-[#FB00FF]/10 border-[#FB00FF]/20 text-[#FB00FF] hover:bg-[#FB00FF]/20 hover:border-[#FB00FF]/40 shadow-[0_0_15px_rgba(251,0,251,0.1)]`}
                                title="Export"
                                aria-label="Export">
                                <span className="material-symbols-outlined text-[18px]">
                                    download
                                </span>
                            </button>
                        </div>
                    </div>
                </main>

                {/* Sidebar: Effects Rack & Parameters */}
                <aside
                    className={`fixed inset-y-0 right-0 z-[60] lg:relative w-full sm:w-[400px] border-l border-white/5 bg-[#050B14] flex flex-col overflow-hidden shrink-0 transition-transform duration-500 ease-in-out shadow-[-20px_0_50px_rgba(0,0,0,0.5)] lg:shadow-none will-change-transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:hidden'}`}>
                    {/* Inner wrapper */}
                    <div data-section="sidebar" className="flex-1 flex flex-col min-h-0 relative">
                        <SidebarNavigation
                            onClose={() => setIsSidebarOpen(false)} />
                    </div>
                </aside>

                {/* Mobile Backdrop */}
                {isSidebarOpen && (
                    <div
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden animate-in fade-in duration-300"
                    />
                )}
            </div>
            <Footer />
            <LandingModal isOpen={isLandingOpen} onStart={handleLandingStart} onClose={() => setIsLandingOpen(false)} />
            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => {
                    if (exportResult) {
                        URL.revokeObjectURL(exportResult.fileUrl);
                        setExportResult(null);
                    }
                    setIsExportModalOpen(false);
                }}
                onExport={handleActualExport}
                onCancelExport={handleCancelExport}
                isExporting={isExporting}
                exportProgress={exportProgress}
                exportResult={exportResult}
            />
            <InspectorWindow />
            <LibraryWindow />
        </div>
    );
};

export default AudioReactiveView;
