import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EffectConfig } from '../types';
import { glitchEngine } from '../services/glitchEngine';
import SidebarNavigation from './SidebarNavigation';
import Navbar from './Navbar';
import { FEEDBACK_FORM_URL } from '@/constants';
import LegalConsentModal from './LegalConsentModal';

interface AudioReactiveViewProps {
}

const INITIAL_REACTIVE_EFFECTS: EffectConfig[] = [
    { type: 'CHANNEL_SHIFT', intensity: 0, threshold: 0, active: true, seed: 1, reactiveIntensity: true, reactiveThreshold: false, maxIntensity: 50, maxThreshold: 20, frequencyBand: 'BASS' },
    { type: 'WAVE_DISTORTION', intensity: 0, threshold: 0, active: false, seed: 1, reactiveIntensity: true, reactiveThreshold: false, maxIntensity: 30, maxThreshold: 10, frequencyBand: 'MID' },
    { type: 'SCAN_LINES', intensity: 0, threshold: 0, active: false, seed: 1, reactiveIntensity: true, reactiveThreshold: false, maxIntensity: 40, maxThreshold: 20, frequencyBand: 'ENERGY' },
    { type: 'PIXEL_SORT', intensity: 0, threshold: 0, active: false, seed: 1, reactiveIntensity: true, reactiveThreshold: true, maxIntensity: 80, maxThreshold: 90, frequencyBand: 'TREBLE' },
    { type: 'BIT_CRUSH', intensity: 0, threshold: 0, active: false, seed: 1, reactiveIntensity: true, reactiveThreshold: false, maxIntensity: 20, maxThreshold: 10, frequencyBand: 'BASS' },
    { type: 'ANALOG_NOISE', intensity: 0, threshold: 0, active: false, seed: 1, reactiveIntensity: true, reactiveThreshold: false, maxIntensity: 85, maxThreshold: 30, frequencyBand: 'ENERGY' },
    { type: 'INVERT_GHOST', intensity: 0, threshold: 0, active: false, seed: 1, reactiveIntensity: true, reactiveThreshold: false, maxIntensity: 100, maxThreshold: 50, frequencyBand: 'BASS' },
    { type: 'DATA_CORRUPTION', intensity: 0, threshold: 0, active: false, seed: 1, reactiveIntensity: true, reactiveThreshold: true, maxIntensity: 70, maxThreshold: 30, frequencyBand: 'MID' },
    { type: 'COLOR_BLEED', intensity: 0, threshold: 0, active: false, seed: 1, reactiveIntensity: true, reactiveThreshold: false, maxIntensity: 60, maxThreshold: 40, frequencyBand: 'MID' },
    { type: 'RANDOM_CHAOS', intensity: 0, threshold: 0, active: false, seed: 1, reactiveIntensity: true, reactiveThreshold: true, maxIntensity: 10, maxThreshold: 10, frequencyBand: 'ENERGY' },
    { type: 'HUE_ROTATION', intensity: 0, threshold: 0, active: false, seed: 1, reactiveIntensity: true, reactiveThreshold: false, maxIntensity: 50, maxThreshold: 50, frequencyBand: 'TREBLE' },
    { type: 'COMPRESSION_HELL', intensity: 0, threshold: 0, active: false, seed: 1, reactiveIntensity: true, reactiveThreshold: false, maxIntensity: 30, maxThreshold: 70, frequencyBand: 'MID' },
    { type: 'DEEP_FRY', intensity: 0, threshold: 0, active: false, seed: 1, reactiveIntensity: true, reactiveThreshold: false, maxIntensity: 70, maxThreshold: 50, frequencyBand: 'ENERGY' },
    { type: 'ZOOM_PAN', intensity: 0, threshold: 0, active: true, seed: 1, reactiveIntensity: true, reactiveThreshold: false, maxIntensity: 40, maxThreshold: 0, frequencyBand: 'ENERGY' },
    { type: 'SCREEN_SHAKE', intensity: 0, threshold: 0, active: true, seed: 1, reactiveIntensity: true, reactiveThreshold: false, maxIntensity: 30, maxThreshold: 0, frequencyBand: 'BASS' },
];

