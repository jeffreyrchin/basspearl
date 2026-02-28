import React, { useState, useRef, useEffect } from 'react';
import { EffectConfig } from '../types';
import { glitchEngine } from '../services/glitchEngine';
import SidebarNavigation from './SidebarNavigation';
import Navbar from './Navbar';
import { Footer } from './Footer';
import { Preset, PRESETS } from '@/constants';
import { mapReactivityToEffects } from '@/services/calculateReactiveEffects';
import { useAudioProcessor } from '@/hooks/useAudioProcessor';
import { exportVideo } from '@/services/exportService';
import { analytics } from '@/services/analytics';
import { useEffectStore } from '../store/useEffectStore';

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
    const { effects, setEffects } = useEffectStore();
    const [sidebarVisible, setSidebarVisible] = useState(false); // Default to hidden

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    const currentTimeLabelRef = useRef<HTMLSpanElement>(null);
    const scrubberRef = useRef<HTMLInputElement>(null);
    const effectsRef = useRef<EffectConfig[]>(effects);
    const imageFileRef = useRef<string | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);

    // Sync ref with store state (Direct update during render)
    useEffect(() => {
        effectsRef.current = effects;
    }, [effects]);

    const loadPreset = async (preset: Preset) => {
        setIsProcessing(true);
        analytics.preset.started(preset.id);
        try {
            // 1. Load Image
            const response = await fetch(preset.image);
            const blob = await response.blob();
            const file = new File([blob], preset.label, { type: 'image/jpeg' });
            setImageFile(file);
            const imageUrl = URL.createObjectURL(blob);
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
                glitchEngine.renderToCanvas(canvasRef.current, imageUrl, presetEffects, { maxSize: 1920 });
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
                        glitchEngine.renderToCanvas(
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
        const currentFrame = Math.floor(time * 60);
        let reactiveEffects = effectsRef.current;
        let frameIntegrated: { sub: number, bass: number, mid: number, treble: number } | undefined;

        // 1. Get Instantaneous Reactivity for standard effects
        if (reactivityMapRef.current) {
            const map = reactivityMapRef.current;
            const frame = Math.min(map.bass.length - 1, currentFrame); // Ensures frame <= last valid FFT frame index
            const smoothed = {
                sub: map.sub[frame],
                bass: map.bass[frame],
                mid: map.mid[frame],
                treble: map.treble[frame]
            };
            reactiveEffects = mapReactivityToEffects(smoothed, effectsRef.current, currentFrame);

            // Broadcast to CSS for UI elements (AdaptiveSlider)
            document.documentElement.style.setProperty('--audio-sub', smoothed.sub.toString());
            document.documentElement.style.setProperty('--audio-bass', smoothed.bass.toString());
            document.documentElement.style.setProperty('--audio-mid', smoothed.mid.toString());
            document.documentElement.style.setProperty('--audio-treble', smoothed.treble.toString());
        }

        // 2. Get Integrated Reactivity for time-based/motion effects (Starfield)
        // This ensures 100% deterministic motion that supports seeking
        if (integratedReactivityMapRef.current) {
            const iMap = integratedReactivityMapRef.current;
            const frame = Math.min(iMap.bass.length - 1, currentFrame);
            frameIntegrated = {
                sub: iMap.sub[frame],
                bass: iMap.bass[frame],
                mid: iMap.mid[frame],
                treble: iMap.treble[frame]
            };
        }

        await glitchEngine.renderToCanvas(
            canvasRef.current,
            imageFileRef.current,
            reactiveEffects,
            {
                maxSize: 1920,
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
        updateScrubberUI(elapsed);
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
        <div className="h-screen bg-[#050B14] text-white flex flex-col overflow-hidden font-display leading-relaxed">
            <Navbar />
            <div className="flex-1 flex flex-row min-h-0 overflow-hidden relative">
                {/* Main Content Area */}
                <main className={`flex-1 flex flex-col min-h-0 min-w-0 bg-[#050B14] transition-all duration-500 ease-in-out ${sidebarVisible ? 'lg:mr-0' : ''}`}>
                    {/* Source Header: Preset loading and local asset uploading */}
                    <div className="h-14 border-b border-white/5 bg-black/20 flex items-center justify-between lg:justify-center px-6 gap-4 shrink-0 overflow-x-auto no-scrollbar">
                        {/* Presets Group */}
                        <div className="flex items-center gap-2 border-r border-white/10 pr-4 mr-2 shrink-0">
                            {PRESETS.map(preset => (
                                <button
                                    key={preset.id}
                                    onClick={() => loadPreset(preset)}
                                    disabled={isProcessing}
                                    title={`Load ${preset.label} preset`}
                                    aria-label={`Load ${preset.label} preset`}
                                    className="h-8 px-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-[9px] font-bold uppercase tracking-widest disabled:opacity-30"
                                >
                                    {preset.label.split(' ')[0]}
                                </button>
                            ))}
                        </div>

                        {/* Local Assets Group */}
                        <div className="flex items-center gap-3 shrink-0">
                            {/* Choose Image */}
                            <input
                                ref={imageInputRef}
                                id="image-file-input"
                                type="file"
                                accept="image/*, .jpg, .jpeg, .png, .webp, .heic"
                                onClick={(e) => { (e.target as HTMLInputElement).value = ''; }} // Clear input so onChange always fires
                                onChange={handleImageUpload}
                                className="sr-only"
                                aria-label="Image file input" />
                            <button
                                type="button"
                                onClick={() => imageInputRef.current?.click()}
                                className={`h-9 px-4 rounded-xl border transition-all duration-300 flex items-center gap-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00F0FF] text-white ${imageFile ? "border-[#00F0FF]/30 bg-[#00F0FF]/5" : "border-white/5 bg-white/[0.03] hover:border-white/20"}`}
                                aria-label="Choose image button">
                                <span className={`material-symbols-outlined text-base ${imageFile ? "text-[#00F0FF]" : "text-white"}`}>image</span>
                                <span className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-2">
                                    <span>
                                        <span className="hidden sm:inline">Choose </span>Image
                                    </span>
                                    {imageFile && <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.8)]" />}
                                </span>
                            </button>

                            {/* Choose Audio */}
                            <input
                                ref={audioInputRef}
                                id="audio-file-input"
                                type="file"
                                accept="audio/*, .mp3, .wav, .m4a, .aac, .ogg"
                                onClick={(e) => { (e.target as HTMLInputElement).value = ''; }} // Clear input so onChange always fires
                                onChange={handleAudioUpload}
                                className="sr-only"
                                aria-label="Audio file input" />
                            <button
                                type="button"
                                onClick={() => audioInputRef.current?.click()}
                                className={`h-9 px-4 rounded-xl border transition-all duration-300 flex items-center gap-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-white ${audioFile ? 'border-[#3B82F6]/30 bg-[#3B82F6]/5' : 'border-white/5 bg-white/[0.03] hover:border-white/20'}`}
                                aria-label="Choose audio button">
                                <span className={`material-symbols-outlined text-base ${audioFile ? "text-[#3B82F6]" : "text-white"}`}>graphic_eq</span>
                                <span className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-2">
                                    <span>
                                        <span className="hidden sm:inline">Choose </span>Audio
                                    </span>
                                    {audioFile && <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] shadow-[0_0_8px_rgba(59,130,246,0.8)]" />}
                                </span>
                            </button>
                        </div>

                        {/* Sidebar Toggle (Desktop only in header) */}
                        <button
                            onClick={() => setSidebarVisible(!sidebarVisible)}
                            className={`hidden lg:flex h-9 w-9 items-center justify-center rounded-xl border transition-all ml-4 ${sidebarVisible ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                            title={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
                            aria-label={sidebarVisible ? "Hide sidebar" : "Show sidebar"}>
                            <span className="material-symbols-outlined text-base">tune</span>
                        </button>
                    </div>

                    {/* Viewport */}
                    <div className="flex-1 flex items-center justify-center min-h-0 relative group" aria-label="Viewport">
                        {/* Mobile Floating Toggle */}
                        {!sidebarVisible && (
                            <button
                                onClick={() => setSidebarVisible(true)}
                                className="absolute top-6 right-6 z-20 w-12 h-12 rounded-2xl bg-black/90 border border-[#FB00FF]/40 text-white shadow-[0_0_30px_rgba(0,0,0,0.5),0_0_15px_rgba(251,0,255,0.2)] flex items-center justify-center lg:hidden animate-in fade-in zoom-in duration-300 active:scale-90 hover:bg-black transition-all"
                                aria-label="Show sidebar">
                                <span className="material-symbols-outlined text-2xl">tune</span>
                            </button>
                        )}

                        <div className="relative w-full h-full overflow-hidden bg-black/40 shadow-2xl flex items-center justify-center">
                            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
                            {isProcessing && (
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300 z-10 backdrop-blur-sm">
                                    <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                    <div className="flex flex-col items-center gap-1">
                                        <h3 className="text-xs font-bold tracking-widest text-white uppercase">Analyzing Audio</h3>
                                        <p className="text-[9px] text-white/40 uppercase tracking-[0.2em]">Synchronizing frequencies</p>
                                    </div>
                                </div>
                            )}
                            {!imageFile && !audioFile && !isProcessing && (
                                <div className="absolute bottom-8 left-8 z-10 flex flex-col items-start gap-4 p-6 text-left max-w-xs bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 animate-in slide-in-from-bottom-4 fade-in duration-700">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60 border border-white/10">
                                        <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-sm font-bold tracking-tight text-white uppercase tracking-[0.2em]">Ready to Animate</h2>
                                        <p className="text-[9px] text-white/60 uppercase tracking-widest leading-relaxed">
                                            Choose audio or select one of the presets above to begin animating.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Playback Bar */}
                    <div className="h-14 bg-black/20 border-t border-white/5 flex items-center px-3 sm:px-6 gap-2 sm:gap-4 shrink-0 overflow-hidden">
                        {/* Play/Pause */}
                        <button
                            onClick={() => {
                                analytics.playback.toggled(!isPlaying);
                                togglePlay(() => {
                                    // Start animation loop if not already running
                                    if (!requestRef.current) {
                                        requestRef.current = requestAnimationFrame(animate);
                                    }
                                })
                            }}
                            disabled={!audioFile || isProcessing}
                            aria-label={isPlaying ? "Pause audio" : "Play audio"}
                            className={`w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl flex items-center justify-center transition-all border ${isPlaying ? 'bg-primary/20 border-primary/40 shadow-[inset_0_0_10px_rgba(59,130,246,0.2)] text-primary' : (isProcessing ? 'bg-white/5 border-white/5 text-white/20 cursor-not-allowed' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white')}`}>
                            <span className="material-symbols-outlined text-[18px] sm:text-[20px] fill">{isPlaying ? 'pause' : 'play_arrow'}</span>
                        </button>

                        {/* Current Time */}
                        <span
                            ref={currentTimeLabelRef}
                            className="text-[9px] sm:text-[10px] font-mono text-white/60 shrink-0 w-7 sm:w-8"
                            aria-label="Current playback time">
                            {formatTime(currentTime)}
                        </span>

                        {/* Scrubber */}
                        <input
                            ref={scrubberRef}
                            type="range"
                            min={0}
                            max={duration || 0}
                            step={0.1}
                            value={currentTime}
                            onChange={(e) => handleSeek(e, () => {
                                if (!requestRef.current) {
                                    requestRef.current = requestAnimationFrame(animate);
                                }
                            })}
                            disabled={!audioFile || isProcessing}
                            aria-label="Seek audio"
                            className={`flex-1 h-[3px] min-w-0 rounded-full appearance-none bg-white/10 accent-white focus:outline-none transition-all ${isProcessing ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`} />

                        {/* Duration */}
                        <span className="text-[9px] sm:text-[10px] font-mono text-white/60 shrink-0 w-7 sm:w-8" aria-label="Total duration">
                            {formatTime(duration)}
                        </span>

                        {/* Export Button */}
                        <div className="flex items-center gap-1 sm:gap-2 pl-2 sm:pl-4 border-l border-white/10 ml-1 sm:ml-2">
                            <button
                                onClick={handleExport}
                                disabled={!audioFile || isExporting || isProcessing}
                                className={`h-9 px-3 sm:px-4 rounded-xl flex items-center gap-2 transition-all border ${isExporting || isProcessing ? 'bg-white/5 border-white/5 text-white/40 cursor-wait' : 'bg-[#FB00FF]/10 border-[#FB00FF]/20 text-[#FB00FF] hover:bg-[#FB00FF]/20 hover:border-[#FB00FF]/40 shadow-[0_0_15px_rgba(251,0,251,0.1)]'}`}
                                aria-label="Export video">
                                <span className={`material-symbols-outlined text-[18px] ${isExporting ? 'animate-spin' : ''}`}>
                                    {isExporting ? 'autorenew' : 'download'}
                                </span>
                                <span className="text-[9px] font-bold uppercase tracking-widest leading-none">
                                    {isExporting ? (
                                        <>
                                            <span className="hidden md:inline">Exporting </span>
                                            {`${Math.round(exportProgress * 100)}%`}
                                        </>
                                    ) : (
                                        <span>Export<span className="hidden sm:inline"> Video</span></span>
                                    )}
                                </span>
                            </button>
                        </div>
                    </div>
                </main>

                {/* Sidebar: Effects Rack & Parameters */}
                <aside className={`fixed inset-y-0 right-0 z-[60] lg:relative w-full sm:w-[400px] border-l border-white/5 bg-[#050B14] flex flex-col overflow-hidden shrink-0 transition-transform duration-500 ease-in-out shadow-[-20px_0_50px_rgba(0,0,0,0.5)] lg:shadow-none ${sidebarVisible ? 'translate-x-0' : 'translate-x-full lg:hidden'}`}>
                    {/* Inner wrapper */}
                    <div className="flex-1 flex flex-col min-h-0 relative">
                        <SidebarNavigation
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
