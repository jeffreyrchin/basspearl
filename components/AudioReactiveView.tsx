import React, { useRef, useEffect } from 'react';
import { EffectConfig } from '../types';
import SidebarNavigation from './SidebarNavigation';
import PlaybackBar from './PlaybackBar';
import Navbar from './Navbar';
import MainToolbar from './MainToolbar';
import ExportModal from './ExportModal';
import LandingModal from './LandingModal';
import InspectorWindow from './InspectorWindow';
import LibraryWindow from './LibraryWindow';
import { Footer } from './Footer';
import { analytics } from '@/services/analytics';
import { useAudioProcessor } from '@/hooks/useAudioProcessor';
import { useLiveAudio } from '@/hooks/useLiveAudio';
import { useAppShortcuts } from '@/hooks/useAppShortcuts';
import { useVideoExport } from '@/hooks/useVideoExport';
import { useProjectAssets } from '@/hooks/useProjectAssets';
import { useRenderLoop } from '@/hooks/useRenderLoop';
import { useEffectStore } from '../store/useEffectStore';

interface AudioReactiveViewProps {
}

const AudioReactiveView: React.FC<AudioReactiveViewProps> = () => {
    const effects = useEffectStore(s => s.effects);
    const isSidebarOpen = useEffectStore(s => s.isSidebarOpen);
    const setIsSidebarOpen = useEffectStore(s => s.setIsSidebarOpen);

    const requestRef = useRef<number>();
    const currentTimeLabelRef = useRef<HTMLSpanElement>(null);
    const scrubberRef = useRef<HTMLInputElement>(null);
    const effectsRef = useRef<EffectConfig[]>(effects);
    const isDraggingScrubberRef = useRef(false);
    const frameCounterRef = useRef(0);
    const isLiveModeRef = useRef(false);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

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
        loadAudioFromFile,
        stopPlayback
    } = useAudioProcessor();

    const {
        isLandingOpen,
        setIsLandingOpen,
        imageFile,
        handleLandingStart,
        handleImageUpload,
        canvasRef,
        imageFileRef
    } = useProjectAssets({
        audioFile,
        loadAudioFromUrl,
        loadAudioFromFile
    });

    const {
        isLiveMode,
        startMic,
        stopMic,
        getLiveReactivity
    } = useLiveAudio();

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
        imageFileRef,
        effectsRef,
        reactivityMapRef,
        integratedReactivityMapRef,
        isDraggingScrubberRef,
        isPlayingRef,
        isLiveModeRef,
        duration,
        formatTime,
        getElapsedSeconds,
        isLiveMode,
        getLiveReactivity
    });

    // Sync refs with store state (Direct update during render)
    useEffect(() => {
        effectsRef.current = effects;
    }, [effects]);

    useEffect(() => {
        isLiveModeRef.current = isLiveMode;
        if (isLiveMode && !requestRef.current) {
            // Start animation loop if not already running
            requestRef.current = requestAnimationFrame(animate);
        }
    }, [isLiveMode, animate, requestRef]);

    useAppShortcuts({
        onTogglePlay: () => handleTogglePlay(),
        onScrub: (delta: number) => {
            if (!audioFile || isLiveMode || isProcessing) return;
            const time = getElapsedSeconds();
            const nextTime = Math.max(0, Math.min(duration, time + delta));
            updateScrubberUI(nextTime);
            handleSeek({ target: { value: nextTime.toString() } } as any, () => {
                if (!requestRef.current) requestRef.current = requestAnimationFrame(animate);
            });
        },
        onReleaseScrubber: () => { isDraggingScrubberRef.current = false; } // Fix for scrubber not releasing on pointer up/cancel
    });

    useEffect(() => {
        // Render initial imageless frame on mount
        renderFrame(0);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    // Update preview and scrubber UI when not playing (seeking while paused, audio upload)
    useEffect(() => {
        if (!isPlaying && !isLiveMode) {
            renderFrame(currentTime);
            updateScrubberUI(currentTime);
        }
    }, [effects, imageFile, currentTime, isPlaying, audioFile, duration, isLiveMode]);

    const handleMicClick = () => {
        isLiveMode ? stopMic() : (stopPlayback(), startMic());
    };

    const handleTogglePlay = () => {
        if (!audioFile || isLiveMode || isProcessing) return;

        analytics.playback.toggled(!isPlaying);
        togglePlay(() => {
            // Start animation loop if not already running
            !requestRef.current && (requestRef.current = requestAnimationFrame(animate));
        });
    };

    const handleActualExport = async (options: { fps: number; resolution: number }) => {
        await startExport({
            options,
            audioBuffer: audioBufferRef.current,
            reactivityMap: reactivityMapRef.current,
            integratedReactivity: integratedReactivityMapRef.current,
            imageSrc: imageFileRef.current,
            effects: effectsRef.current,
            duration: duration
        });
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
                        isLiveMode={isLiveMode}
                        startMic={handleMicClick}
                    />

                    {/* Viewport */}
                    <div className="flex-1 flex items-center justify-center min-h-0 relative group">
                        {/* Mobile Floating Toggle */}
                        {!isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="absolute top-6 right-6 z-fab w-12 h-12 rounded-2xl bg-black/90 border border-[#FB00FF]/40 text-white shadow-[0_0_30px_rgba(0,0,0,0.5),0_0_15px_rgba(251,0,255,0.2)] flex items-center justify-center lg:hidden animate-in fade-in zoom-in duration-300 active:scale-90 hover:bg-black transition-all"
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
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300 z-processing backdrop-blur-sm">
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
                    {!isLiveMode ? (
                        <div className="h-14 bg-white/5 border-t border-white/5 flex items-center pr-3 sm:pr-6 shrink-0 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                                    onClick={openExportModal}
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
                    ) : (
                        <div className="h-14 bg-red-500/5 border-t border-red-500/20 flex items-center justify-center shrink-0 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center gap-3 text-red-500">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                <span className="text-xs font-medium tracking-widest uppercase">Live Audio</span>
                            </div>
                        </div>
                    )}
                </main>

                {/* Sidebar: Effects Rack & Parameters */}
                <aside
                    className={`fixed inset-y-0 right-0 z-sidebar lg:relative w-full sm:w-[400px] border-l border-white/5 bg-[#050B14] flex flex-col overflow-hidden shrink-0 transition-transform duration-500 ease-in-out shadow-[-20px_0_50px_rgba(0,0,0,0.5)] lg:shadow-none will-change-transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:hidden'}`}>
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-mobilebackdrop lg:hidden animate-in fade-in duration-300"
                    />
                )}
            </div>
            <Footer />
            <LandingModal isOpen={isLandingOpen} onStart={handleLandingStart} onClose={() => setIsLandingOpen(false)} />
            <ExportModal
                isOpen={isExportModalOpen}
                onClose={closeExportModal}
                onExport={handleActualExport}
                onCancelExport={cancelExport}
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
