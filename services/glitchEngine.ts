
import { EffectConfig, GlitchEffectType } from '../types';
import { GlitchAlgorithms, GlitchParams } from './glitchAlgorithms';

export class GlitchEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    const context = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Could not create canvas context');
    this.ctx = context;
  }

  private currentImageSrc: string | null = null;
  private currentImage: HTMLImageElement | null = null;

  public async processImage(imageSrc: string, effects: EffectConfig[], shouldWatermark: boolean = false, maxSize?: number): Promise<string> {
    await this.processInternal(imageSrc, effects, shouldWatermark, maxSize);
    return this.canvas.toDataURL('image/png');
  }

  public async renderToCanvas(targetCanvas: HTMLCanvasElement, imageSrc: string, effects: EffectConfig[], shouldWatermark: boolean = false, maxSize?: number): Promise<void> {
    await this.processInternal(imageSrc, effects, shouldWatermark, maxSize);

    // Copy internal canvas to target canvas
    targetCanvas.width = this.canvas.width;
    targetCanvas.height = this.canvas.height;
    const ctx = targetCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(this.canvas, 0, 0);
    }
  }

  private async processInternal(imageSrc: string, effects: EffectConfig[], shouldWatermark: boolean = false, maxSize?: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const processCachedImage = (img: HTMLImageElement) => {
        let width = img.width;
        let height = img.height;

        const UNIT = Math.min(width, height) / 100;
        const normalizedScale = Math.max(1, Math.min(width, height) / 800);

        if (maxSize && (width > maxSize || height > maxSize)) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx.drawImage(img, 0, 0, width, height);

        // Apply active effects sequentially
        effects.filter(e => e.active).forEach(effect => {
          this.applyEffect(effect, UNIT, normalizedScale);
        });

        resolve();
      };

      if (this.currentImageSrc === imageSrc && this.currentImage) {
        processCachedImage(this.currentImage);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.currentImageSrc = imageSrc;
        this.currentImage = img;
        processCachedImage(img);
      };
      img.onerror = reject;
      img.src = imageSrc;
    });
  }

  private currentRng: () => number = Math.random;

  private applyEffect(effect: EffectConfig, UNIT: number, scale: number) {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const { intensity, threshold, seed } = effect;

    // Initialize RNG
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
      default:
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

export const glitchEngine = new GlitchEngine();
