import { EffectConfig } from "@/types";
import { SHADER_REGISTRY } from "./glitchShaders";

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
        const len = Math.max(1, endBin - startBin);
        for (let i = startBin; i < endBin; i++) {
            const v = bins[i];
            sum += v * v;
        }
        return Math.sqrt(sum / len);
    };

    // 2. Extract frequency bands
    const subBins: [number, number] = [freqToBin(20), freqToBin(100)];
    const bassBins: [number, number] = [freqToBin(100), freqToBin(300)];
    const midBins: [number, number] = [freqToBin(300), freqToBin(1500)];
    const trebleBins: [number, number] = [freqToBin(1500), freqToBin(8000)];

    const rawSub = bandRMS(subBins[0], subBins[1]);
    const rawBass = bandRMS(bassBins[0], bassBins[1]);
    const rawMid = bandRMS(midBins[0], midBins[1]);
    const rawTreble = bandRMS(trebleBins[0], trebleBins[1]);

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
        const attack = delta > 0 ? 0.5 : 0.1;
        return current + delta * attack;
    };

    const expandRange = (v: number) => {
        const adjustedExponent = (v < 0.9) ? 5 : 1;
        return Math.min(1, Math.pow(v, adjustedExponent));
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

/**
 * Maps smoothed reactivity values to effect configurations.
 */
export const mapReactivityToEffects = (
    smoothed: { sub: number; bass: number; mid: number; treble: number },
    currentEffects: EffectConfig[],
    frameCount: number
) => {
    const { sub, bass, mid, treble } = smoothed;
    return currentEffects.map(effect => {
        let energyValue = bass; // Default to bass if not specified
        if (effect.frequencyBand === 'SUB') energyValue = sub;
        else if (effect.frequencyBand === 'BASS') energyValue = bass;
        else if (effect.frequencyBand === 'MID') energyValue = mid;
        else if (effect.frequencyBand === 'TREBLE') energyValue = treble;

        return {
            ...effect,
            params: effect.params.map((param, index) => {
                // Velocity/Speed parameters that control integrated motion should not be
                // modulated by instantaneous reactivity, as this causes teleporting.
                // The integration itself provides the smooth reactivity.
                const meta = SHADER_REGISTRY[effect.type];
                const shouldSkipModulation = meta?.velocityParamIndex === index;

                return {
                    ...param,
                    value: (param.reactive && !shouldSkipModulation) ? param.value * energyValue : param.value
                };
            }),
            seed: (effect.seed ?? 0) + frameCount
        };
    });
};