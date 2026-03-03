import { GlitchEngine } from './glitchEngine';
import { GlitchEffectType, EffectConfig } from '../types';
import { EFFECT_METADATA } from '../constants';
import { mapReactivityToEffects } from './calculateReactiveEffects';

// The single engine we share for all thumbnails
let engine: GlitchEngine | null = null;

// Serial queue - all renders happen one-by-one to avoid WebGL state corruption
let queue: Promise<void> = Promise.resolve();

const getEngine = (): GlitchEngine => {
    if (!engine) engine = new GlitchEngine();
    return engine;
};

export const renderThumbnail = (
    targetCanvas: HTMLCanvasElement,
    type: GlitchEffectType,
    currentTime: number
): Promise<void> => {
    const task = queue.then(async () => {
        const eng = getEngine();
        const meta = EFFECT_METADATA[type];
        if (!meta) return;

        let imageSrc = "./girlvibe_square.jpeg";
        if (type === 'STARFIELD' || type === 'RETRO_GRID') {
            imageSrc = "./black.png";
        }

        // 1. Generate Synthetic Reactivity
        const beat = Math.pow(Math.abs(Math.sin(currentTime * 2)), 0.5);
        const syntheticSmoothed = {
            sub: beat,
            bass: beat,
            mid: beat,
            treble: beat
        };

        // 2. Create the baseline effect config
        const baselineEffect: EffectConfig = {
            id: 'preview',
            type,
            params: meta.params.map(p => ({
                param: p.name,
                value: p.previewValue ?? p.defaultValue,
                min: p.previewMin ?? p.defaultMin ?? 0,
                frequencyBand: p.previewBand ?? p.defaultBand
            })),
            muted: false,
            soloed: false,
            melded: false,
            seed: 1 // seed 0 causes issues with tile shader density (black bottom-left tile)
        };

        // 3. Apply the "Fake Beat" to the effect
        const reactiveEffects = mapReactivityToEffects(
            syntheticSmoothed,
            [baselineEffect],
            Math.floor(currentTime * 60)
        );

        await eng.renderToCanvas(targetCanvas, imageSrc, reactiveEffects, {
            maxSize: 256,
            currentTime,
            imagelessWidth: 256,
            imagelessHeight: 256
        });
    });

    // Advance the queue; swallow per-task errors so the queue never stalls
    queue = task.catch(() => { });
    return task;
};
