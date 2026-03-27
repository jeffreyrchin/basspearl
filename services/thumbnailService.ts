import { GlitchEngine } from './glitchEngine';
import { EffectConfig } from '../types';
import { THUMBNAIL_SIZE } from '../constants';
import { EFFECT_METADATA } from '../config/effects';

// The single engine we share for all thumbnails
let engine: GlitchEngine | null = null;

// Serial queue - all renders happen one-by-one to avoid WebGL state corruption
let queue: Promise<void> = Promise.resolve();

// Global cache: type -> dataUrl
// This prevents re-rendering thumbnails every time the tab is switched
const THUMBNAIL_CACHE = new Map<string, string>();

// Scratch canvas for one-off thumbnail rendering
let scratchCanvas: HTMLCanvasElement | null = null;
const getScratchCanvas = () => {
    if (!scratchCanvas) {
        scratchCanvas = document.createElement('canvas');
        scratchCanvas.width = THUMBNAIL_SIZE;
        scratchCanvas.height = THUMBNAIL_SIZE;
    }
    return scratchCanvas;
};

const getEngine = (): GlitchEngine => {
    if (!engine) engine = new GlitchEngine();
    return engine;
};

const getThumbnailBackground = (effects: EffectConfig[]): string => {
    if (effects.length === 1) {
        const effect = EFFECT_METADATA[effects[0].type];
        if (effect.category === 'Pattern') {
            return "./black.png";
        } else if (effect.category === 'Color') {
            return "./clocktower_square.png";
        } else if (effect.category === 'Spatial') {
            return "./sunset_square.jpeg";
        } else if (effect.category === 'Distort') {
            return "./girlvibe_square.jpeg";
        }
    } else {
        return "./black.png";
    }
};

/**
 * Returns a static DataURL for an effect type. 
 * Resolves immediately if cached, otherwise queues a background render.
 */
export const getThumbnailDataUrl = (effects: EffectConfig[]): Promise<string> => {
    const cacheKey = effects.map(e => e.type).sort().join('|');
    const cached = THUMBNAIL_CACHE.get(cacheKey);
    if (cached) return Promise.resolve(cached);

    const task = queue.then(async () => {
        // Double-check cache in case it was rendered while waiting in queue
        const stillCached = THUMBNAIL_CACHE.get(cacheKey);
        if (stillCached) return stillCached;

        const eng = getEngine();
        const canvas = getScratchCanvas();

        const imageSrc = getThumbnailBackground(effects);

        // Use a static frame (time=10.0) for the cached poster
        await eng.renderToCanvas(canvas, imageSrc, effects, {
            maxSize: THUMBNAIL_SIZE,
            currentTime: 10.0,
            reactivity: { sub: 0.9, bass: 0.9, mid: 0.9, treble: 0.9 },
            imagelessWidth: THUMBNAIL_SIZE,
            imagelessHeight: THUMBNAIL_SIZE
        });

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        THUMBNAIL_CACHE.set(cacheKey, dataUrl);
        return dataUrl;
    });

    // Advance the queue
    queue = task.then(() => { }).catch(() => { });
    return task as any;
};

export const renderThumbnail = (
    targetCanvas: HTMLCanvasElement,
    effects: EffectConfig[],
    currentTime: number
): Promise<void> => {
    const task = queue.then(async () => {
        const eng = getEngine();

        const imageSrc = getThumbnailBackground(effects);

        // Generate Synthetic Reactivity for thumbnail animation
        const beat = Math.pow(Math.abs(Math.sin(currentTime * 2)), 0.5);
        const syntheticSmoothed = {
            sub: beat,
            bass: beat,
            mid: beat,
            treble: beat
        };

        // Render directly using the zero-allocation reactivity path
        await eng.renderToCanvas(targetCanvas, imageSrc, effects, {
            maxSize: THUMBNAIL_SIZE,
            currentTime,
            reactivity: syntheticSmoothed,
            imagelessWidth: THUMBNAIL_SIZE,
            imagelessHeight: THUMBNAIL_SIZE
        });
    });

    // Advance the queue; swallow per-task errors so the queue never stalls
    queue = task.catch(() => { });
    return task;
};

export const getCachedThumbnail = (effects: EffectConfig[]): string | null => {
    const cacheKey = effects.map(e => e.type).sort().join('|');
    return THUMBNAIL_CACHE.get(cacheKey) || null;
};