import React, { useRef, useEffect, useState } from 'react';
import { EffectConfig } from '../types';
import SidebarNavigation from './SidebarNavigation';
import PlaybackBar from './PlaybackBar';
import Navbar from './Navbar';
import MainToolbar from './MainToolbar';
import ExportModal from './ExportModal';
import LandingModal from './LandingModal';
import InspectorWindow from './InspectorWindow';
import LibraryWindow from './LibraryWindow';
import TabAudioUnsupportedModal from './TabAudioUnsupportedModal';
import { Footer } from './Footer';
import { analytics } from '@/services/analytics';
import { useAudioProcessor } from '@/hooks/useAudioProcessor';
import { useLiveAudio } from '@/hooks/useLiveAudio';
import { useAppShortcuts } from '@/hooks/useAppShortcuts';
import { useVideoExport } from '@/hooks/useVideoExport';
import { useProjectAssets } from '@/hooks/useProjectAssets';
import { useRenderLoop } from '@/hooks/useRenderLoop';
import { useCanvasSelection } from '@/hooks/useCanvasSelection';
import { useEffectStore } from '../store/useEffectStore';
import { AnimatePresence, motion } from 'framer-motion';
import TransformGizmoLayer from './TransformGizmoLayer';

interface AudioReactiveViewProps {
}

