import React, { useState, useRef, useEffect } from 'react';
import { EffectConfig } from '../types';
import { glitchEngine } from '../services/glitchEngine';
import SidebarNavigation from './SidebarNavigation';
import Navbar from './Navbar';
import { Footer } from './Footer';
import { INITIAL_REACTIVE_EFFECTS } from '@/constants';
import { mapReactivityToEffects } from '@/services/calculateReactiveEffects';
import { useAudioProcessor } from '@/hooks/useAudioProcessor';

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
        reactivityMapRef
    } = useAudioProcessor();

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [effects, setEffects] = useState<EffectConfig[]>(INITIAL_REACTIVE_EFFECTS);
    const [selectedEffectIndex, setSelectedEffectIndex] = useState(0);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    const currentTimeLabelRef = useRef<HTMLSpanElement>(null);
    const scrubberRef = useRef<HTMLInputElement>(null);
    const effectsRef = useRef<EffectConfig[]>(effects);
    const imageFileRef = useRef<string | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);

    // Sync ref with state (Direct update during render)
    effectsRef.current = effects;

    useEffect(() => {
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const imageBlob = URL.createObjectURL(file);
            imageFileRef.current = imageBlob; // Store the URL string for the animation loop

            // Show initial preview
            if (canvasRef.current) {
                glitchEngine.renderToCanvas(
                    canvasRef.current,
                    imageBlob,
                    effects,
                    false,
                    960
                );
            }
        }
    };

    const renderFrame = async (time: number) => {
        if (!imageFileRef.current || !canvasRef.current) return;
        const currentFrame = Math.floor(time * 60);
        let reactiveEffects = effectsRef.current;

        if (reactivityMapRef.current) {
            const map = reactivityMapRef.current;
            const frame = Math.min(map.bass.length - 1, currentFrame); // Ensures frame <= last valid FFT frame index
            const smoothed = {
                bass: map.bass[frame], mid: map.mid[frame],
                treble: map.treble[frame], energy: map.energy[frame]
            };
            reactiveEffects = mapReactivityToEffects(smoothed, effectsRef.current, currentFrame);
        }

        await glitchEngine.renderToCanvas(canvasRef.current, imageFileRef.current, reactiveEffects, false, 960);
    };

    const animate = async () => {
        if (!isPlayingRef.current) {
            requestRef.current = undefined;
            return;
        }

        const elapsed = Math.min(getElapsedSeconds(), duration);

        if (currentTimeLabelRef.current) currentTimeLabelRef.current.innerText = formatTime(elapsed);
        if (scrubberRef.current && duration > 0) {
            const val = elapsed.toString(); // Current playback time as a string
            if (scrubberRef.current.value !== val) {
                scrubberRef.current.value = val;
                const percent = (elapsed / duration) * 100;
                scrubberRef.current.style.background = `linear-gradient(to right, #fb00ff 0%, #fb00ff ${percent}%, rgba(255, 255, 255, 0.1) ${percent}%, rgba(255, 255, 255, 0.1) 100%)`;
            }
        }

        await renderFrame(elapsed);
        requestRef.current = requestAnimationFrame(animate); // Keep animation loop going even if no image or canvas
    };

    // Update preview when state changes while paused
    useEffect(() => {
        if (!isPlaying) renderFrame(currentTime);
    }, [effects, imageFile, currentTime, isPlaying]);

    // Calculate for static renders (Seek, Pause)
    const scrubberPercent = duration ? (currentTime / duration) * 100 : 0;

    return (
        <div className="h-screen bg-[#050B14] text-white flex flex-col overflow-hidden font-display leading-relaxed">
            <Navbar editorView={true} />
            <div className="flex-1 flex flex-row min-h-0 overflow-hidden relative">
                {/* Main Content Area */}
                <main className="flex-1 flex flex-col min-h-0 min-w-0 bg-[#050B14]">
                    {/* Source Header: Quick-load controls centered above image */}
                    <div className="h-14 border-b border-white/5 bg-black/20 flex items-center justify-center px-6 gap-3 shrink-0">
                        {/* Choose Image */}
                        <input
                            ref={imageInputRef}
                            id="image-file-input"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="sr-only"
                            aria-label="Image file input"
                        />
                        <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className={`h-9 px-4 rounded-xl border transition-all duration-300 flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-[#00F0FF] ${imageFile ? "border-[#00F0FF]/30 bg-[#00F0FF]/5 text-[#00F0FF]" : "border-white/5 bg-white/[0.03] text-white hover:border-white/20"}`}
                            aria-label="Choose image button">
                            <span className="material-symbols-outlined text-base">image</span>
                            <span className="text-[9px] font-bold uppercase tracking-widest truncate max-w-[120px]">
                                {imageFile ? imageFile.name || "Image File" : "Choose Image"}
                            </span>
                        </button>

                        {/* Choose Audio */}
                        <input
                            ref={audioInputRef}
                            id="audio-file-input"
                            type="file"
                            accept="audio/*"
                            onChange={handleAudioUpload}
                            className="sr-only"
                            aria-label="Audio file input"
                        />
                        <button
                            type="button"
                            onClick={() => audioInputRef.current?.click()}
                            className={`h-9 px-4 rounded-xl border transition-all duration-300 flex items-center gap-3 cursor-pointer ${audioFile ? 'border-[#3B82F6]/30 bg-[#3B82F6]/5 text-[#3B82F6]' : 'border-white/5 bg-white/[0.03] text-white hover:border-white/20'}`}
                            aria-label="Choose audio button">
                            <span className="material-symbols-outlined text-base">graphic_eq</span>
                            <span className="text-[9px] font-bold uppercase tracking-widest truncate max-w-[120px]">
                                {audioFile ? audioFile.name || "Audio File" : "Choose Audio"}
                            </span>
                        </button>
                    </div>

                    {/* Viewport */}
                    <div className="flex-1 flex items-center justify-center min-h-0 relative" aria-label="Viewport">
                        <div className="relative w-full h-full overflow-hidden bg-black/40 shadow-2xl flex items-center justify-center">
                            <canvas
                                ref={canvasRef}
                                className={`max-w-full max-h-full object-contain ${!imageFile ? 'hidden' : ''}`}
                            />
                            {!imageFile && (
                                <div className="flex flex-col items-center gap-6 p-8 text-center max-w-md">
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-white/60 border border-white/20">
                                        <span className="material-symbols-outlined text-4xl">stream</span>
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-lg font-bold tracking-tight text-white uppercase tracking-[0.2em]">Upload Image and Audio</h2>
                                        <p className="text-[9px] text-white/60 uppercase tracking-widest">Awaiting local assets for initialization</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Playback Bar */}
                    <div className="h-14 bg-black/20 border-t border-white/5 flex items-center px-6 gap-4 shrink-0">
                        {/* Play/Pause */}
                        <button
                            onClick={() => togglePlay(() => {
                                // Start animation loop if not already running
                                if (!requestRef.current) {
                                    requestRef.current = requestAnimationFrame(animate);
                                }
                            })}
                            disabled={!imageFile || !audioFile}
                            aria-label={isPlaying ? "Pause audio" : "Play audio"}
                            className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-all border ${isPlaying ? 'bg-primary/20 border-primary/40 shadow-[inset_0_0_10px_rgba(59,130,246,0.2)] text-primary' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'}`}>
                            <span className="material-symbols-outlined text-[20px] fill">{isPlaying ? 'pause' : 'play_arrow'}</span>
                        </button>

                        {/* Current Time */}
                        <span
                            ref={currentTimeLabelRef}
                            className="text-[10px] font-mono text-white/60 shrink-0 w-8"
                            aria-label="Current playback time"
                        >
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
                            disabled={!audioFile}
                            aria-label="Seek audio"
                            className="flex-1 h-[3px] rounded-full appearance-none cursor-pointer bg-white/10 accent-white focus:outline-none group-hover:h-[5px] transition-all"
                            style={{
                                background: `linear-gradient(to right, #fb00ff 0%, #fb00ff ${scrubberPercent}%, rgba(255, 255, 255, 0.1) ${scrubberPercent}%, rgba(255, 255, 255, 0.1) 100%)`
                            }}
                        />

                        {/* Duration */}
                        <span className="text-[10px] font-mono text-white/60 shrink-0 w-8" aria-label="Total duration">
                            {formatTime(duration)}
                        </span>
                    </div>
                </main>

                {/* Sidebar: Effects Rack & Parameters */}
                <aside className="w-[400px] border-l border-white/5 bg-[#050B14] flex flex-col overflow-hidden shrink-0">
                    <SidebarNavigation
                        effects={effects}
                        setEffects={setEffects}
                        selectedEffectIndex={selectedEffectIndex}
                        setSelectedEffectIndex={setSelectedEffectIndex}
                    />
                </aside>
            </div>
            <Footer />
        </div>
    );
};

export default AudioReactiveView;
