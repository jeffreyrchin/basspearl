import React, { useState, useRef, useEffect } from 'react';
import { EffectConfig } from '../types';
import { mainGlitchEngine } from '../services/glitchEngine';
import SidebarNavigation, { SidebarView } from './SidebarNavigation';
import PlaybackBar from './PlaybackBar';
import Navbar from './Navbar';
import MainToolbar from './MainToolbar';
import { Footer } from './Footer';
import { Preset } from '@/constants';
import { useAudioProcessor } from '@/hooks/useAudioProcessor';
import { exportVideo } from '@/services/exportService';
import { analytics } from '@/services/analytics';
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
        setIsProcessing,
        loadAudioFromUrl
    } = useAudioProcessor();

    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const effects = useEffectStore(s => s.effects);
    const setEffects = useEffectStore(s => s.setEffects);
    const [sidebarVisible, setSidebarVisible] = useState(false); // Default to hidden
    const [sidebarView, setSidebarView] = useState<SidebarView>('pipeline');

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

    // Sync ref with store state (Direct update during render)
    useEffect(() => {
        effectsRef.current = effects;
    }, [effects]);

    // Fix for scrubber not releasing on pointer up/cancel
    useEffect(() => {
        const handleUp = () => { isDraggingScrubberRef.current = false; };
        window.addEventListener('pointerup', handleUp);
        window.addEventListener('pointercancel', handleUp);
        return () => {
            window.removeEventListener('pointerup', handleUp);
            window.removeEventListener('pointercancel', handleUp);
        }
    }, []);

    const loadPreset = async (preset: Preset) => {
        setIsProcessing(true);
        analytics.preset.started(preset.id);
        try {
            let imageUrl: string | null = null;
            if (preset.image) {
                // 1. Load Image
                const response = await fetch(preset.image);
                const blob = await response.blob();
                const file = new File([blob], preset.label, { type: 'image/jpeg' });
                setImageFile(file);
                imageUrl = URL.createObjectURL(blob);
            }

            imageFileRef.current = imageUrl;

            // 2. Load Audio
            await loadAudioFromUrl(preset.audio, preset.label);

            // 3. Load Effects (Replace current rack with preset effects)
            const presetEffects = preset.effects.map(e => ({
                ...e,
                muted: e.muted ?? false,
                soloed: e.soloed ?? false
            }));

            setEffects(presetEffects);

            // Render initial frame
            if (canvasRef.current) {
                mainGlitchEngine.renderToCanvas(canvasRef.current, imageUrl, presetEffects, { maxSize: 1920 });
            }
            analytics.preset.succeeded(preset.id);
        } catch (err: any) {
            analytics.preset.failed(preset.id, err);
            console.error('Error loading preset:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        // Render initial imageless frame on mount
        renderFrame(0);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

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
            scrubberRef.current.style.background = `linear-gradient(to right, #fb00ff 0%, #fb00ff ${percent}%, rgba(255, 255, 255, 0.1) ${percent}%, rgba(255, 255, 255, 0.1) 100%)`;
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

    const handleExport = async () => {
        if (!reactivityMapRef.current || !audioBufferRef.current) return;

        setIsExporting(true);
        setExportProgress(0);

        try {
            analytics.export.started();
            await exportVideo({
                audioBuffer: audioBufferRef.current,
                reactivityMap: reactivityMapRef.current,
                integratedReactivity: integratedReactivityMapRef.current,
                imageSrc: imageFileRef.current,
                effects: effects,
                duration: duration,
                fps: 60,
                maxSize: 1920,
                onProgress: (p) => setExportProgress(p)
            });
            analytics.export.succeeded(effects);
        } catch (err: any) {
            analytics.export.failed(err);
            console.error("Export failed:", err);
            alert("Export failed. See console for details.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="h-screen text-white flex flex-col overflow-hidden font-display leading-relaxed">
            <Navbar />
            <div className="flex-1 flex flex-row min-h-0 overflow-hidden relative">
                {/* Main Content Area */}
                <main className={`flex-1 flex flex-col min-h-0 min-w-0 transition-all duration-500 ease-in-out ${sidebarVisible ? 'lg:mr-0' : ''}`}>
                    <MainToolbar
                        isProcessing={isProcessing}
                        loadPreset={loadPreset}
                        imageInputRef={imageInputRef}
                        audioInputRef={audioInputRef}
                        imageFile={imageFile}
                        audioFile={audioFile}
                        handleImageUpload={handleImageUpload}
                        handleAudioUpload={handleAudioUpload}
                        sidebarVisible={sidebarVisible}
                        setSidebarVisible={setSidebarVisible}
                        sidebarView={sidebarView}
                        setSidebarView={setSidebarView}
                    />

                    {/* Viewport */}
                    <div className="flex-1 flex items-center justify-center min-h-0 relative group">
                        {/* Mobile Floating Toggle */}
                        {!sidebarVisible && (
                            <button
                                onClick={() => setSidebarVisible(true)}
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
                                        <p className="text-[9px] text-white/40 uppercase tracking-[0.2em]">Synchronizing frequencies</p>
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
                            onPlayPause={() => {
                                analytics.playback.toggled(!isPlaying);
                                togglePlay(() => {
                                    // Start animation loop if not already running
                                    if (!requestRef.current) {
                                        requestRef.current = requestAnimationFrame(animate);
                                    }
                                });
                            }}
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
                                className={`h-9 px-3 sm:px-4 rounded-xl flex items-center transition-all border ${isExporting || isProcessing ? 'bg-white/5 border-white/5 text-white/40 cursor-wait' : 'bg-[#FB00FF]/10 border-[#FB00FF]/20 text-[#FB00FF] hover:bg-[#FB00FF]/20 hover:border-[#FB00FF]/40 shadow-[0_0_15px_rgba(251,0,251,0.1)]'}`}
                                title="Export"
                                aria-label="Export">
                                <span className={`material-symbols-outlined text-[18px] ${isExporting ? 'animate-spin' : ''}`}>
                                    {isExporting ? 'autorenew' : 'download'}
                                </span>
                                <span className="text-[9px] font-bold uppercase tracking-widest leading-none">
                                    {isExporting &&
                                        <>
                                            <span className="pl-2 hidden md:inline">Exporting </span>
                                            <span className="md:pl-0 pl-1">{`${Math.round(exportProgress * 100)}%`}</span>
                                        </>
                                    }
                                </span>
                            </button>
                        </div>
                    </div>
                </main>

                {/* Sidebar: Effects Rack & Parameters */}
                <aside
                    className={`fixed inset-y-0 right-0 z-[60] lg:relative w-full sm:w-[400px] border-l border-white/5 bg-[#050B14] flex flex-col overflow-hidden shrink-0 transition-transform duration-500 ease-in-out shadow-[-20px_0_50px_rgba(0,0,0,0.5)] lg:shadow-none will-change-transform ${sidebarVisible ? 'translate-x-0' : 'translate-x-full lg:hidden'}`}>
                    {/* Inner wrapper */}
                    <div className="flex-1 flex flex-col min-h-0 relative">
                        <SidebarNavigation
                            view={sidebarView}
                            onViewChange={setSidebarView}
                            onClose={() => setSidebarVisible(false)} />
                    </div>
                </aside>

                {/* Mobile Backdrop */}
                {sidebarVisible && (
                    <div
                        onClick={() => setSidebarVisible(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden animate-in fade-in duration-300"
                    />
                )}
            </div>
            <Footer />
        </div>
    );
};

export default AudioReactiveView;
