import { GlitchEngine } from './glitchEngine';
import { EffectConfig } from '../types';
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
    effects: EffectConfig[],
    currentTime: number
): Promise<void> => {
    const task = queue.then(async () => {
        const eng = getEngine();

        // Use black background for generators, girlvibe for filters
        const firstType = effects[0]?.type;
        let imageSrc = "./girlvibe_square.jpeg";
        if (firstType === 'STARFIELD' || firstType === 'RETRO_GRID' || firstType === 'ORGANIC_NOISE') {
            imageSrc = "./black.png";
        }

        // Generate Synthetic Reactivity
        const beat = Math.pow(Math.abs(Math.sin(currentTime * 2)), 0.5);
        const syntheticSmoothed = {
            sub: beat,
            bass: beat,
            mid: beat,
            treble: beat
        };

        // Apply "Fake Beat" to the effect stack
        const reactiveEffects = mapReactivityToEffects(
            syntheticSmoothed,
            effects,
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
