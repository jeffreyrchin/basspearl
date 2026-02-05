
/**
 * Audio Art Generator Service
 * 
 * Extracts features from audio files and generates abstract particle field art.
 * Uses memory-efficient chunked processing to handle large files.
 */

import { EffectConfig, GlitchEffectType } from '../types';
import { INITIAL_EFFECTS } from '../constants';


interface AudioFeatures {
  peakAmplitudes: number[];    // Peak amplitude per segment
  rmsEnergy: number[];         // RMS energy per segment
  spectralCentroids: number[]; // Spectral centroid (brightness) per segment
  zeroCrossingRates: number[]; // Zero crossing rate (roughness) per segment
  bassEnergy: number[];        // Bass frequency energy
  midEnergy: number[];         // Mid frequency energy
  trebleEnergy: number[];      // Treble frequency energy
  duration: number;
}

interface GenerativeArtOptions {
  width?: number;
  height?: number;
  particleCount?: number;
  colorScheme?: 'cyberpunk' | 'warm' | 'cool';
}

/**
 * Extract audio features from file using chunked, memory-efficient processing
 */
async function extractAudioFeatures(audioFile: File): Promise<AudioFeatures> {
  // Create offline audio context for faster-than-realtime processing
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

  // Load and decode audio file
  const arrayBuffer = await audioFile.arrayBuffer();
  let audioBuffer: AudioBuffer;

  try {
    audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  } catch (error) {
    throw new Error('Unable to decode audio file. Format may not be supported.');
  }

  const duration = audioBuffer.duration;
  const sampleRate = audioBuffer.sampleRate;

  // Convert to mono for memory efficiency
  const channelData = audioBuffer.getChannelData(0);

  // Process in chunks (0.5 second segments)
  const chunkDuration = 0.5; // seconds
  const samplesPerChunk = Math.floor(sampleRate * chunkDuration);
  const numChunks = Math.ceil(channelData.length / samplesPerChunk);

  const features: AudioFeatures = {
    peakAmplitudes: [],
    rmsEnergy: [],
    spectralCentroids: [],
    zeroCrossingRates: [],
    bassEnergy: [],
    midEnergy: [],
    trebleEnergy: [],
    duration
  };

  // Process each chunk
  for (let i = 0; i < numChunks; i++) {
    const startSample = i * samplesPerChunk;
    const endSample = Math.min(startSample + samplesPerChunk, channelData.length);
    const chunk = channelData.slice(startSample, endSample);

    // Extract features from this chunk
    const chunkFeatures = extractChunkFeatures(chunk, sampleRate);

    features.peakAmplitudes.push(chunkFeatures.peakAmplitude);
    features.rmsEnergy.push(chunkFeatures.rms);
    features.spectralCentroids.push(chunkFeatures.spectralCentroid);
    features.zeroCrossingRates.push(chunkFeatures.zeroCrossingRate);
    features.bassEnergy.push(chunkFeatures.bassEnergy);
    features.midEnergy.push(chunkFeatures.midEnergy);
    features.trebleEnergy.push(chunkFeatures.trebleEnergy);
  }

  // Clean up
  await audioContext.close();

  return features;
}

/**
 * Extract features from a single audio chunk
 */
function extractChunkFeatures(chunk: Float32Array, sampleRate: number) {
  let peakAmplitude = 0;
  let sumSquares = 0;
  let zeroCrossings = 0;

  // Three-band filter state
  let lpBass = 0;    // Low-pass for bass
  let lpMid = 0;     // Low-pass for mid+treble (used to isolate mid)
  let bassSumSq = 0;
  let midSumSq = 0;
  let trebleSumSq = 0;

  const alphaBass = 0.15;  // Bass cutoff (~200Hz equivalent)
  const alphaMid = 0.15;   // Mid cutoff (narrower band = more treble)

  for (let i = 0; i < chunk.length; i++) {
    const x = chunk[i];
    peakAmplitude = Math.max(peakAmplitude, Math.abs(x));
    sumSquares += x * x;

    if (i > 0 && chunk[i - 1] * x < 0) zeroCrossings++;

    // Three-band filter cascade (narrower mid band = more treble)
    lpBass += alphaBass * (x - lpBass);           // Bass: low-pass at ~200Hz
    const midPlusTreble = x - lpBass;              // Everything above bass
    lpMid += alphaMid * (midPlusTreble - lpMid);  // Mid: captures middle frequencies
    const treble = midPlusTreble - lpMid;         // Treble: residual high frequencies

    bassSumSq += lpBass * lpBass;
    midSumSq += lpMid * lpMid;
    trebleSumSq += treble * treble;
  }

  const rms = Math.sqrt(sumSquares / chunk.length);
  const bassEnergy = Math.sqrt(bassSumSq / chunk.length);
  const midEnergy = Math.sqrt(midSumSq / chunk.length);
  const trebleEnergy = Math.sqrt(trebleSumSq / chunk.length);

  // Spectral Centroid (Weighted "Brightness")
  const total = bassEnergy + midEnergy + trebleEnergy + 0.001;
  const spectralCentroid = (bassEnergy * 0.1 + midEnergy * 0.4 + trebleEnergy * 0.9) / total;

  return {
    peakAmplitude,
    rms,
    zeroCrossingRate: zeroCrossings / chunk.length,
    spectralCentroid,
    bassEnergy,
    midEnergy,
    trebleEnergy
  };
}

