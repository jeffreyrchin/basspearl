
import { EffectConfig, GlitchEffectType } from '../types';
import { GlitchAlgorithms, GlitchParams } from './glitchAlgorithms';

interface WorkerMessage {
    id: string;
    type: 'PROCESS';
    imageBitmap: ImageBitmap;
    effects: EffectConfig[];
}

interface WorkerResponse {
    id: string;
    success: boolean;
    imageBitmap?: ImageBitmap;
    error?: string;
}

class GlitchWorkerEngine {
    private canvas: OffscreenCanvas;
    private ctx: OffscreenCanvasRenderingContext2D;

    constructor() {
        this.canvas = new OffscreenCanvas(100, 100);
        const context = this.canvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new Error('Could not create worker canvas context');
        // @ts-ignore - OffscreenCanvasRenderingContext2D is compatible enough
        this.ctx = context;
    }

    public async process(imageBitmap: ImageBitmap, effects: EffectConfig[]): Promise<ImageBitmap> {
        const width = imageBitmap.width;
        const height = imageBitmap.height;

        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
        }

        this.ctx.drawImage(imageBitmap, 0, 0);

        const UNIT = Math.min(width, height) / 100;
        const normalizedScale = Math.max(1, Math.min(width, height) / 800);

        effects.filter(e => e.active).forEach(effect => {
            this.applyEffect(effect, UNIT, normalizedScale);
        });

        return this.canvas.transferToImageBitmap();
    }

    private currentRng: () => number = Math.random;

    private applyEffect(effect: EffectConfig, UNIT: number, scale: number) {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const { intensity, threshold, seed } = effect;

        if (seed !== undefined) {
            this.currentRng = this.createSeededRng(seed);
        } else {
            this.currentRng = Math.random;
        }

        const params: GlitchParams = {
            intensity,
            threshold,
            UNIT,
            random: () => this.currentRng()
        };

        switch (effect.type) {
            case 'PIXEL_SORT':
                GlitchAlgorithms.PIXEL_SORT(imageData.data, imageData.width, imageData.height, params);
                break;
            case 'CHANNEL_SHIFT':
                GlitchAlgorithms.CHANNEL_SHIFT(imageData.data, imageData.width, imageData.height, params);
                break;
            case 'BIT_CRUSH':
                GlitchAlgorithms.BIT_CRUSH(imageData.data, imageData.width, imageData.height, params);
                break;
            case 'SCAN_LINES':
                GlitchAlgorithms.SCAN_LINES(imageData.data, imageData.width, imageData.height, params);
                break;
            case 'DEEP_FRY':
                GlitchAlgorithms.DEEP_FRY(imageData.data, imageData.width, imageData.height, params);
                break;
            case 'WAVE_DISTORTION':
                GlitchAlgorithms.WAVE_DISTORTION(imageData.data, imageData.width, imageData.height, params);
                break;
            case 'DATA_CORRUPTION':
                GlitchAlgorithms.DATA_CORRUPTION(imageData.data, imageData.width, imageData.height, params);
                break;
            case 'COLOR_BLEED':
                GlitchAlgorithms.COLOR_BLEED(imageData.data, imageData.width, imageData.height, params);
                break;
            case 'COMPRESSION_HELL':
                GlitchAlgorithms.COMPRESSION_HELL(imageData.data, imageData.width, imageData.height, params);
                break;
            case 'RANDOM_CHAOS':
                GlitchAlgorithms.RANDOM_CHAOS(imageData.data, imageData.width, imageData.height, params);
                break;
            case 'ANALOG_NOISE':
                GlitchAlgorithms.ANALOG_NOISE(imageData.data, imageData.width, imageData.height, params);
                break;
            case 'HUE_ROTATION':
                GlitchAlgorithms.HUE_ROTATION(imageData.data, imageData.width, imageData.height, params);
                break;
            case 'INVERT_GHOST':
                GlitchAlgorithms.INVERT_GHOST(imageData.data, imageData.width, imageData.height, params);
                break;
        }

        this.ctx.putImageData(imageData, 0, 0);
    }

    private createSeededRng(seed: number) {
        return function () {
            var t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        }
    }
}

const engine = new GlitchWorkerEngine();

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
    if (e.data.type === 'PROCESS') {
        try {
            const resultBitmap = await engine.process(e.data.imageBitmap, e.data.effects);
            const response: WorkerResponse = {
                id: e.data.id,
                success: true,
                imageBitmap: resultBitmap
            };
            // @ts-ignore
            self.postMessage(response, [resultBitmap]);
        } catch (err) {
            console.error('Worker Error:', err);
            const response: WorkerResponse = {
                id: e.data.id,
                success: false,
                error: String(err)
            };
            self.postMessage(response);
        }
    }
};
