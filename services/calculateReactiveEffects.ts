export interface ReactivityState {
    baselines: Record<string, number | null>;
    smoothed: { sub: number; bass: number; mid: number; treble: number };
    prevBins: Float32Array | null;
}

/**
 * Calculates the next reactivity state from raw FFT data.
 */
export const calculateNextState = (
    data: Uint8Array | Float32Array,
    binCount: number,
    sampleRate: number,
    prevState: ReactivityState
) => {
    // 1. Set up FFT helpers
    const nyquist = sampleRate / 2;
    const freqToBin = (freq: number) =>
        Math.min(binCount - 1, Math.floor((freq / nyquist) * binCount));

    const bins = prevState.prevBins || new Float32Array(binCount).fill(0);
    const isUint8 = data instanceof Uint8Array;

    for (let i = 0; i < binCount; i++) {
        bins[i] = isUint8 ? (data as Uint8Array)[i] / 255 : (data as Float32Array)[i];
    }

    const bandRMS = (startBin: number, endBin: number) => {
        let sum = 0;
        let totalWeight = 0;
        const range = Math.max(1, endBin - startBin);

        for (let i = startBin; i < endBin; i++) {
            // Sine-based Bell Curve weighting (0.0 at edges, 1.0 at center)
            const normalizedPosition = (i - startBin) / range;
            const weight = Math.sin(Math.PI * normalizedPosition);

            const v = bins[i];
            sum += (v * v) * weight;
            totalWeight += weight;
        }

        return Math.sqrt(sum / Math.max(0.001, totalWeight));
    };

    // 2. Extract frequency bands
    const subBins: [number, number] = [freqToBin(20), freqToBin(100)];
    const bassBins: [number, number] = [freqToBin(100), freqToBin(250)];
    const midBins: [number, number] = [freqToBin(250), freqToBin(1000)];
    const trebleBins: [number, number] = [freqToBin(1000), freqToBin(8000)];

    const rawSub = bandRMS(subBins[0], subBins[1]);
    const rawBass = bandRMS(bassBins[0], bassBins[1]);
    const rawMid = bandRMS(midBins[0], midBins[1]) * 1.2;
    const rawTreble = bandRMS(trebleBins[0], trebleBins[1]) * 1.4;

    // 3. Transient detection & smoothing
    const transientBoost = { sub: 10.0, bass: 10.0, mid: 10.0, treble: 10.0 };
    const newBaselines = { ...prevState.baselines };
    const updateBand = (raw: number, key: string) => {
        if (newBaselines[key] === null) {
            newBaselines[key] = raw;
            return raw;
        }
        const delta = Math.max(0, raw - newBaselines[key]!) * 0.005;
        const transient = delta * (transientBoost as any)[key];
        return Math.min(1, raw + transient);
    };

    const reactiveSubValue = updateBand(rawSub, 'sub');
    const reactiveBassValue = updateBand(rawBass, 'bass');
    const reactiveMidValue = updateBand(rawMid, 'mid');
    const reactiveTrebleValue = updateBand(rawTreble, 'treble');

    // 5. Final Adaptive Smoothing
    const adaptiveSmooth = (current: number, target: number) => {
        const delta = target - current;
        const attack = delta > 0 ? 0.9 : 0.05; // Fast attack (0.9), very slow release (0.05)
        return current + delta * attack;
    };

    const expandRange = (v: number) => {
        return Math.min(1, (v * 0.3) + (Math.pow(v, 7) * 0.7)); // linear + exponential curve
    };

    const pSub = adaptiveSmooth(prevState.smoothed.sub, expandRange(reactiveSubValue));
    const pBass = adaptiveSmooth(prevState.smoothed.bass, expandRange(reactiveBassValue));
    const pMid = adaptiveSmooth(prevState.smoothed.mid, expandRange(reactiveMidValue));
    const pTreble = adaptiveSmooth(prevState.smoothed.treble, expandRange(reactiveTrebleValue));

    return {
        baselines: newBaselines,
        smoothed: { sub: pSub, bass: pBass, mid: pMid, treble: pTreble },
        prevBins: bins
    };
};