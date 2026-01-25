
// We need to redefine the types here since we can't easily import them in a worker without bundler config
// in a simple setup. For robustness, I'll copy the minimal necessary types.

type GlitchEffectType =
    | 'PIXEL_SORT'
    | 'CHANNEL_SHIFT'
    | 'DATA_CORRUPTION'
    | 'DEEP_FRY'
    | 'SCAN_LINES'
    | 'BIT_CRUSH'
    | 'WAVE_DISTORTION'
    | 'COLOR_BLEED'
    | 'COMPRESSION_HELL'
    | 'RANDOM_CHAOS'
    | 'ANALOG_NOISE'
    | 'HUE_ROTATION'
    | 'INVERT_GHOST';

interface EffectConfig {
    type: GlitchEffectType;
    intensity: number; // 0 to 100
    threshold: number; // 0 to 100
    active: boolean;
    seed?: number;
}

interface WorkerMessage {
    id: string;
    type: 'PROCESS';
    imageBitmap: ImageBitmap;
    effects: EffectConfig[];
    shouldWatermark: boolean;
}

interface WorkerResponse {
    id: string;
    success: boolean;
    imageBitmap?: ImageBitmap;
    error?: string;
}

// Internal Engine Class (Adapted for Worker)
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

    public async process(imageBitmap: ImageBitmap, effects: EffectConfig[], shouldWatermark: boolean): Promise<ImageBitmap> {
        const width = imageBitmap.width;
        const height = imageBitmap.height;

        // Resize canvas to match image
        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
        }

        // Draw source
        this.ctx.drawImage(imageBitmap, 0, 0);

        // Calculate UNIT for resolution independence (still good practice even for full res)
        const UNIT = Math.min(width, height) / 100;
        const normalizedScale = Math.max(1, Math.min(width, height) / 800);

        // Apply effects
        effects.filter(e => e.active).forEach(effect => {
            this.applyEffect(effect, UNIT, normalizedScale);
        });

        if (shouldWatermark) {
            this.applyWatermark();
        }

        // Return result as ImageBitmap
        return this.canvas.transferToImageBitmap();
    }

    private applyWatermark() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const fontSize = Math.max(20, Math.floor(width * 0.04));

        this.ctx.save();
        // Font loading in worker is tricky, use basic font
        this.ctx.font = `bold ${fontSize}px sans-serif`;
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'bottom';
        const padding = Math.floor(fontSize * 0.5);

        this.ctx.lineWidth = Math.max(2, fontSize * 0.08);
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeText('GlitchBrain', width - padding, height - padding);

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillText('GlitchBrain', width - padding, height - padding);
        this.ctx.restore();
    }

    // --- EFFECT LOGIC (Copied from GlitchEngine with strict typing) ---

    private currentRng: () => number = Math.random;

    private applyEffect(effect: EffectConfig, UNIT: number, scale: number) {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const { intensity, threshold, seed } = effect;

        if (seed !== undefined) {
            this.currentRng = this.createSeededRng(seed);
        } else {
            this.currentRng = Math.random;
        }

        switch (effect.type) {
            case 'PIXEL_SORT':
                this.pixelSort(imageData, intensity, threshold, UNIT);
                break;
            case 'CHANNEL_SHIFT':
                this.channelShift(imageData, intensity, threshold, UNIT);
                break;
            case 'BIT_CRUSH':
                this.bitCrush(imageData, intensity, threshold, UNIT);
                break;
            case 'SCAN_LINES':
                this.scanLines(imageData, intensity, threshold, UNIT);
                break;
            case 'DEEP_FRY':
                this.deepFry(imageData, intensity, threshold);
                break;
            case 'WAVE_DISTORTION':
                this.waveDistortion(imageData, intensity, threshold, UNIT);
                break;
            case 'DATA_CORRUPTION':
                this.dataCorruption(imageData, intensity, threshold, UNIT);
                break;
            case 'COLOR_BLEED':
                this.colorBleed(imageData, intensity, threshold, UNIT);
                break;
            case 'COMPRESSION_HELL':
                this.compressionHell(imageData, intensity, threshold, UNIT);
                break;
            case 'RANDOM_CHAOS':
                this.randomChaos(imageData, intensity, threshold, UNIT);
                break;
            case 'ANALOG_NOISE':
                this.analogNoise(imageData, intensity, threshold, UNIT);
                break;
            case 'HUE_ROTATION':
                this.hueRotation(imageData, intensity, threshold);
                break;
            case 'INVERT_GHOST':
                this.invertGhost(imageData, intensity, threshold);
                break;
        }

        this.ctx.putImageData(imageData, 0, 0);
    }

    // RANDOMLY SEEDED RNG
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

    // --- INDIVIDUAL EFFECTS ---

    private pixelSort(imageData: ImageData, intensity: number, threshold: number, UNIT: number) {
        if (intensity < 5) return;
        const pixels = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const t = (100 - threshold) * 2.55;
        const triggerProb = intensity / 100;
        const baseStep = intensity < 30 ? 0.3 : intensity < 60 ? 0.2 : 0.1;
        const step = Math.max(1, Math.floor(baseStep * UNIT));

        for (let x = 0; x < width; x += step) {
            let sortStart = -1;
            const normalizedX = Math.floor((x / width) * 800);
            const colSeed = (this.currentRng() + normalizedX) * 12345;
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
        const width = imageData.width;
        const height = imageData.height;
        const shiftX = Math.floor(intensity * 0.2 * UNIT);
        const shiftY = Math.floor(threshold * 0.1 * UNIT);

        if (intensity === 0 && threshold === 0) return;

        const temp = new Uint8ClampedArray(pixels);

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
        const qFactor = Math.floor(Math.pow(intensity / 10, 2.2)) + 1;
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
        const spacing = Math.max(2, Math.floor(2 + (threshold * 0.1 * UNIT)));

        for (let y = 0; y < imageData.height; y++) {
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
        const contrast = 1 + (Math.pow(intensity / 20, 2));
        const brightness = (intensity * 1.5);
        const levels = Math.max(2, 255 - Math.floor(threshold * 2.5));

        for (let i = 0; i < pixels.length; i += 4) {
            for (let c = 0; c < 3; c++) {
                let val = pixels[i + c];
                val = (val - 128) * contrast + 128 + brightness;
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
        const amp = (intensity * 0.5 * UNIT);
        const waves = Math.max(1, threshold * 0.5);
        const verticalPhaseScale = (Math.PI * 2 * waves) / height;
        const startPhase = this.rand() * Math.PI * 2;

        for (let y = 0; y < height; y++) {
            const angle = y * verticalPhaseScale + startPhase;
            let xOffset = Math.sin(angle) * amp;
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
        if (intensity < 10 || threshold < 10) return;
        const pixels = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const iterations = Math.min(3, Math.floor(intensity / 20) + 1);
        const blockDensity = threshold / 100;
        const blockSize = Math.max(16, Math.floor(4 * UNIT));

        const blocksX = Math.ceil(width / blockSize);
        const blocksY = Math.ceil(height / blockSize);

        for (let by = 0; by < blocksY; by++) {
            for (let bx = 0; bx < blocksX; bx++) {
                if (this.rand() < blockDensity) {
                    const vx = Math.floor((this.rand() - 0.5) * 5 * UNIT);
                    const vy = Math.floor((this.rand() - 0.5) * 5 * UNIT);
                    if (vx === 0 && vy === 0) continue;

                    const startY = Math.max(0, by * blockSize);
                    const endY = Math.min(height, (by + 1) * blockSize);
                    const startX = Math.max(0, bx * blockSize);
                    const endX = Math.min(width, (bx + 1) * blockSize);

                    for (let iter = 0; iter < iterations; iter++) {
                        const blockData: number[][] = [];
                        for (let py = startY; py < endY; py++) {
                            for (let px = startX; px < endX; px++) {
                                const i = (py * width + px) * 4;
                                blockData.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
                            }
                        }
                        let idx = 0;
                        for (let py = startY; py < endY; py++) {
                            for (let px = startX; px < endX; px++) {
                                const tx = px + vx;
                                const ty = py + vy;
                                if (tx >= 0 && tx < width && ty >= 0 && ty < height) {
                                    const targetI = (ty * width + tx) * 4;
                                    const [r, g, b] = blockData[idx];
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
        const bleedAmount = Math.floor((intensity * 0.1) * UNIT);
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

    private compressionHell(imageData: ImageData, intensity: number, threshold: number, UNIT: number) {
        if (intensity < 10 && threshold < 10) return;
        const pixels = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const blockSize = Math.max(2, Math.floor((4 + (intensity * 0.1)) * UNIT));
        const factor = (threshold / 10);

        for (let y = 0; y < height; y += blockSize) {
            for (let x = 0; x < width; x += blockSize) {
                let rSum = 0, gSum = 0, bSum = 0;
                let count = 0;
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

                for (let dy = 0; dy < blockSize && y + dy < height; dy++) {
                    for (let dx = 0; dx < blockSize && x + dx < width; dx++) {
                        const i = ((y + dy) * width + (x + dx)) * 4;
                        const q = 1 + factor * 2;
                        let nr = Math.floor(rAvg / q) * q;
                        let ng = Math.floor(gAvg / q) * q;
                        let nb = Math.floor(bAvg / q) * q;

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
        const blockSize = Math.max(1, Math.floor((threshold * 0.1) * UNIT));
        const probThreshold = 1 - Math.pow(intensity / 100, 0.5) * 0.5;

        const blocksX = Math.ceil(width / blockSize);
        const blocksY = Math.ceil(height / blockSize);

        for (let by = 0; by < blocksY; by++) {
            for (let bx = 0; bx < blocksX; bx++) {
                if (this.rand() > probThreshold) {
                    const chaos = this.rand();
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

    private analogNoise(imageData: ImageData, intensity: number, threshold: number, UNIT: number) {
        if (intensity === 0) return;
        const pixels = imageData.data;
        // Intensity = Amount of noise
        // Threshold = Color Noise vs Mono Noise (High threshold = More Mono)
        const amount = intensity / 100 * 255; // 0-255 range
        const monoThreshold = threshold / 100;

        for (let i = 0; i < pixels.length; i += 4) {
            const isMono = this.rand() < monoThreshold;

            if (isMono) {
                const noise = (this.rand() - 0.5) * amount;
                pixels[i] = Math.min(255, Math.max(0, pixels[i] + noise));
                pixels[i + 1] = Math.min(255, Math.max(0, pixels[i + 1] + noise));
                pixels[i + 2] = Math.min(255, Math.max(0, pixels[i + 2] + noise));
            } else {
                pixels[i] = Math.min(255, Math.max(0, pixels[i] + (this.rand() - 0.5) * amount));
                pixels[i + 1] = Math.min(255, Math.max(0, pixels[i + 1] + (this.rand() - 0.5) * amount));
                pixels[i + 2] = Math.min(255, Math.max(0, pixels[i + 2] + (this.rand() - 0.5) * amount));
            }
        }
    }

    private hueRotation(imageData: ImageData, intensity: number, threshold: number) {
        if (intensity === 0) return;
        const pixels = imageData.data;
        // Intensity = Degrees (0-100 -> 0-360)
        // Threshold = Saturation Boost (0-100 -> 1.0-3.0)

        const degrees = (intensity / 100) * 360;
        const satBoost = 1 + (threshold / 100) * 2;

        // Pre-calculate sin/cos for rotation
        const rad = degrees * (Math.PI / 180);
        const cosA = Math.cos(rad);
        const sinA = Math.sin(rad);

        // Matrix weights for RGB -> YIQ -> Rotate -> RGB
        // Using standard YIQ conversion approximation
        // This is expensive per pixel, but it's the "Truth" worker.

        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];

            // Simple Hue Rotate approximation to avoid heavy matrix math if possible, 
            // but for "Acid" accurate rotation is better.
            // Let's use a simplified approach that works well enough.

            // Convert to HSL/HSV? limit: performance.
            // Let's use a matrix approximation.

            // Standard Hue Rotate matrix
            const mag = Math.sqrt(3);
            const x = mag * sinA; // Optimization consts not ideal here, doing simple RGB rotation

            // Actually, for "Acid Trip", we often want cycle shifting which is faster
            // BUT user wants Premium, so let's do real Hue Shift.

            // U, V, W method
            // Normalize
            // It's cheaper to just convert RGB to HSL, shift H, back to RGB

            this.applyHueShiftPixel(pixels, i, degrees, satBoost);
        }
    }

    private applyHueShiftPixel(pixels: Uint8ClampedArray, i: number, degree: number, satBoost: number) {
        let r = pixels[i] / 255;
        let g = pixels[i + 1] / 255;
        let b = pixels[i + 2] / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        // Apply Shift
        h = (h + (degree / 360)) % 1;
        if (h < 0) h += 1;

        // Apply Saturation Boost
        s = Math.min(1, s * satBoost);

        // Back to RGB
        if (s === 0) {
            r = g = b = l;
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = this.hue2rgb(p, q, h + 1 / 3);
            g = this.hue2rgb(p, q, h);
            b = this.hue2rgb(p, q, h - 1 / 3);
        }

        pixels[i] = r * 255;
        pixels[i + 1] = g * 255;
        pixels[i + 2] = b * 255;
    }

    private hue2rgb(p: number, q: number, t: number) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    }

    private invertGhost(imageData: ImageData, intensity: number, threshold: number) {
        if (intensity === 0) return;
        const pixels = imageData.data;
        // Intensity = Opacity of Inversion (0-100)
        // Threshold = Not used much, maybe brightness bias? Let's use it as blend mode trigger

        const opacity = intensity / 100;

        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];

            // Invert
            const ir = 255 - r;
            const ig = 255 - g;
            const ib = 255 - b;

            // Blend Difference/Exclusion style
            pixels[i] = r * (1 - opacity) + ir * opacity;
            pixels[i + 1] = g * (1 - opacity) + ig * opacity;
            pixels[i + 2] = b * (1 - opacity) + ib * opacity;
        }
    }
}

const engine = new GlitchWorkerEngine();

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
    if (e.data.type === 'PROCESS') {
        try {
            const resultBitmap = await engine.process(e.data.imageBitmap, e.data.effects, e.data.shouldWatermark);
            const response: WorkerResponse = {
                id: e.data.id,
                success: true,
                imageBitmap: resultBitmap
            };
            // Transfer the bitmap back to main thread
            // @ts-ignore - Worker postMessage signature varies by TS env
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