/**
 * Calculate energy in a frequency band (simplified)
 */
function calculateBandEnergy(chunk: Float32Array, start: number, end: number): number {
  let energy = 0;
  for (let i = start; i < end && i < chunk.length; i++) {
    energy += chunk[i] * chunk[i];
  }
  return Math.sqrt(energy / (end - start));
}

/**
 * Generate enhanced particle field art from audio features
 */
function generateParticleField(features: AudioFeatures, options: GenerativeArtOptions): string {
  const width = options.width || 1280;
  const height = options.height || 1280;
  const colorScheme = options.colorScheme || 'cyberpunk';

  // Calculate overall audio characteristics
  const avgEnergy = features.rmsEnergy.reduce((a, b) => a + b, 0) / features.rmsEnergy.length;
  const maxEnergy = Math.max(...features.rmsEnergy);
  const avgBass = features.bassEnergy.reduce((a, b) => a + b, 0) / features.bassEnergy.length;
  const avgTreble = features.trebleEnergy.reduce((a, b) => a + b, 0) / features.trebleEnergy.length;
  const avgSpectral = features.spectralCentroids.reduce((a, b) => a + b, 0) / features.spectralCentroids.length;

  // Determine particle count based on energy
  const baseParticleCount = options.particleCount || 4000;
  const energyMultiplier = 0.8 + (avgEnergy * 2.5); // 0.8x to 3.3x based on energy
  const particleCount = Math.floor(baseParticleCount * energyMultiplier);

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Use audio features to seed deterministic randomness
  const seed = features.peakAmplitudes.reduce((a, b) => a + b, 0) + features.duration * 1000;
  let random = seededRandom(seed);

  // === LAYER 1: DYNAMIC GRADIENT BACKGROUND ===
  const bgGradient = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, width * 0.7
  );

  // Background colors based on frequency content
  const bassHue = 300 + avgBass * 40; // Warm core for bass
  const trebleHue = 220 + avgTreble * 60; // Cool edges for treble
  const coreIntensity = 8 + avgEnergy * 12; // 8-20% lightness
  const edgeIntensity = 3 + avgEnergy * 4; // 3-7% lightness

  bgGradient.addColorStop(0, `hsl(${bassHue}, 60%, ${coreIntensity}%)`);
  bgGradient.addColorStop(0.5, `hsl(${(bassHue + trebleHue) / 2}, 50%, ${(coreIntensity + edgeIntensity) / 2}%)`);
  bgGradient.addColorStop(1, `hsl(${trebleHue}, 40%, ${edgeIntensity}%)`);

  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);


  // === LAYER 2: GENERATE PARTICLES WITH FLOW FIELD ===

  const particles: Array<{
    x: number;
    y: number;
    size: number;
    color: string;
    alpha: number;
  }> = [];

  // Create Perlin-like flow field for organic distortion
  const flowStrength = 0.15 + avgEnergy * 0.25; // How much flow affects positioning

  for (let i = 0; i < particleCount; i++) {
    // Map particle to time segment
    const timeIndex = Math.floor((i / particleCount) * features.rmsEnergy.length);
    const energy = features.rmsEnergy[timeIndex] || avgEnergy;
    const bass = features.bassEnergy[timeIndex] || avgBass;
    const treble = features.trebleEnergy[timeIndex] || avgTreble;
    const spectral = features.spectralCentroids[timeIndex] || 0.5;
    const zeroCross = features.zeroCrossingRates[timeIndex] || 0;

    // Base position (radial distribution)
    const spread = 0.25 + (energy * 0.75); // 25% to 100% spread
    const baseAngle = (i / particleCount) * Math.PI * 2 * (1 + zeroCross * 3); // More angles for noisy audio
    const distance = Math.pow(random(), 1.3) * spread; // Power curve for clustering

    let x = width / 2 + Math.cos(baseAngle) * distance * width / 2;
    let y = height / 2 + Math.sin(baseAngle) * distance * height / 2;

    // Apply flow field distortion (Perlin-noise-like)
    const flowAngle = (x / width + y / height + spectral) * Math.PI * 4;
    const flowMagnitude = Math.sin(flowAngle * 2.5 + energy * Math.PI) * flowStrength;
    x += Math.cos(flowAngle) * flowMagnitude * width;
    y += Math.sin(flowAngle) * flowMagnitude * height;

    // Size: much more dramatic variance (1px to 15px)
    const sizeVariance = 1 + random() * 0.5; // ±25% size variance per particle
    const size = (1 + energy * 14) * sizeVariance;

    // Color based on frequency content with variance
    const colorSpectralShift = spectral + (random() - 0.5) * 0.2; // Slight hue variance
    const color = getParticleColor(bass, treble, Math.max(0, Math.min(1, colorSpectralShift)), colorScheme);

    // Alpha: more dramatic range (0.2 to 1.0)
    const alpha = 0.2 + energy * 0.5 + random() * 0.3;

    particles.push({ x, y, size, color, alpha: Math.min(1, alpha) });
  }

  // === LAYER 3: PARTICLE CONNECTION NETWORK ===
  // Connect nearby particles to create constellation effect
  const connectionDistance = width * (0.08 + avgEnergy * 0.07); // Dynamic based on energy
  const maxConnections = Math.floor(particleCount * 0.15); // Limit to avoid overwhelming

  ctx.globalAlpha = 0.15 + avgEnergy * 0.25;
  let connectionCount = 0;

  for (let i = 0; i < particles.length && connectionCount < maxConnections; i++) {
    const p1 = particles[i];

    // Check next 20 particles for connections (limit search for performance)
    for (let j = i + 1; j < Math.min(i + 20, particles.length) && connectionCount < maxConnections; j++) {
      const p2 = particles[j];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < connectionDistance) {
        // Draw connection line
        const connectionAlpha = (1 - dist / connectionDistance) * Math.min(p1.alpha, p2.alpha) * 0.4;
        const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
        gradient.addColorStop(0, p1.color.replace(')', `, ${connectionAlpha})`).replace('hsl', 'hsla'));
        gradient.addColorStop(1, p2.color.replace(')', `, ${connectionAlpha})`).replace('hsl', 'hsla'));

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 0.5 + (p1.size + p2.size) / 30;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        connectionCount++;
      }
    }
  }

  ctx.globalAlpha = 1.0;

  // === LAYER 4: DRAW PARTICLES WITH ENHANCED GLOW ===
  particles.forEach(particle => {
    // Outer glow (larger and more intense)
    const glowSize = particle.size * (3 + particle.alpha * 2);
    const gradient = ctx.createRadialGradient(
      particle.x, particle.y, 0,
      particle.x, particle.y, glowSize
    );
    gradient.addColorStop(0, particle.color.replace(')', `, ${particle.alpha * 0.9})`).replace('hsl', 'hsla'));
    gradient.addColorStop(0.3, particle.color.replace(')', `, ${particle.alpha * 0.5})`).replace('hsl', 'hsla'));
    gradient.addColorStop(0.7, particle.color.replace(')', `, ${particle.alpha * 0.15})`).replace('hsl', 'hsla'));
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, glowSize, 0, Math.PI * 2);
    ctx.fill();

    // Core particle (bright center)
    ctx.fillStyle = particle.color.replace(')', `, ${Math.min(1, particle.alpha * 1.2)})`).replace('hsl', 'hsla');
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();

    // Super-bright center point for larger particles
    if (particle.size > 6) {
      ctx.fillStyle = `rgba(255, 255, 255, ${particle.alpha * 0.6})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // === LAYER 5: SUBTLE FILM GRAIN TEXTURE ===
  addFilmGrain(ctx, width, height, 0.025, seed);

  return canvas.toDataURL('image/png');
}

/**
 * Seeded random number generator (0 to 1)
 */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

/**
 * Get particle color based on frequency content
 */
function getParticleColor(bass: number, treble: number, spectral: number, scheme: string): string {
  if (scheme === 'cyberpunk') {
    // Map frequency to hue in cyberpunk palette
    // Bass (low frequencies) = warm colors (pink, red, orange)
    // Treble (high frequencies) = cool colors (blue, cyan, purple)

    const bassWeight = bass / (bass + treble + 0.01);
    const trebleWeight = treble / (bass + treble + 0.01);

    if (bassWeight > trebleWeight) {
      // Warm colors: pink to orange
      const hue = 300 + spectral * 60; // 300-360 (pink to red)
      const saturation = 70 + bassWeight * 30;
      const lightness = 50 + bassWeight * 20;
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    } else {
      // Cool colors: blue to purple
      const hue = 200 + spectral * 80; // 200-280 (cyan to purple)
      const saturation = 60 + trebleWeight * 40;
      const lightness = 45 + trebleWeight * 25;
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
  }

  // Default fallback
  return `hsl(${spectral * 360}, 70%, 60%)`;
}

/**
 * Add subtle noise texture overlay
 */
function addNoiseTexture(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * intensity * 255;
    data[i] += noise;     // R
    data[i + 1] += noise; // G
    data[i + 2] += noise; // B
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Add deterministic film grain texture overlay
 */
function addFilmGrain(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number, seed: number) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const random = seededRandom(seed + 9999); // Different seed for grain

  for (let i = 0; i < data.length; i += 4) {
    const noise = (random() - 0.5) * intensity * 255;
    data[i] += noise;     // R
    data[i + 1] += noise; // G
    data[i + 2] += noise; // B
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Main function: Generate audio art from file
 */
export async function generateAudioArt(
  audioFile: File,
  options: GenerativeArtOptions = {}
): Promise<{ imageData: string, suggestedEffects: EffectConfig[] }> {
  // Extract audio features
  const features = await extractAudioFeatures(audioFile);

  // Generate particle field
  const imageData = generateParticleField(features, options);

  // Calculate suggested effects based on audio characteristics
  const suggestedEffects = getSuggestedEffects(features);

  return { imageData, suggestedEffects };
}

/**
 * Get basic audio metadata
 */
export async function getAudioMetadata(audioFile: File): Promise<{ duration: number; format: string }> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await audioFile.arrayBuffer();

  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    await audioContext.close();

    return {
      duration: audioBuffer.duration,
      format: audioFile.type || 'audio/unknown'
    };
  } catch (error) {
    await audioContext.close();
    throw new Error('Unable to decode audio file');
  }
}

/**
 * Analyze audio features and suggest effects settings
 * Maps audio characteristics to effect parameters
 */
interface NormalizedMetrics {
  avgEnergy: number;
  relBass: number;
  relTreble: number;
  zeroCrossing: number;
  spectralAvg: number;
}

/**
 * Extracts and normalizes audio features for gain-independent effect selection.
 */
function calculateNormalizedMetrics(f: AudioFeatures): NormalizedMetrics {
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  const rawAvg = avg(f.rmsEnergy);
  const peak = Math.max(...f.rmsEnergy, 0.01);

  // Normalize energy relative to peak, with floor to handle very quiet tracks
  // Lower floor (0.15) allows better distinction between quiet and loud tracks
  const energy = rawAvg / Math.max(0.15, peak);

  const [b, m, t] = [avg(f.bassEnergy), avg(f.midEnergy), avg(f.trebleEnergy)];
  const total = b + m + t + 0.001;

  return {
    avgEnergy: energy,
    relBass: b / total,
    relTreble: t / total,
    zeroCrossing: avg(f.zeroCrossingRates),
    spectralAvg: avg(f.spectralCentroids)
  };
}

/**
 * Analyze audio features and suggest effects settings
 */
export function getSuggestedEffects(features: AudioFeatures): EffectConfig[] {
  const metrics = calculateNormalizedMetrics(features);
  const { avgEnergy, relBass, relTreble, zeroCrossing, spectralAvg } = metrics;

  const audioHash = features.duration * 1000 + features.peakAmplitudes.reduce((a, b) => a + b, 0);
  const random = seededRandom(Math.floor(audioHash));

  // Selection state
  const effects = INITIAL_EFFECTS.map(e => ({ ...e, active: false }));
  const selectedTypes = new Set<GlitchEffectType>();

  const pickFromPool = (pool: Array<{ type: GlitchEffectType; score: number; params: any }>, min: number, max: number, t = 0.3) => {
    const candidates = pool.filter(p => p.score > t).sort(() => random() - 0.5);
    const count = Math.min(candidates.length, Math.floor(random() * (max - min + 1)) + min);

    candidates.slice(0, count).forEach(item => {
      selectedTypes.add(item.type);
      const idx = effects.findIndex(e => e.type === item.type);
      if (idx !== -1) {
        // Reduced variance: ±8 instead of ±40 to preserve audio-reactive behavior
        const vary = (v: number) => Math.max(0, Math.min(100, Math.floor(v + (random() - 0.5) * 16)));
        effects[idx] = { ...effects[idx], active: true, intensity: vary(item.params.intensity), threshold: vary(item.params.threshold) };
      }
    });
  };

  // Pools
  const aggressivePool = [
    { type: 'DATA_CORRUPTION' as const, score: avgEnergy, params: { intensity: 30 + avgEnergy * 60, threshold: 20 + avgEnergy * 60 } },
    { type: 'DEEP_FRY' as const, score: avgEnergy, params: { intensity: 40 + avgEnergy * 60, threshold: 50 + avgEnergy * 50 } },
    { type: 'BIT_CRUSH' as const, score: zeroCrossing * 2.5, params: { intensity: 20 + zeroCrossing * 100, threshold: 50 } },
    { type: 'COMPRESSION_HELL' as const, score: avgEnergy, params: { intensity: avgEnergy * 20, threshold: avgEnergy * 100 } }
  ];

  const atmosphericPool = [
    { type: 'WAVE_DISTORTION' as const, score: 1 - avgEnergy, params: { intensity: avgEnergy * 10, threshold: relTreble * 50 } },
    { type: 'INVERT_GHOST' as const, score: 1 - avgEnergy, params: { intensity: 50 + (1 - relTreble) * 50, threshold: 0 } },
    { type: 'ANALOG_NOISE' as const, score: relTreble * 2.5, params: { intensity: 10 + (1 - relTreble) * 80, threshold: 0 } }
  ];

  const tonalPool = [
    { type: 'CHANNEL_SHIFT' as const, score: relBass * 2, params: { intensity: 30 + relBass * 70, threshold: 50 } },
    { type: 'COLOR_BLEED' as const, score: relBass * 2, params: { intensity: 40 + relBass * 60, threshold: 0 } },
    { type: 'HUE_ROTATION' as const, score: 0.5, params: { intensity: Math.floor(spectralAvg * 360), threshold: 50 + avgEnergy * 50 } },
    { type: 'RANDOM_CHAOS' as const, score: relTreble * 2.5, params: { intensity: relTreble * 100, threshold: avgEnergy * 20 } },
    { type: 'PIXEL_SORT' as const, score: relTreble * 2.5, params: { intensity: 30 + relTreble * 70, threshold: 50 } }
  ];

  // Logic: Higher threshold (0.55) due to adjusted normalization floor
  if (avgEnergy > 0.55) pickFromPool(aggressivePool, 2, 3, 0.15);
  else pickFromPool(atmosphericPool, 1, 3, 0.15);

  const bassRatio = relBass / (relBass + relTreble + 0.001);
  if (bassRatio > 0.6) pickFromPool(tonalPool.filter(p => p.type !== 'PIXEL_SORT'), 1, 3, 0.1);
  else if (bassRatio < 0.4) pickFromPool(tonalPool.filter(p => ['PIXEL_SORT', 'HUE_ROTATION'].includes(p.type)), 1, 3, 0.1);
  else pickFromPool(tonalPool, 1, 3, 0);

  pickFromPool([{ type: 'SCAN_LINES', score: 0.3, params: { intensity: 20 + avgEnergy * 40, threshold: 50 } }], 1, 1, 0);

  // Forced fallback
  if (selectedTypes.size === 0) {
    const hueIdx = effects.findIndex(e => e.type === 'HUE_ROTATION');
    if (hueIdx !== -1) Object.assign(effects[hueIdx], { active: true, intensity: Math.floor(random() * 100), threshold: 50 });
  }

  return effects;
}