const AudioReactiveView: React.FC<AudioReactiveViewProps> = () => {
    const effects = useEffectStore(s => s.effects);
    const isSidebarOpen = useEffectStore(s => s.isSidebarOpen);
    const setIsSidebarOpen = useEffectStore(s => s.setIsSidebarOpen);
    const clearSelection = useEffectStore(s => s.clearSelection);
    const isUiHidden = useEffectStore(s => s.isUiHidden);
    const setIsUiHidden = useEffectStore(s => s.setIsUiHidden);
    const [isMouseIdle, setIsMouseIdle] = useState(false);

    const [isTabAudioUnsupportedModalOpen, setIsTabAudioUnsupportedModalOpen] = useState(false);
    const isTabAudioUnsupported = typeof navigator !== 'undefined' && (
        !navigator.mediaDevices?.getDisplayMedia || // Browser can't share screen at all
        !(navigator.mediaDevices.getSupportedConstraints() as any).suppressLocalAudioPlayback // Browser can't route tab audio
    );

    const requestRef = useRef<number>();
    const currentTimeLabelRef = useRef<HTMLSpanElement>(null);
    const scrubberRef = useRef<HTMLInputElement>(null);
    const effectsRef = useRef<EffectConfig[]>(effects);
    const isDraggingScrubberRef = useRef(false);
    const frameCounterRef = useRef(0);
    const audioInputRef = useRef<HTMLInputElement>(null);

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
        reactivityMapRef,
        integratedReactivityMapRef,
        audioBufferRef,
        isProcessing,
        processingProgress,
        loadAudioFromUrl,
        loadAudioFromFile,
        stopPlayback
    } = useAudioProcessor();

    const {
        isLiveMode,
        liveSourceType,
        startMic,
        startTabAudio,
        stopMic
    } = useLiveAudio();

    const {
        isLandingOpen,
        setIsLandingOpen,
        handleLandingStart,
        canvasRef,
    } = useProjectAssets({
        audioFile,
        startMic,
        startTabAudio,
        loadAudioFromUrl,
        loadAudioFromFile
    });

    const {
        isExporting,
        exportProgress,
        isExportModalOpen,
        exportResult,
        openExportModal,
        closeExportModal,
        startExport,
        cancelExport
    } = useVideoExport();

    const {
        renderFrame,
        animate,
        updateScrubberUI
    } = useRenderLoop({
        canvasRef,
        currentTimeLabelRef,
        scrubberRef,
        requestRef,
        frameCounterRef,
        isDraggingScrubberRef
    });

    const handleTogglePlay = () => {
        if (!audioFile || isLiveMode || isProcessing) return;

        analytics.playback.toggled(!isPlaying);
        togglePlay(() => {
            // Start animation loop if not already running
            !requestRef.current && (requestRef.current = requestAnimationFrame(animate));
        });
    };

    const handleScrub = (delta: number) => {
        if (!audioFile || isLiveMode || isProcessing) return;

        const time = getElapsedSeconds();
        const nextTime = Math.max(0, Math.min(duration, time + delta));
        updateScrubberUI(nextTime);
        handleSeek({ target: { value: nextTime.toString() } } as any, () => {
            !requestRef.current && (requestRef.current = requestAnimationFrame(animate));
        });
    };

    useAppShortcuts({
        onTogglePlay: handleTogglePlay,
        onScrub: handleScrub,
        onReleaseScrubber: () => { isDraggingScrubberRef.current = false; } // Fix for scrubber not releasing on pointer up/cancel
    });

    useEffect(() => {
        // Render initial imageless frame on mount
        renderFrame(0);
        return () => requestRef.current && cancelAnimationFrame(requestRef.current);
    }, []);

    // Update preview and scrubber UI when not playing (seeking while paused, audio upload)
    useEffect(() => {
        if (!isPlaying && !isLiveMode) {
            renderFrame(currentTime);
            updateScrubberUI(currentTime);
        }
    }, [effects, currentTime, isPlaying, audioFile, isLiveMode]);

    // Sync effectsRef for export
    useEffect(() => {
        effectsRef.current = effects;
    }, [effects]);

    useEffect(() => {
        if (isLiveMode && !requestRef.current) {
            // Start animation loop if not already running
            requestRef.current = requestAnimationFrame(animate);
        }
    }, [isLiveMode, animate]);

    // Handle auto-hiding the Show UI button when UI is hidden
    useEffect(() => {
        if (!isUiHidden) {
            setIsMouseIdle(false);
            return;
        }

        let timeoutId: number;

        const wakeUp = () => {
            setIsMouseIdle(false);
            window.clearTimeout(timeoutId);
            timeoutId = window.setTimeout(() => setIsMouseIdle(true), 2000);
        };

        wakeUp();

        window.addEventListener('mousemove', wakeUp);
        window.addEventListener('pointerdown', wakeUp);
        window.addEventListener('keydown', wakeUp);

        return () => {
            window.removeEventListener('mousemove', wakeUp);
            window.removeEventListener('pointerdown', wakeUp);
            window.removeEventListener('keydown', wakeUp);
            window.clearTimeout(timeoutId);
        };
    }, [isUiHidden]);

    const handleMicClick = () => {
        isLiveMode && liveSourceType === 'mic' ? stopMic() : (stopPlayback(), startMic());
    };

    const handleTabAudioClick = () => {
        if (isTabAudioUnsupported) {
            setIsTabAudioUnsupportedModalOpen(true);
            return;
        }
        isLiveMode && liveSourceType === 'tab' ? stopMic() : (stopPlayback(), startTabAudio());
    };

    const handleCanvasPointerDown = useCanvasSelection(canvasRef);

    const handleActualExport = async (options: { fps: number; resolution: number, aspectRatio?: number }) => {
        await startExport({
            options,
            audioBuffer: audioBufferRef.current,
            reactivityMap: reactivityMapRef.current,
            integratedReactivity: integratedReactivityMapRef.current,
            effects: effectsRef.current,
            duration: duration
        });
    };

    return (
        <div
            className="text-white overflow-hidden font-display leading-relaxed relative w-full"
            style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
        >
            {/* Viewport Background */}
            <div data-section="viewport" className="absolute inset-0 z-0">
                <div
                    className="relative w-full h-full overflow-hidden bg-black flex items-center justify-center group"
                    style={{ transform: 'translateZ(0)' }}
                    onPointerDown={clearSelection}
                >
                    <canvas
                        ref={canvasRef}
                        className="max-w-full max-h-full object-contain"
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            handleCanvasPointerDown(e);
                        }}
                    />
                    {!isUiHidden && <TransformGizmoLayer canvasRef={canvasRef} />}
                    {isProcessing && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-processing bg-black/80">
                            <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <div className="flex flex-col items-center gap-1">
                                <h3 className="text-xs font-bold tracking-widest text-white uppercase">Analyzing Audio</h3>
                                <p className="text-[10px] text-white uppercase tracking-[0.2em]">{processingProgress}%</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main UI Layer */}
            <div inert={isUiHidden} className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-300 ${isUiHidden ? 'opacity-0 invisible' : 'opacity-100 visible'}`}>
                {/* Top UI Overlay */}
                <div className="absolute top-0 left-0 right-0 z-navbar pointer-events-none bg-gradient-to-b from-black via-black/60 to-transparent pb-3">
                    <Navbar />
                </div>

                <MainToolbar
                    audioInputRef={audioInputRef}
                    audioFile={audioFile}
                    handleAudioUpload={handleAudioUpload}
                    isLiveMode={isLiveMode}
                    liveSourceType={liveSourceType}
                    isTabAudioUnsupported={isTabAudioUnsupported}
                    startMic={handleMicClick}
                    startTabAudio={handleTabAudioClick}
                    onPlayPause={handleTogglePlay}
                    isPlaying={isPlaying}
                    isProcessing={isProcessing}
                    onScrub={handleScrub}
                    openExportModal={openExportModal}
                    isExporting={isExporting}
                />

                {/* Bottom UI Overlay */}
                <div className="absolute bottom-0 left-0 right-0 z-footer flex flex-col pointer-events-none bg-gradient-to-t from-black via-black/80 to-transparent pt-3">
                    <div className="w-full">
                        {!isLiveMode ? (
                            <div className="h-14 bg-transparent flex items-center shrink-0 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <PlaybackBar
                                    audioFile={audioFile}
                                    isProcessing={isProcessing}
                                    formatTime={formatTime}
                                    currentTime={currentTime}
                                    duration={duration}
                                    currentTimeLabelRef={currentTimeLabelRef}
                                    scrubberRef={scrubberRef}
                                    isDraggingScrubberRef={isDraggingScrubberRef}
                                    onScrubberChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        updateScrubberUI(val);
                                        handleSeek(e, () => {
                                            !requestRef.current && (requestRef.current = requestAnimationFrame(animate));
                                        });
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="h-14 bg-transparent flex items-center justify-center shrink-0 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center gap-3 text-red-500">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                    <span className="text-xs font-medium tracking-widest uppercase">Live Audio</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="w-full">
                        <Footer />
                    </div>
                </div>

                {/* Sidebar: Effects Rack & Parameters */}
                <aside
                    inert={!isSidebarOpen}
                    className={`pointer-events-auto fixed inset-y-0 right-0 z-sidebar w-full sm:w-[360px] bg-slate-900/90 flex flex-col overflow-hidden shrink-0 transition-transform duration-500 ease-in-out shadow-[-20px_0_50px_rgba(0,0,0,0.5)] will-change-transform ${isSidebarOpen ? 'translate-x-0 visible' : 'translate-x-full invisible'}`}
                >
                    {/* Inner wrapper */}
                    <div data-section="sidebar" className="flex-1 flex flex-col min-h-0 relative">
                        <SidebarNavigation onClose={() => setIsSidebarOpen(false)} />
                    </div>
                </aside>

                {/* Mobile Backdrop */}
                {isSidebarOpen && (
                    <div
                        onClick={() => setIsSidebarOpen(false)}
                        className="pointer-events-auto fixed inset-0 bg-black/80 z-mobilebackdrop lg:hidden animate-in fade-in duration-300"
                    />
                )}

                <InspectorWindow />
                <LibraryWindow />
            </div>

            <AnimatePresence>
                {isLandingOpen && (
                    <LandingModal
                        onStart={handleLandingStart}
                        onClose={() => setIsLandingOpen(false)}
                        isTabAudioUnsupported={isTabAudioUnsupported}
                        openTabAudioUnsupportedModal={() => setIsTabAudioUnsupportedModalOpen(true)}
                    />
                )}
            </AnimatePresence>
            <TabAudioUnsupportedModal
                isOpen={isTabAudioUnsupportedModalOpen}
                onClose={() => setIsTabAudioUnsupportedModalOpen(false)}
            />
            <ExportModal
                isOpen={isExportModalOpen}
                onClose={closeExportModal}
                onExport={handleActualExport}
                onCancelExport={cancelExport}
                isExporting={isExporting}
                exportProgress={exportProgress}
                exportResult={exportResult}
                aspectRatio={window.innerWidth / window.innerHeight}
            />

            <AnimatePresence>
                {(isUiHidden && !isMouseIdle) && (
                    <motion.button
                        id="show-ui-btn"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => setIsUiHidden(false)}
                        tabIndex={0}
                        className="fixed top-4 right-4 z-fab p-3 bg-slate-900/90 text-white/80 hover:text-white rounded-xl border border-white/5 transition-all duration-300 cursor-pointer flex items-center justify-center group shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                        title="Show UI (H, Tab, or Esc)"
                    >
                        <span className="material-symbols-outlined text-xl group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">visibility</span>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AudioReactiveView;
