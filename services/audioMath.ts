import { calculateNextState, ReactivityState } from '@/services/calculateReactiveEffects';

/**
 * Core Audio Analysis Logic
 * Extracts spectral data and maps it to reactivity bands (sub, bass, mid, treble)
 */

export const calculateDynamicFFTSize = (sampleRate: number): number => {
    // Aim for ~80Hz resolution (sampleRate / 80)
    // Uses 2048 FFT size at <= 96kHz
    // Uses 4096 FFT size at 192kHz (~21ms delay - virtually instantaneous)
    const targetSize = sampleRate / 80;
    // Find next power of 2, minimum 2048, maximum 16384 (for performance/memory safety)
    const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(targetSize)));
    return Math.max(2048, Math.min(16384, nextPowerOf2));
};

export const analyzeAudioFrame = (
    re: Float32Array,
    im: Float32Array,
    magnitudes: Float32Array,
    window: Float32Array,
    channelData: Float32Array,
    startSample: number,
    fftSize: number,
    minDb: number,
    maxDb: number,
    sampleRate: number,
    state: ReactivityState
): ReactivityState => {
    // 1. Prepare Windowed Buffer
    re.fill(0);
    im.fill(0);
    for (let i = 0; i < fftSize; i++) {
        const sampleIndex = startSample + i;
        if (sampleIndex >= 0 && sampleIndex < channelData.length) {
            re[i] = channelData[sampleIndex] * window[i];
        }
    }

    // 2. Cooley-Tukey FFT (Iterative)
    const n = fftSize;
    for (let i = 1, j = 0; i < n; i++) {
        let bit = n >> 1;
        for (; j & bit; bit >>= 1) j ^= bit;
        j ^= bit;
        if (i < j) [re[i], re[j]] = [re[j], re[i]];
    }
    for (let len = 2; len <= n; len <<= 1) {
        const ang = 2 * Math.PI / len;
        const wlen_re = Math.cos(ang), wlen_im = -Math.sin(ang);
        for (let i = 0; i < n; i += len) {
            let w_re = 1, w_im = 0;
            for (let j = 0; j < len / 2; j++) {
                const u_re = re[i + j], u_im = im[i + j];
                const v_re = re[i + j + len / 2] * w_re - im[i + j + len / 2] * w_im;
                const v_im = re[i + j + len / 2] * w_im + im[i + j + len / 2] * w_re;
                re[i + j] = u_re + v_re;
                im[i + j] = u_im + v_im;
                re[i + j + len / 2] = u_re - v_re;
                im[i + j + len / 2] = u_im - v_im;
                const next_w_re = w_re * wlen_re - w_im * wlen_im;
                w_im = w_re * wlen_im + w_im * wlen_re;
                w_re = next_w_re;
            }
        }
    }

    // 3. Magnitudes (Convert to Decibels, matching Web Audio Analyser defaults)
    for (let i = 0; i < fftSize / 2; i++) {
        // Normalize by 1/N and calculate linear magnitude
        const mag = Math.sqrt(re[i] * re[i] + im[i] * im[i]) / fftSize;

        // Convert to Decibels
        const db = mag > 0.000001 ? 20 * Math.log10(mag) : minDb;

        // Map dB to 0..1 scale (clamping to minDb/maxDb)
        const scaled = (db - minDb) / (maxDb - minDb);
        magnitudes[i] = Math.max(0, Math.min(1, scaled));
    }

    // 4. Feed to existing reactivity service
    return calculateNextState(magnitudes, magnitudes.length, sampleRate, state);
};
