
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
        this.channelShift(imageData, intensity, threshold);
        break;
      case 'BIT_CRUSH':
        this.bitCrush(imageData, intensity, threshold);
        break;
      case 'SCAN_LINES':
        this.scanLines(imageData, intensity, threshold);
        break;
      case 'DEEP_FRY':
        this.deepFry(imageData, intensity, threshold);
        break;
      case 'WAVE_DISTORTION':
        this.waveDistortion(imageData, intensity, threshold);
        break;
      case 'DATA_CORRUPTION':
        this.dataCorruption(imageData, intensity, threshold);
        break;
      case 'COLOR_BLEED':
        this.colorBleed(imageData, intensity, threshold);
        break;
      case 'COMPRESSION_HELL':
        this.compressionHell(imageData, intensity, threshold);
        break;
      case 'RANDOM_CHAOS':
        this.randomChaos(imageData, intensity, threshold);
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
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Invert threshold so 0 = no effect (high threshold), 100 = max effect (low threshold)
    // Map 0-100 to 255-0 range roughly
    const t = (100 - threshold) * 2.55;

    // Use intensity to control how "long" the sort streaks can get or probability of sorting
    // Higher intensity = more vertical streaks
    const triggerProb = intensity / 100;

    for (let x = 0; x < width; x++) {
      let sortStart = -1;
      // Randomly skip columns based on intensity to create "streaky" look
      if (this.rand() > triggerProb) continue;

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
      // Finish any pending sort at bottom
      if (sortStart !== -1) {
        this.sortColumnSegment(pixels, width, x, sortStart, height);
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

  private channelShift(imageData: ImageData, intensity: number, threshold: number) {
    const pixels = imageData.data;
    const scale = Math.max(1, imageData.width / 800);

    // Intensity = Horizontal Shift, Threshold = Vertical Shift
    const shiftX = Math.floor(intensity * 1.5 * scale);
    const shiftY = Math.floor(threshold * 0.5 * scale);

    if (intensity === 0 && threshold === 0) return;

    const temp = new Uint8ClampedArray(pixels);
    const width = imageData.width;
    const height = imageData.height;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;

        let sourceY = y - shiftY;
        let sourceX = x - shiftX;
        if (sourceY >= 0 && sourceX >= 0) {
          const sourceI = (sourceY * width + sourceX) * 4;
          pixels[i] = temp[sourceI];
        }

        sourceY = y + shiftY;
        sourceX = x + shiftX;
        if (sourceY < height && sourceX < width) {
          const sourceI = (sourceY * width + sourceX) * 4;
          pixels[i + 2] = temp[sourceI + 2];
        }
      }
    }
  }

  private bitCrush(imageData: ImageData, intensity: number, threshold: number) {
    const pixels = imageData.data;
    // Intensity = Quantization (Color depth)
    const qFactor = Math.floor(Math.pow(intensity / 10, 2.2)) + 1;
    // Threshold = Resampling (Pixelation)
    const scale = Math.max(1, imageData.width / 800);
    const rFactor = Math.max(1, Math.floor((threshold / 10) * scale));

    for (let y = 0; y < imageData.height; y += rFactor) {
      for (let x = 0; x < imageData.width; x += rFactor) {
        const i = (y * imageData.width + x) * 4;

        let r = pixels[i];
        let g = pixels[i + 1];
        let b = pixels[i + 2];

        if (qFactor > 1) {
          r = Math.floor(r / qFactor) * qFactor;
          g = Math.floor(g / qFactor) * qFactor;
          b = Math.floor(b / qFactor) * qFactor;
        }

        for (let dy = 0; dy < rFactor && y + dy < imageData.height; dy++) {
          for (let dx = 0; dx < rFactor && x + dx < imageData.width; dx++) {
            const targetI = ((y + dy) * imageData.width + (x + dx)) * 4;
            pixels[targetI] = r;
            pixels[targetI + 1] = g;
            pixels[targetI + 2] = b;
          }
        }
      }
    }
  }

  private scanLines(imageData: ImageData, intensity: number, threshold: number) {
    const pixels = imageData.data;
    const width = imageData.width;
    const opacity = intensity / 100;
    const scale = Math.max(1, imageData.width / 800);
    // Threshold = Line Spacing (0-100 maps to 2-10 pixels)
    const spacing = Math.max(2, Math.floor(2 + (threshold / 10) * scale));

    for (let y = 0; y < imageData.height; y++) {
      if (Math.floor(y / scale) % spacing === 0) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          const rMult = 1 - opacity;
          const gMult = 1 - (opacity * 0.8);
          const bMult = 1 - (opacity * 0.9);
          pixels[i] *= rMult;
          pixels[i + 1] *= gMult;
          pixels[i + 2] *= bMult;
        }
      }
    }
  }

  private deepFry(imageData: ImageData, intensity: number, threshold: number) {
    const pixels = imageData.data;
    // Intensity = Heat (Contrast/Brightness)
    const contrast = 1 + (Math.pow(intensity / 20, 2));
    const brightness = (intensity * 1.5);
    // Threshold = Posterize (Number of levels, 255 down to 2)
    const levels = Math.max(2, 255 - Math.floor(threshold * 2.5));

    for (let i = 0; i < pixels.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        let val = pixels[i + c];
        val = (val - 128) * contrast + 128 + brightness;

        // Posterize
        val = Math.floor(val / (256 / levels)) * (256 / levels);

        pixels[i + c] = Math.min(255, Math.max(0, val));
      }

      if (intensity > 50) {
        const max = Math.max(pixels[i], pixels[i + 1], pixels[i + 2]);
        if (pixels[i] !== max) pixels[i] *= 0.8;
        if (pixels[i + 1] !== max) pixels[i + 1] *= 0.8;
        if (pixels[i + 2] !== max) pixels[i + 2] *= 0.8;
      }
    }
  }

  private waveDistortion(imageData: ImageData, intensity: number, threshold: number) {
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    if (intensity === 0) return;

    const temp = new Uint8ClampedArray(pixels);
    const scale = Math.max(1, width / 800);

    // Intensity = Amplitude, Threshold = Frequency
    // Lower threshold = higher frequency (more waves)
    const freq = Math.max(1, 100 * scale - (threshold * 0.9 * scale));
    const amp = (intensity * 2) * scale;
    const phase = this.rand() * Math.PI * 2;

    for (let y = 0; y < height; y++) {
      let xOffset = Math.sin((y / freq) + phase) * amp;
      xOffset += Math.cos((y / (freq * 0.5)) - phase) * (amp * 0.2);

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

  private dataCorruption(imageData: ImageData, intensity: number, threshold: number) {
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const scale = Math.max(1, width / 800);

    // Intensity = Motion Vector Length (number of recursive shifts)
    const iterations = Math.floor(intensity / 10) + 1;
    // Threshold = Block Density/Quantity
    const blockDensity = threshold / 100;

    // Use macroblocks (16x16 standard for many codecs, scaled for res)
    const blockSize = Math.floor(16 * scale);

    // Helper to get pixel from coordinates safely
    const getPixel = (x: number, y: number) => {
      const i = (y * width + x) * 4;
      return [pixels[i], pixels[i + 1], pixels[i + 2]];
    };

    // Helper to set pixel safely
    const setPixel = (x: number, y: number, r: number, g: number, b: number) => {
      if (x < 0 || x >= width || y < 0 || y >= height) return;
      const i = (y * width + x) * 4;
      pixels[i] = r;
      pixels[i + 1] = g;
      pixels[i + 2] = b;
    };

    // Partition image into blocks
    for (let by = 0; by < height; by += blockSize) {
      for (let bx = 0; bx < width; bx += blockSize) {

        // Randomly choose if this block "moshes"
        if (this.rand() < blockDensity) {

          // Choose a motion vector for this block
          const vx = Math.floor((this.rand() - 0.5) * 20 * scale);
          const vy = Math.floor((this.rand() - 0.5) * 20 * scale);

          if (vx === 0 && vy === 0) continue;

          // Repeat the displacement (iterations) to create the "trail"
          for (let iter = 0; iter < iterations; iter++) {

            // To mosh, we take the CURRENT data in the block's path and "push" it
            // This is most easily done by copying the block data and pasting it offset
            // But we must do it for ALL pixels in the block

            // Optimization: iterate range
            const startY = Math.max(0, by);
            const endY = Math.min(height, by + blockSize);
            const startX = Math.max(0, bx);
            const endX = Math.min(width, bx + blockSize);

            // Sample the block
            const blockData: number[][] = [];
            for (let py = startY; py < endY; py++) {
              for (let px = startX; px < endX; px++) {
                const i = (py * width + px) * 4;
                blockData.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
              }
            }

            // Paste the block offset
            let idx = 0;
            for (let py = startY; py < endY; py++) {
              for (let px = startX; px < endX; px++) {
                const tx = px + vx;
                const ty = py + vy;

                if (tx >= 0 && tx < width && ty >= 0 && ty < height) {
                  const targetI = (ty * width + tx) * 4;
                  const [r, g, b] = blockData[idx];

                  // Overwrite with a slight blend for "persistence"
                  pixels[targetI] = r;
                  pixels[targetI + 1] = g;
                  pixels[targetI + 2] = b;
                }
                idx++;
              }
            }
          }
        }
      }
    }
  }

  private colorBleed(imageData: ImageData, intensity: number, threshold: number) {
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const scale = Math.max(1, width / 800);

    // Intensity = Bleed Amount
    const bleedAmount = Math.floor((intensity / 3) * scale);
    // Threshold = Ghosting (secondary shift)
    const ghostShift = Math.floor((threshold / 5) * scale);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width - bleedAmount; x++) {
        const i = (y * width + x) * 4;
        const sourceI = (y * width + (x + bleedAmount)) * 4;
        pixels[i + 2] = (pixels[i + 2] + pixels[sourceI + 2]) / 2;
      }
      for (let x = width - 1; x > bleedAmount; x--) {
        const i = (y * width + x) * 4;
        const sourceI = (y * width + (x - bleedAmount)) * 4;
        pixels[i] = (pixels[i] + pixels[sourceI]) / 2;
      }

      if (ghostShift > 0) {
        for (let x = width - 1; x > ghostShift; x--) {
          const i = (y * width + x) * 4;
          const sourceI = (y * width + (x - ghostShift)) * 4;
          pixels[i + 1] = (pixels[i + 1] + pixels[sourceI + 1]) / 1.5;
        }
      }
    }
  }

  private compressionHell(imageData: ImageData, intensity: number, threshold: number) {
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const scale = Math.max(1, width / 800);

    // Intensity = Block size (8x8 is JPEG standard, we scale it)
    const blockSize = Math.max(2, Math.floor((4 + (intensity / 10)) * scale));
    // Threshold = Artifacting (Compression level)
    const factor = (threshold / 10);

    for (let y = 0; y < height; y += blockSize) {
      for (let x = 0; x < width; x += blockSize) {
        let rSum = 0, gSum = 0, bSum = 0;
        let count = 0;

        // Calculate average for the block
        for (let dy = 0; dy < blockSize && y + dy < height; dy++) {
          for (let dx = 0; dx < blockSize && x + dx < width; dx++) {
            const i = ((y + dy) * width + (x + dx)) * 4;
            rSum += pixels[i];
            gSum += pixels[i + 1];
            bSum += pixels[i + 2];
            count++;
          }
        }

        const rAvg = rSum / count;
        const gAvg = gSum / count;
        const bAvg = bSum / count;

        // Apply average with JPEG-like "ringing" noise based on threshold
        for (let dy = 0; dy < blockSize && y + dy < height; dy++) {
          for (let dx = 0; dx < blockSize && x + dx < width; dx++) {
            const i = ((y + dy) * width + (x + dx)) * 4;

            // Quantization effect
            const q = 1 + factor * 2;
            let nr = Math.floor(rAvg / q) * q;
            let ng = Math.floor(gAvg / q) * q;
            let nb = Math.floor(bAvg / q) * q;

            // Add pseudo-DCT ringing noise
            if (factor > 2) {
              const ring = Math.sin((dx + dy) * (1 / scale)) * (factor * 2);
              nr += ring;
              ng += ring;
              nb += ring;
            }

            pixels[i] = Math.min(255, Math.max(0, nr));
            pixels[i + 1] = Math.min(255, Math.max(0, ng));
            pixels[i + 2] = Math.min(255, Math.max(0, nb));
          }
        }
      }
    }
  }

  private randomChaos(imageData: ImageData, intensity: number, threshold: number) {
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const scale = Math.max(1, width / 800);

    // Threshold = Jitter/BlockSize
    const blockSize = Math.max(1, Math.floor((threshold / 10) * scale));
    // Intensity = Entropy (Probability)
    const probThreshold = 1 - Math.pow(intensity / 100, 0.5) * 0.5;

    for (let y = 0; y < height; y += blockSize) {
      for (let x = 0; x < width; x += blockSize) {
        if (this.rand() > probThreshold) {
          const chaos = this.rand();
          for (let dy = 0; dy < blockSize && y + dy < height; dy++) {
            for (let dx = 0; dx < blockSize && x + dx < width; dx++) {
              const i = ((y + dy) * width + (x + dx)) * 4;
              if (chaos < 0.3) { pixels[i] = 255 - pixels[i]; }
              else if (chaos < 0.6) { pixels[i + 1] = pixels[i + 2]; }
              else { pixels[i + 2] = 255; }
            }
          }
        }
      }
    }
  }
}

export const glitchEngine = new GlitchEngine();