const AudioReactiveView: React.FC<AudioReactiveViewProps> = () => {
    const navigate = useNavigate();
    const [legalModalOpen, setLegalModalOpen] = useState(false);
    const [image, setImage] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [effects, setEffects] = useState<EffectConfig[]>(INITIAL_REACTIVE_EFFECTS);
    const [selectedEffectIndex, setSelectedEffectIndex] = useState(0);

    const isPlayingRef = useRef(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);
    const requestRef = useRef<number>();
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const effectsRef = useRef<EffectConfig[]>(effects);
    const imageRef = useRef<string | null>(null);
    const smoothedBassRef = useRef(0);
    const smoothedMidRef = useRef(0);
    const smoothedTrebleRef = useRef(0);
    const smoothedEnergyRef = useRef(0);
    const prevBinsRef = useRef<Float32Array | null>(null);
    const kickBaselineRef = useRef<number | null>(null);
    const baselinesRef = useRef<Record<string, number | null>>({ bass: null, mid: null, treble: null, energy: null });
    const frameCountRef = useRef(0);

    // Sync refs with state
    useEffect(() => { effectsRef.current = effects; }, [effects]);
    useEffect(() => { imageRef.current = image; }, [image]);
    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

    useEffect(() => {
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, []);

    const handleOpenLegal = (force: boolean) => {
        setLegalModalOpen(true);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const result = event.target?.result as string;
                setImage(result);

                // Show initial preview
                if (canvasRef.current) {
                    await glitchEngine.renderToCanvas(
                        canvasRef.current,
                        result,
                        effects,
                        false,
                        960
                    );
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAudioFile(e.target.files[0]);
            setIsPlaying(false);
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
        }
    };

    const initAudio = async () => {
        if (!audioFile) return;

        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const arrayBuffer = await audioFile.arrayBuffer();
        const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);

        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048;
        analyserRef.current.smoothingTimeConstant = 0; // Instant frequency data response

        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);

        source.onended = () => {
            setIsPlaying(false);
            isPlayingRef.current = false;
        };
        sourceRef.current = source;
        source.start(0);
        setIsPlaying(true);
        isPlayingRef.current = true;

        animate();
    };

    const animate = async () => {
        if (!isPlayingRef.current) {
            frameCountRef.current = 0;
            baselinesRef.current = { bass: null, mid: null, treble: null, energy: null };
            return;
        }

        if (!imageRef.current || !canvasRef.current || !analyserRef.current || !dataArrayRef.current) {
            requestRef.current = requestAnimationFrame(animate);
            return;
        }

        try {
            // Get frequency data
            analyserRef.current.getByteFrequencyData(dataArrayRef.current);
            const data = dataArrayRef.current;
            const binCount = data.length;
            const sampleRate = audioContextRef.current!.sampleRate;
            const nyquist = sampleRate / 2;

            if (!prevBinsRef.current) {
                prevBinsRef.current = new Float32Array(binCount).fill(0);
            }

            for (let i = 0; i < binCount; i++) {
                const normalized = data[i] / 255;
                prevBinsRef.current[i] = normalized;
            }

            // Helper: map frequency to FFT bin
            const freqToBin = (freq: number) =>
                Math.min(binCount - 1, Math.floor((freq / nyquist) * binCount));

            // Helper: compute RMS for a range of smoothed bins
            const bandRMS = (startBin: number, endBin: number) => {
                let sum = 0;
                const len = Math.max(1, endBin - startBin);
                for (let i = startBin; i < endBin; i++) {
                    const v = prevBinsRef.current[i];
                    sum += v * v;
                }
                return Math.sqrt(sum / len);
            };

            // Frequency bands
            const bassBins: [number, number] = [freqToBin(20), freqToBin(200)];
            const midBins: [number, number] = [freqToBin(200), freqToBin(1500)];
            const trebleBins: [number, number] = [freqToBin(1500), freqToBin(5000)];

            const rawBass = bandRMS(bassBins[0], bassBins[1]);
            const rawMid = bandRMS(midBins[0], midBins[1]);
            const rawTreble = bandRMS(trebleBins[0], trebleBins[1]);

            // Overall energy from weighted band combination
            const rawEnergy = (rawBass * 0.7) + (rawMid * 0.2) + (rawTreble * 0.1);

            // Transient Detection
            const transientBoost = {
                bass: 10.0,
                mid: 10.0,
                treble: 10.0,
                energy: 10.0
            };

            // Helper to update band and apply transient detection
            const updateBand = (raw: number, key: string) => {
                // Initialize baseline once
                if (baselinesRef.current[key] === null) {
                    baselinesRef.current[key] = raw;
                    return raw;
                }

                const delta = Math.max(0, raw - baselinesRef.current[key]!) * 0.005;
                const transient = delta * (transientBoost as any)[key];

                return Math.min(1, raw + transient);
            };

            const reactiveBassValue = updateBand(rawBass, 'bass');
            const reactiveMidValue = updateBand(rawMid, 'mid');
            const reactiveTrebleValue = updateBand(rawTreble, 'treble');
            const reactiveEnergyValue = updateBand(rawEnergy, 'energy');

            // Kick detection (Specific helper for bass-heavy spikes)
            if (!kickBaselineRef.current) kickBaselineRef.current = rawBass;
            kickBaselineRef.current += (rawBass - kickBaselineRef.current) * 0.1;
            const kickDelta = rawBass - kickBaselineRef.current;
            const dynamicThreshold = Math.max(0.1, Math.min(0.6, rawBass * 0.7));
            const isKick = kickDelta > dynamicThreshold;

            // Final Composition: merge the band-specific reactive values with a final smooth
            const adaptiveSmooth = (current: number, target: number) => {
                const delta = target - current;
                const attack = delta > 0 ? 0.5 : 0.1;
                return current + delta * attack;
            };

            const expandRange = (v: number) => {
                const adjustedExponent = (v < 0.3) ? 5 : 3;
                return Math.min(1, Math.pow(v, adjustedExponent));
            };

            const pBass = adaptiveSmooth(smoothedBassRef.current, expandRange(reactiveBassValue + (isKick ? 0.3 : 0)));
            const pMid = adaptiveSmooth(smoothedMidRef.current, expandRange(reactiveMidValue));
            const pTreble = adaptiveSmooth(smoothedTrebleRef.current, expandRange(reactiveTrebleValue));
            const pEnergy = adaptiveSmooth(smoothedEnergyRef.current, expandRange(reactiveEnergyValue));

            smoothedBassRef.current = pBass;
            smoothedMidRef.current = pMid;
            smoothedTrebleRef.current = pTreble;
            smoothedEnergyRef.current = pEnergy;

            // Create reactive effects
            const reactiveEffects = effectsRef.current.map(effect => {
                let energyValue = pEnergy;
                if (effect.frequencyBand === 'BASS') energyValue = pBass;
                else if (effect.frequencyBand === 'MID') energyValue = pMid;
                else if (effect.frequencyBand === 'TREBLE') energyValue = pTreble;

                const reactiveIntensity = effect.reactiveIntensity
                    ? energyValue * (effect.maxIntensity ?? 100)
                    : effect.intensity ?? 0;

                const reactiveThreshold = effect.reactiveThreshold
                    ? energyValue * (effect.maxThreshold ?? 100)
                    : effect.threshold ?? 0;

                return {
                    ...effect,
                    seed: (effect.seed ?? 0) + (requestRef.current ?? 0),
                    intensity: Math.min(100, reactiveIntensity),
                    threshold: Math.min(100, reactiveThreshold),
                };
            });

            await glitchEngine.renderToCanvas(
                canvasRef.current,
                imageRef.current,
                reactiveEffects,
                false,
                960
            );
        } catch (err) {
            console.error("Animation loop error:", err);
        }

        if (isPlayingRef.current) {
            requestRef.current = requestAnimationFrame(animate);
        }
    };

    const togglePlay = () => {
        if (isPlayingRef.current) {
            sourceRef.current?.stop();
            setIsPlaying(false);
            isPlayingRef.current = false;
        } else {
            initAudio();
        }
    };

    return (
        <div className="h-screen bg-[#050B14] text-white flex flex-col overflow-hidden font-display leading-relaxed">
            <Navbar />

            <div className="flex-1 flex flex-row min-h-0 overflow-hidden relative">
                {/* Main Content Area */}
                <main className="flex-1 flex flex-col min-h-0 min-w-0 bg-[#050B14]">
                    {/* Source Header: Quick-load controls centered above image */}
                    <div className="h-14 border-b border-white/5 bg-black/20 flex items-center justify-center px-6 gap-3 shrink-0">
                        {/* Image Source Action */}
                        <label className={`h-9 px-4 rounded-xl border transition-all duration-300 flex items-center gap-3 cursor-pointer ${image ? 'border-[#00F0FF]/30 bg-[#00F0FF]/5 text-[#00F0FF]' : 'border-white/5 bg-white/[0.03] text-white/40 hover:border-white/20 hover:text-white/60'}`}>
                            <input id="image-file-input" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            <span className="material-symbols-outlined text-base">image</span>
                            <span className="text-[9px] font-bold uppercase tracking-widest truncate max-w-[120px]">
                                {image ? (document.getElementById('image-file-input') as HTMLInputElement)?.files?.[0]?.name || 'Image' : 'Load Image'}
                            </span>
                        </label>

                        {/* Audio Source Action */}
                        <label className={`h-9 px-4 rounded-xl border transition-all duration-300 flex items-center gap-3 cursor-pointer ${audioFile ? 'border-[#3B82F6]/30 bg-[#3B82F6]/5 text-[#3B82F6]' : 'border-white/5 bg-white/[0.03] text-white/40 hover:border-white/20 hover:text-white/60'}`}>
                            <input id="audio-file-input" type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
                            <span className="material-symbols-outlined text-base">graphic_eq</span>
                            <span className="text-[9px] font-bold uppercase tracking-widest truncate max-w-[120px]">
                                {audioFile ? audioFile.name || 'Audio' : 'Load Audio'}
                            </span>
                        </label>
                    </div>

                    {/* Viewport */}
                    <div className="flex-1 flex items-center justify-center min-h-0 relative">
                        <div className="relative w-full h-full overflow-hidden bg-black/40 shadow-2xl flex items-center justify-center">
                            <canvas
                                ref={canvasRef}
                                className={`max-w-full max-h-full object-contain ${!image ? 'hidden' : ''}`}
                            />
                            {!image && (
                                <div className="flex flex-col items-center gap-6 p-8 text-center max-w-md">
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-white/10 border border-white/5">
                                        <span className="material-symbols-outlined text-4xl">stream</span>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-bold tracking-tight text-white/40 uppercase tracking-[0.2em]">Upload Image and Audio</h3>
                                        <p className="text-[9px] text-white/20 uppercase tracking-widest">Awaiting local assets for initialization</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Playback Bar */}
                    <div className={`h-14 bg-black/20 border-t border-white/5 flex items-center justify-center px-6 shrink-0`}>
                        <button
                            onClick={togglePlay}
                            disabled={!image || !audioFile}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${isPlaying ? 'bg-primary/20 border-primary/40 shadow-[inset_0_0_10px_rgba(59,130,246,0.2)] text-primary' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'}`}
                        >
                            <span className="material-symbols-outlined text-[20px] fill">{isPlaying ? 'pause' : 'play_arrow'}</span>
                        </button>
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

            <footer className="p-1 bg-[#050510] border-t border-white/5 px-4 md:px-6 flex flex-row items-center justify-between gap-4 z-50">
                <span className="text-[11px] font-bold tracking-widest text-white/70 uppercase">© 2026 GlitchBrain<span className="lowercase">.io</span></span>
                <div className="flex items-center gap-6 text-[11px] font-bold tracking-widest text-white/70 uppercase">
                    <a href={FEEDBACK_FORM_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors uppercase">Feedback</a>
                    <button onClick={() => handleOpenLegal(false)} className="hover:text-white transition-colors uppercase">Privacy & Terms</button>
                </div>
            </footer>

            <LegalConsentModal
                isOpen={legalModalOpen}
                onClose={() => setLegalModalOpen(false)}
                onConfirm={() => setLegalModalOpen(false)}
                isForced={false}
            />
        </div>
    );
};

export default AudioReactiveView;
