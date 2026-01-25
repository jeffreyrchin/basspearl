
import { EffectConfig, GlitchEffectType } from '../types';

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
    return new Promise((resolve, reject) => {
      const processCachedImage = (img: HTMLImageElement) => {
        let width = img.width;
        let height = img.height;

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
          this.applyEffect(effect);
        });

        if (shouldWatermark) {
          this.applyWatermark();
        }

        resolve(this.canvas.toDataURL('image/png'));
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

  private applyWatermark() {
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Scale font size based on image width, but keep it within reasonable bounds
    const fontSize = Math.max(20, Math.floor(width * 0.04));

    this.ctx.save();
    // Use Genos font to match the header, fallback to sans-serif
    this.ctx.font = `bold ${fontSize}px "Genos", sans-serif`;
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'bottom';

    // Add some padding from the edge
    const padding = Math.floor(fontSize * 0.5);

    // High contrast stroke (outline)
    this.ctx.lineWidth = Math.max(2, fontSize * 0.08);
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeText('GlitchBrain', width - padding, height - padding);

    // Bright fill
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.fillText('GlitchBrain', width - padding, height - padding);

    this.ctx.restore();
  }

  private currentRng: () => number = Math.random;

  private applyEffect(effect: EffectConfig) {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const pixels = imageData.data;
    const { intensity, threshold, seed } = effect;

    // Initialize RNG
    if (seed !== undefined) {
      this.currentRng = this.createSeededRng(seed);
    } else {
      this.currentRng = Math.random;
    }

    switch (effect.type) {
      case 'PIXEL_SORT':
        this.pixelSort(imageData, intensity, threshold);
        break;
      case 'CHANNEL_SHIFT':
        this.channelShift(imageData, intensity);
        break;
      case 'BIT_CRUSH':
        this.bitCrush(imageData, intensity);
        break;
      case 'SCAN_LINES':
        this.scanLines(imageData, intensity);
        break;
      case 'DEEP_FRY':
        this.deepFry(imageData, intensity);
        break;
      case 'WAVE_DISTORTION':
        this.waveDistortion(imageData, intensity);
        break;
      case 'DATA_CORRUPTION':
        this.dataCorruption(imageData, intensity);
        break;
      case 'COLOR_BLEED':
        this.colorBleed(imageData, intensity);
        break;
      case 'COMPRESSION_HELL':
        this.compressionHell(imageData, intensity);
        break;
      case 'RANDOM_CHAOS':
        this.randomChaos(imageData, intensity);
        break;
      default:
        break;
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  // Simple Mulberry32 seeded RNG
  private createSeededRng(seed: number) {
    return function () {
      var t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
  }

  private rand(): number {
    return this.currentRng();
  }

  private pixelSort(imageData: ImageData, intensity: number, threshold: number) {
    // ... existing pixelSort implementation (no random)
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const t = threshold * 2.55;

    for (let x = 0; x < width; x++) {
      let sortStart = -1;
      for (let y = 0; y < height; y++) {
        const i = (y * width + x) * 4;
        const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;

        if (brightness > t) {
          if (sortStart === -1) sortStart = y;
        } else if (sortStart !== -1) {
          this.sortColumnSegment(pixels, width, x, sortStart, y);
          sortStart = -1;
        }
      }
    }
  }

  private sortColumnSegment(pixels: Uint8ClampedArray, width: number, x: number, startY: number, endY: number) {
    const segment = [];
    for (let y = startY; y < endY; y++) {
      const i = (y * width + x) * 4;
      segment.push([pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]]);
    }
    segment.sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]));
    for (let y = startY; y < endY; y++) {
      const i = (y * width + x) * 4;
      const [r, g, b, a] = segment[y - startY];
      pixels[i] = r;
      pixels[i + 1] = g;
      pixels[i + 2] = b;
      pixels[i + 3] = a;
    }
  }

  private channelShift(imageData: ImageData, intensity: number) {
    const pixels = imageData.data;
    // Scale shift based on width relative to preview size (800px)
    const scale = Math.max(1, imageData.width / 800);
    const shift = Math.floor(intensity * 0.5 * scale);
    const temp = new Uint8ClampedArray(pixels);

    for (let i = 0; i < pixels.length; i += 4) {
      const shiftedIndex = i + shift * 4;
      if (shiftedIndex < pixels.length) {
        pixels[i] = temp[shiftedIndex];
      }
      const shiftedIndexBlue = i - shift * 4;
      if (shiftedIndexBlue >= 0) {
        pixels[i + 2] = temp[shiftedIndexBlue];
      }
    }
  }

  private bitCrush(imageData: ImageData, intensity: number) {
    const pixels = imageData.data;
    const factor = Math.max(1, Math.floor(intensity / 10));
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = Math.floor(pixels[i] / factor) * factor;
      pixels[i + 1] = Math.floor(pixels[i + 1] / factor) * factor;
      pixels[i + 2] = Math.floor(pixels[i + 2] / factor) * factor;
    }
  }

  private scanLines(imageData: ImageData, intensity: number) {
    const pixels = imageData.data;
    const width = imageData.width;
    const opacity = intensity / 200;
    // Scale line spacing? 
    // Standard: 1 line every 3 pixels. 
    // Scaled: 1 line every 3 * scale pixels? That would make lines thicker.
    // For scanlines, standard behavior is usually per-pixel. 
    // If we scale it, it might stop looking like scanlines and look like stripes.
    // Let's keep per-pixel but maybe adjust intensity logic if needed. 
    // Actually, on high-res, 1px scanlines are invisible. 
    // Let's try scaling the spacing.
    const scale = Math.max(1, Math.floor(imageData.width / 800));
    const spacing = 3 * scale;

    for (let y = 0; y < imageData.height; y++) {
      if (Math.floor(y / scale) % 3 === 0) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          pixels[i] *= (1 - opacity);
          pixels[i + 1] *= (1 - opacity);
          pixels[i + 2] *= (1 - opacity);
        }
      }
    }
  }

  private deepFry(imageData: ImageData, intensity: number) {
    const pixels = imageData.data;
    const contrast = 1 + (intensity / 50);
    const brightness = (intensity / 10);
    for (let i = 0; i < pixels.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        let val = (pixels[i + c] - 128) * contrast + 128 + brightness;
        pixels[i + c] = Math.min(255, Math.max(0, val));
      }
    }
  }

  private waveDistortion(imageData: ImageData, intensity: number) {
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const temp = new Uint8ClampedArray(pixels);

    const scale = Math.max(1, width / 800);
    const freq = Math.max(1, (intensity / 5) * scale); // Scale frequency? No, freq is wavelength divisor. 
    // sin(y / freq). If y doubles, freq must double to keep same wave count.
    const amp = (intensity / 2) * scale;

    for (let y = 0; y < height; y++) {
      const xOffset = Math.sin(y / freq) * amp;
      for (let x = 0; x < width; x++) {
        const sourceX = Math.floor(x + xOffset);
        if (sourceX >= 0 && sourceX < width) {
          const targetIdx = (y * width + x) * 4;
          const sourceIdx = (y * width + sourceX) * 4;
          pixels[targetIdx] = temp[sourceIdx];
          pixels[targetIdx + 1] = temp[sourceIdx + 1];
          pixels[targetIdx + 2] = temp[sourceIdx + 2];
          pixels[targetIdx + 3] = temp[sourceIdx + 3];
        }
      }
    }
  }

  private dataCorruption(imageData: ImageData, intensity: number) {
    const pixels = imageData.data;
    const numBlocks = Math.floor(intensity / 2);
    const width = imageData.width;
    const height = imageData.height;

    const scale = Math.max(1, width / 800);

    for (let b = 0; b < numBlocks; b++) {
      const bx = this.rand() * width;
      const by = this.rand() * height;
      const bw = this.rand() * (width / 4); // Already relative to width
      const bh = this.rand() * 20 * scale; // Scale height!
      const shiftX = (this.rand() - 0.5) * intensity * scale; // Scale shift

      for (let y = Math.floor(by); y < Math.min(height, by + bh); y++) {
        for (let x = Math.floor(bx); x < Math.min(width, bx + bw); x++) {
          const i = (y * width + x) * 4;
          const si = (y * width + Math.floor(Math.max(0, Math.min(width - 1, x + shiftX)))) * 4;
          pixels[i] = pixels[si];
          pixels[i + 1] = pixels[si + 1];
          pixels[i + 2] = pixels[si + 2];
        }
      }
    }
  }

  private colorBleed(imageData: ImageData, intensity: number) {
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const scale = Math.max(1, width / 800);
    const bleedAmount = Math.floor((intensity / 5) * scale);

    for (let y = 0; y < height; y++) {
      for (let x = width - 1; x > bleedAmount; x--) {
        const i = (y * width + x) * 4;
        const sourceI = (y * width + (x - bleedAmount)) * 4;
        // Bleed red channel
        pixels[i] = (pixels[i] + pixels[sourceI]) / 2;
      }
    }
  }

  private compressionHell(imageData: ImageData, intensity: number) {
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const scale = Math.max(1, width / 800);
    // Base block size on preview resolution (intensity / 10), then scale up
    const baseBlockSize = Math.max(1, Math.floor(intensity / 10));
    const blockSize = Math.floor(baseBlockSize * scale);

    for (let y = 0; y < height; y += blockSize) {
      for (let x = 0; x < width; x += blockSize) {
        const i = (y * width + x) * 4;
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];

        for (let dy = 0; dy < blockSize && y + dy < height; dy++) {
          for (let dx = 0; dx < blockSize && x + dx < width; dx++) {
            const targetI = ((y + dy) * width + (x + dx)) * 4;
            pixels[targetI] = r;
            pixels[targetI + 1] = g;
            pixels[targetI + 2] = b;
          }
        }
      }
    }
  }

  private randomChaos(imageData: ImageData, intensity: number) {
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const scale = Math.max(1, width / 800);
    const blockSize = Math.max(1, Math.floor(scale)); // Pixelated noise on high res

    const threshold = 1 - (intensity / 100);

    for (let y = 0; y < height; y += blockSize) {
      for (let x = 0; x < width; x += blockSize) {

        if (this.rand() > threshold) {
          const chaos = this.rand();

          // Apply chaos to the whole block
          for (let dy = 0; dy < blockSize && y + dy < height; dy++) {
            for (let dx = 0; dx < blockSize && x + dx < width; dx++) {
              const i = ((y + dy) * width + (x + dx)) * 4;

              if (chaos < 0.3) {
                pixels[i] = 255 - pixels[i]; // Invert
              } else if (chaos < 0.6) {
                pixels[i + 1] = pixels[i + 2]; // Swizzling
              } else {
                pixels[i + 2] = 255; // Blue spike
              }
            }
          }
        }
      }
    }
  }
}

export const glitchEngine = new GlitchEngine();
