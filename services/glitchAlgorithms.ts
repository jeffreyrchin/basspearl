
import { EffectConfig, GlitchEffectType } from '../types';

export type GlitchParams = {
    intensity: number;
    threshold: number;
    UNIT: number;
    random: () => number;
};

export const GlitchAlgorithms = {
    PIXEL_SORT(pixels: Uint8ClampedArray, width: number, height: number, params: GlitchParams) {
        const { intensity, threshold, UNIT, random } = params;
        if (intensity < 5) return;

        const t = (100 - threshold) * 2.55;
        const triggerProb = intensity / 100;
        const baseStep = intensity < 30 ? 0.3 : intensity < 60 ? 0.2 : 0.1;
        const step = Math.max(1, Math.floor(baseStep * UNIT));

        for (let x = 0; x < width; x += step) {
            let sortStart = -1;
            const normalizedX = Math.floor((x / width) * 800);
            const colSeed = (random() + normalizedX) * 12345;
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
    },

    sortColumnSegment(pixels: Uint8ClampedArray, width: number, x: number, startY: number, endY: number) {
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
    },

    CHANNEL_SHIFT(pixels: Uint8ClampedArray, width: number, height: number, params: GlitchParams) {
        const { intensity, threshold, UNIT } = params;
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
    },

    BIT_CRUSH(pixels: Uint8ClampedArray, width: number, height: number, params: GlitchParams) {
        const { intensity, threshold, UNIT } = params;
        const qFactor = Math.floor(Math.pow(intensity / 10, 2.2)) + 1;
        const rFactor = Math.max(1, Math.floor((threshold * 0.1) * UNIT));

        for (let y = 0; y < height; y += rFactor) {
            for (let x = 0; x < width; x += rFactor) {
                const i = (y * width + x) * 4;
                let r = pixels[i];
                let g = pixels[i + 1];
                let b = pixels[i + 2];

                if (qFactor > 1) {
                    r = Math.floor(r / qFactor) * qFactor;
                    g = Math.floor(g / qFactor) * qFactor;
                    b = Math.floor(b / qFactor) * qFactor;
                }

                for (let dy = 0; dy < rFactor && y + dy < height; dy++) {
                    for (let dx = 0; dx < rFactor && x + dx < width; dx++) {
                        const targetI = ((y + dy) * width + (x + dx)) * 4;
                        pixels[targetI] = r;
                        pixels[targetI + 1] = g;
                        pixels[targetI + 2] = b;
                    }
                }
            }
        }
    },

    SCAN_LINES(pixels: Uint8ClampedArray, width: number, height: number, params: GlitchParams) {
        const { intensity, threshold, UNIT } = params;
        const opacity = intensity / 100;
        const spacing = Math.max(2, Math.floor(2 + (threshold * 0.1 * UNIT)));

        for (let y = 0; y < height; y++) {
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
    },

    DEEP_FRY(pixels: Uint8ClampedArray, width: number, height: number, params: GlitchParams) {
        const { intensity, threshold } = params;
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
    },

    WAVE_DISTORTION(pixels: Uint8ClampedArray, width: number, height: number, params: GlitchParams) {
        const { intensity, threshold, UNIT, random } = params;
        if (intensity === 0) return;

        const temp = new Uint8ClampedArray(pixels);
        const amp = (intensity * 0.5 * UNIT);
        const waves = Math.max(1, threshold * 0.5);
        const verticalPhaseScale = (Math.PI * 2 * waves) / height;
        const startPhase = random() * Math.PI * 2;

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
    },

    DATA_CORRUPTION(pixels: Uint8ClampedArray, width: number, height: number, params: GlitchParams) {
        const { intensity, threshold, UNIT, random } = params;
        if (intensity < 10 || threshold < 10) return;
        const iterations = Math.min(3, Math.floor(intensity / 20) + 1);
        const blockDensity = threshold / 100;
        const blockSize = Math.max(16, Math.floor(4 * UNIT));

        const blocksX = Math.ceil(width / blockSize);
        const blocksY = Math.ceil(height / blockSize);

        for (let by = 0; by < blocksY; by++) {
            for (let bx = 0; bx < blocksX; bx++) {
                if (random() < blockDensity) {
                    const vx = Math.floor((random() - 0.5) * 5 * UNIT);
                    const vy = Math.floor((random() - 0.5) * 5 * UNIT);
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
    },

    COLOR_BLEED(pixels: Uint8ClampedArray, width: number, height: number, params: GlitchParams) {
        const { intensity, threshold, UNIT } = params;
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
    },

    COMPRESSION_HELL(pixels: Uint8ClampedArray, width: number, height: number, params: GlitchParams) {
        const { intensity, threshold, UNIT } = params;
        if (intensity === 0 && threshold === 0) return;

        // 1. IMPROVED MAPPING (No dead zone, wider range)
        // Map 0-100 to 1px -> ~20% screen height
        const blockSize = Math.max(1, Math.floor((0.1 + (intensity * 0.2)) * UNIT));
        const chromaBlockSize = Math.max(1, Math.floor(blockSize * 1.5));

        const factor = threshold / 10;
        const q = 1 + factor * 4;

        const temp = new Uint8ClampedArray(pixels);

        for (let y = 0; y < height; y += blockSize) {
            for (let x = 0; x < width; x += blockSize) {
                const bW = Math.min(blockSize, width - x);
                const bH = Math.min(blockSize, height - y);

                let rSum = 0, gSum = 0, bSum = 0;
                let count = 0;
                for (let dy = 0; dy < bH; dy++) {
                    for (let dx = 0; dx < bW; dx++) {
                        const i = ((y + dy) * width + (x + dx)) * 4;
                        rSum += temp[i];
                        gSum += temp[i + 1];
                        bSum += temp[i + 2];
                        count++;
                    }
                }

                const rAvg = rSum / count;
                const gAvg = gSum / count;
                const bAvg = bSum / count;

                for (let dy = 0; dy < bH; dy++) {
                    for (let dx = 0; dx < bW; dx++) {
                        const i = ((y + dy) * width + (x + dx)) * 4;

                        let nr = Math.floor(rAvg / q) * q;
                        let ng = Math.floor(gAvg / q) * q;
                        let nb = Math.floor(bAvg / q) * q;

                        // DCT-STYLE ARTIFACTS
                        const freq = (1 / UNIT) * (1 + factor * 0.5);
                        const ringing = Math.cos((dx * dy) * freq) * (factor * 4);
                        const isEdge = (dx < 1 || dx > bW - 2 || dy < 1 || dy > bH - 2);
                        const edgeNoise = isEdge ? (Math.sin(x + y) * factor * 5) : 0;

                        pixels[i] = Math.min(255, Math.max(0, nr + ringing + edgeNoise));
                        pixels[i + 1] = Math.min(255, Math.max(0, ng + ringing + edgeNoise));
                        pixels[i + 2] = Math.min(255, Math.max(0, nb + ringing + edgeNoise));
                    }
                }
            }
        }

        if (factor > 2) {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width - chromaBlockSize; x += chromaBlockSize) {
                    const i = (y * width + x) * 4;
                    const nextI = (y * width + (x + chromaBlockSize)) * 4;
                    pixels[i] = (pixels[i] + pixels[nextI]) / 2;
                    pixels[i + 2] = (pixels[i + 2] + pixels[nextI + 2]) / 2;
                }
            }
        }
    },

    RANDOM_CHAOS(pixels: Uint8ClampedArray, width: number, height: number, params: GlitchParams) {
        const { intensity, threshold, UNIT, random } = params;
        const blockSize = Math.max(1, Math.floor((threshold * 0.1) * UNIT));
        const probThreshold = 1 - Math.pow(intensity / 100, 0.5) * 0.5;

        const blocksX = Math.ceil(width / blockSize);
        const blocksY = Math.ceil(height / blockSize);

        for (let by = 0; by < blocksY; by++) {
            for (let bx = 0; bx < blocksX; bx++) {
                if (random() > probThreshold) {
                    const chaos = random();
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
    },

    ANALOG_NOISE(pixels: Uint8ClampedArray, width: number, height: number, params: GlitchParams) {
        const { intensity, threshold, random } = params;
        if (intensity === 0) return;
        const amount = intensity / 100 * 255;
        const monoThreshold = threshold / 100;

        for (let i = 0; i < pixels.length; i += 4) {
            const isMono = random() < monoThreshold;
            if (isMono) {
                const noise = (random() - 0.5) * amount;
                pixels[i] = Math.min(255, Math.max(0, pixels[i] + noise));
                pixels[i + 1] = Math.min(255, Math.max(0, pixels[i + 1] + noise));
                pixels[i + 2] = Math.min(255, Math.max(0, pixels[i + 2] + noise));
            } else {
                pixels[i] = Math.min(255, Math.max(0, pixels[i] + (random() - 0.5) * amount));
                pixels[i + 1] = Math.min(255, Math.max(0, pixels[i + 1] + (random() - 0.5) * amount));
                pixels[i + 2] = Math.min(255, Math.max(0, pixels[i + 2] + (random() - 0.5) * amount));
            }
        }
    },

    HUE_ROTATION(pixels: Uint8ClampedArray, width: number, height: number, params: GlitchParams) {
        const { intensity, threshold } = params;
        if (intensity === 0) return;

        const degree = (intensity / 100) * 360;
        const satBoost = 1 + (threshold / 100) * 2;

        for (let i = 0; i < pixels.length; i += 4) {
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

            h = (h + (degree / 360)) % 1;
            if (h < 0) h += 1;
            s = Math.min(1, s * satBoost);

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
    },

    hue2rgb(p: number, q: number, t: number) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    },

    INVERT_GHOST(pixels: Uint8ClampedArray, width: number, height: number, params: GlitchParams) {
        const { intensity } = params;
        if (intensity === 0) return;
        const opacity = intensity / 100;

        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const ir = 255 - r;
            const ig = 255 - g;
            const ib = 255 - b;
            pixels[i] = r * (1 - opacity) + ir * opacity;
            pixels[i + 1] = g * (1 - opacity) + ig * opacity;
            pixels[i + 2] = b * (1 - opacity) + ib * opacity;
        }
    }
};
