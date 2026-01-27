
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

        // RESOLUTION INDEPENDENT SCALING STRATEGY:
        // Instead of scaling "up" from 800px, we calculate a normalized "UNIT"
        // which represents exactly 1% of the image's smallest dimension.
        // All effects will use this UNIT to determine pixel sizes.

        // This guarantees that a "5% shift" is visually identical on
        // a 800px preview AND a 4000px export.
        const UNIT = Math.min(width, height) / 100;

        // Use a "Visual Scale" factor relative to 800px for effects that rely on strict pixel density (like noise)
        // normalizedScale of 1.0 = 800px image. 5.0 = 4000px image.
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
          // Pass both the absolute UNIT (for spatial transforms)
          // and normalizedScale (for texture density/noise frequency)
          this.applyEffect(effect, UNIT, normalizedScale);
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
    const fontSize = Math.max(24, Math.floor(width * 0.04));

    this.ctx.save();
    this.ctx.font = `800 ${fontSize}px "Genos", sans-serif`;
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'bottom';
    this.ctx.lineJoin = 'round';

    const padding = Math.floor(fontSize * 0.5);
    const glitchText = 'GLITCH';
    const brainText = 'BRAIN';
    const ioText = '.io';

    const ioWidth = this.ctx.measureText(ioText).width;
    const brainWidth = this.ctx.measureText(brainText).width;
    const xR = width - padding;
    const y = height - padding;

    // 1. Black Outline (Stroke)
    this.ctx.lineWidth = fontSize * 0.15;
    this.ctx.strokeStyle = '#000000';
    this.ctx.strokeText(ioText, xR, y);
    this.ctx.strokeText(brainText, xR - ioWidth, y);
    this.ctx.strokeText(glitchText, xR - ioWidth - brainWidth, y);

    // 2. Fills
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(ioText, xR, y);

    this.ctx.fillStyle = '#fb00ff';
    this.ctx.fillText(brainText, xR - ioWidth, y);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(glitchText, xR - ioWidth - brainWidth, y);

    this.ctx.restore();
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

    switch (effect.type) {
      case 'PIXEL_SORT':
        // Sort uses UNIT to ensure step size matches visual density
        this.pixelSort(imageData, intensity, threshold, UNIT);
        break;
      case 'CHANNEL_SHIFT':
        // Shift uses UNIT for distance
        this.channelShift(imageData, intensity, threshold, UNIT);
        break;
      case 'BIT_CRUSH':
        // Resampling uses UNIT scale for pixelation density consistency
        this.bitCrush(imageData, intensity, threshold, UNIT);
        break;
      case 'SCAN_LINES':
        // Spacing uses UNIT for relative thickness
        this.scanLines(imageData, intensity, threshold, UNIT);
        break;
      case 'DEEP_FRY':
        this.deepFry(imageData, intensity, threshold);
        break;
      case 'WAVE_DISTORTION':
        // Wave uses UNIT for amplitude and frequency
        this.waveDistortion(imageData, intensity, threshold, UNIT);
        break;
      case 'DATA_CORRUPTION':
        // Mosh uses UNIT for block sizes
        this.dataCorruption(imageData, intensity, threshold, UNIT);
        break;
      case 'COLOR_BLEED':
        // Bleed uses UNIT for distance
        this.colorBleed(imageData, intensity, threshold, UNIT);
        break;
      case 'COMPRESSION_HELL':
        // Compression blocks use UNIT to look visually identical
        this.compressionHell(imageData, intensity, threshold, UNIT);
        break;
      case 'RANDOM_CHAOS':
        // Chaos blocks use UNIT for visibility
        this.randomChaos(imageData, intensity, threshold, UNIT);
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

  private pixelSort(imageData: ImageData, intensity: number, threshold: number, UNIT: number) {
    // Early exit for very low intensity
    if (intensity < 5) return;

    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Invert threshold so 0 = no effect (high threshold), 100 = max effect (low threshold)
    // Map 0-100 to 255-0 range roughly
    const t = (100 - threshold) * 2.55;

    // Use intensity to control how "long" the sort streaks can get or probability of sorting
    // Higher intensity = more vertical streaks
    const triggerProb = intensity / 100;

    // Process every Nth column for better performance
    // Scale the step relative to UNIT to guarantee EXACT same striping density
    const baseStep = intensity < 30 ? 0.3 : intensity < 60 ? 0.2 : 0.1;
    // Step is now a percentage of width (UNIT), ensuring 1:1 match
    const step = Math.max(1, Math.floor(baseStep * UNIT));

    for (let x = 0; x < width; x += step) {
      // NORMALIZED RANDOMNESS:
      // To ensure the same "random" columns are sorted at different resolutions with the same seed,
      // we must rely on normalized X position (0.0 - 1.0) rather than absolute pixel index.
      // However, for pixel sort, simply scaling the step covers most of density matching.
      // We check randomness against the *virtual* column index to keep it consistent.

      let sortStart = -1;

      // Seed the RNG for this specific column based on Normalized X
      // This ensures column at 50% width always rolls the same dice
      const normalizedX = Math.floor((x / width) * 800); // Map to "virtual" 800px space
      const colSeed = (this.currentRng() + normalizedX) * 12345;

      // Simple hash for column probability
      const colRand = Math.abs(Math.sin(colSeed) * 10000) % 1;

      if (colRand > triggerProb) continue;

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

  private channelShift(imageData: ImageData, intensity: number, threshold: number, UNIT: number) {
    const pixels = imageData.data;
    // Intensity = Horizontal Shift (using UNIT scale for resolution independence)
    const shiftX = Math.floor(intensity * 0.2 * UNIT);
    // Threshold = Vertical Shift
    const shiftY = Math.floor(threshold * 0.1 * UNIT);

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

  private bitCrush(imageData: ImageData, intensity: number, threshold: number, UNIT: number) {
    const pixels = imageData.data;
    // Intensity = Quantization (Color depth)
    const qFactor = Math.floor(Math.pow(intensity / 10, 2.2)) + 1;

    // Threshold = Resampling (Pixelation)
    // Scale strictly by UNIT so a "pixel" is always X% of screen size
    const rFactor = Math.max(1, Math.floor((threshold * 0.1) * UNIT));

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

  private scanLines(imageData: ImageData, intensity: number, threshold: number, UNIT: number) {
    const pixels = imageData.data;
    const width = imageData.width;
    const opacity = intensity / 100;
    // Threshold = Line Spacing (relative to image size)
    const spacing = Math.max(2, Math.floor(2 + (threshold * 0.1 * UNIT)));

    for (let y = 0; y < imageData.height; y++) {
      // Use spacing directly since it's already UNIT scaled
      if (y % spacing === 0) {
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

  private waveDistortion(imageData: ImageData, intensity: number, threshold: number, UNIT: number) {
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    if (intensity === 0) return;

    const temp = new Uint8ClampedArray(pixels);

    // Intensity = Amplitude (relative to screen size)
    const amp = (intensity * 0.5 * UNIT);

    // Threshold = Frequency (Waves per screen HEIGHT)
    // We normalize the wave phase to the image height so it aligns perfectly.
    // 0-100 threshold maps to 1-50 waves vertically.
    const waves = Math.max(1, threshold * 0.5);

    // Normalized Phase Calculation
    // We use (y / height) which is 0.0 to 1.0
    // Then multiply by waves * 2PI to get the correct number of cycles.
    const verticalPhaseScale = (Math.PI * 2 * waves) / height;

    // Random starting phase (seeded)
    const startPhase = this.rand() * Math.PI * 2;

    for (let y = 0; y < height; y++) {
      // Use the normalized phase scale. 
      // Input 'y' cancels out the '/ height' part of scale effectively scaling to %
      const angle = y * verticalPhaseScale + startPhase;

      let xOffset = Math.sin(angle) * amp;

      // Add secondary harmonic (double frequency, lower amp)
      xOffset += Math.cos(angle * 2 - startPhase) * (amp * 0.2);

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

  private dataCorruption(imageData: ImageData, intensity: number, threshold: number, UNIT: number) {
    // Early exit for very low values
    if (intensity < 10 || threshold < 10) return;

    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Intensity = Motion Vector Length (number of recursive shifts matches logic depth)
    // Iterations don't need scaling, they determine "smear length" in steps
    const iterations = Math.min(3, Math.floor(intensity / 20) + 1);

    // Threshold = Block Density/Quantity (Probability doesn't need scaling)
    const blockDensity = threshold / 100;

    // Use macroblocks scaled to image size (~4% of screen unit)
    // Min block size of 16px to prevent tiny dust at low res
    const blockSize = Math.max(16, Math.floor(4 * UNIT));

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

    // NORMALIZED RNG LOOP:
    // Iterate over a fixed virtual grid based on the UNIT blocks to keep RNG stable.
    const blocksX = Math.ceil(width / blockSize);
    const blocksY = Math.ceil(height / blockSize);

    for (let by = 0; by < blocksY; by++) {
      for (let bx = 0; bx < blocksX; bx++) {

        // Randomly choose if this block "moshes"
        // RNG Sequence is now locked to the block index (bx, by)
        if (this.rand() < blockDensity) {

          // Choose a motion vector for this block (Scaled by UNIT)
          const vx = Math.floor((this.rand() - 0.5) * 5 * UNIT);
          const vy = Math.floor((this.rand() - 0.5) * 5 * UNIT);

          if (vx === 0 && vy === 0) continue;

          // Map back to pixel coordinates for the actual effect application
          const startY = Math.max(0, by * blockSize);
          const endY = Math.min(height, (by + 1) * blockSize);
          const startX = Math.max(0, bx * blockSize);
          const endX = Math.min(width, (bx + 1) * blockSize);

          // Repeat the displacement (iterations) to create the "trail"
          for (let iter = 0; iter < iterations; iter++) {

            // To mosh, we take the CURRENT data in the block's path and "push" it
            // This is most easily done by copying the block data and pasting it offset
            // But we must do it for ALL pixels in the block

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

  private colorBleed(imageData: ImageData, intensity: number, threshold: number, UNIT: number) {
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Intensity = Bleed Amount (Scaled by UNIT)
    const bleedAmount = Math.floor((intensity * 0.1) * UNIT);
    // Threshold = Ghosting (secondary shift)
    const ghostShift = Math.floor((threshold * 0.2) * UNIT);

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

  // compressionHell must scale BY UNIT for visual consistency, even if unrealistic for JPEGs
  private compressionHell(imageData: ImageData, intensity: number, threshold: number, UNIT: number) {
    // Early exit for very low values
    if (intensity < 10 && threshold < 10) return;

    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Intensity = Block size (Scaled by UNIT to match Editor)
    const blockSize = Math.max(2, Math.floor((4 + (intensity * 0.1)) * UNIT));
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

            // Simplified ringing - scale frequency by UNIT so waves look same size
            if (factor > 2) {
              const ring = Math.sin((dx + dy) * (1 / UNIT)) * (factor * 2);
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

  private randomChaos(imageData: ImageData, intensity: number, threshold: number, UNIT: number) {
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Threshold = Jitter/BlockSize (Scaled by UNIT)
    // Ensures noise blocks are visible on 4k screens
    const blockSize = Math.max(1, Math.floor((threshold * 0.1) * UNIT));

    // Intensity = Entropy (Probability)
    // Probability is density, so it doesn't need spatial scaling
    const probThreshold = 1 - Math.pow(intensity / 100, 0.5) * 0.5;

    // NORMALIZED RNG LOOP:
    // To keep the RNG sequence identical across resolutions, we must iterate
    // a fixed "Virtual Grid" regardless of the image size.
    // We iterate based on the "standard" 800px grid logic, then map to real pixels.
    // 1 UNIT = 1% width/height. We'll step by UNIT-based blocks.

    // Calculate how many blocks *would* fit in the image
    const blocksX = Math.ceil(width / blockSize);
    const blocksY = Math.ceil(height / blockSize);

    for (let by = 0; by < blocksY; by++) {
      for (let bx = 0; bx < blocksX; bx++) {
        // RNG Call #1: Determine if block is chaotic
        // Since we loop by block index (bx, by), this sequence is stable
        // as long as the relative block count is similar (which UNIT ensures).

        if (this.rand() > probThreshold) {
          // RNG Call #2: Chaos type
          const chaos = this.rand();

          // Map back to pixel coordinates
          const startY = by * blockSize;
          const startX = bx * blockSize;
          const endY = Math.min(height, startY + blockSize);
          const endX = Math.min(width, startX + blockSize);

          for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
              const i = (y * width + x) * 4;
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
