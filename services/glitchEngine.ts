import { EffectConfig } from '../types';
import { TextureManager } from './TextureManager';
import { ShaderManager, BASE_VERTEX_SHADER, PASS_THROUGH_FRAGMENT_SHADER } from './ShaderManager';
import { EffectPipeline } from './EffectPipeline';
import { SHADER_REGISTRY } from './glitchShaders';

export interface GlitchRenderOptions {
  maxSize?: number;
  reactivity?: { sub: number, bass: number, mid: number, treble: number };
  integratedReactivity?: { sub: number, bass: number, mid: number, treble: number };
  currentTime?: number;
  imagelessWidth?: number;
  imagelessHeight?: number;
}

export class GlitchEngine {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private textureManager: TextureManager;
  private shaderManager: ShaderManager;
  private pipeline: EffectPipeline;

  private currentImageSrc: string | null = null;
  private inputTexture: WebGLTexture | null = null;

  // Reusable buffers: 0 allocations per frame
  private uParamsBuffer = new Float32Array(16);
  private uIntegratedBuffer = new Float32Array(16);
  private uResolutionBuffer = new Float32Array(2);

  private targetCtxMap = new WeakMap<HTMLCanvasElement, CanvasRenderingContext2D>();

  constructor() {
    this.canvas = document.createElement('canvas');
    const gl = this.canvas.getContext('webgl2', {
      preserveDrawingBuffer: false,
      antialias: false
    });
    if (!gl) throw new Error('Could not create WebGL2 context');
    this.gl = gl;

    this.textureManager = new TextureManager(gl);
    this.shaderManager = new ShaderManager(gl);
    this.initShaders();
    this.pipeline = new EffectPipeline(gl, this.textureManager, this.shaderManager);
  }

  private initShaders() {
    // Initialize base pass-through shader
    this.shaderManager.createProgram('pass-through', BASE_VERTEX_SHADER, PASS_THROUGH_FRAGMENT_SHADER);

    // Automatically initialize all registered shaders
    Object.entries(SHADER_REGISTRY).forEach(([name, shader]) => {
      this.shaderManager.createProgram(name, BASE_VERTEX_SHADER, shader.fragmentSource);
    });
  }

  public async renderToCanvas(
    targetCanvas: HTMLCanvasElement,
    imageSrc: string | null,
    effects: EffectConfig[],
    options: GlitchRenderOptions = {}
  ): Promise<void> {
    // 1. Resolve image (Sync if cached, Async if new)
    let img: HTMLImageElement | null = null;
    if (imageSrc) {
      const cached = GlitchEngine.imageCache.get(imageSrc);
      if (cached) {
        img = cached;
      } else {
        // Only do the expensive async path if the image is truly new
        await this.ensureImageLoaded(imageSrc);
        img = GlitchEngine.imageCache.get(imageSrc) || null;
      }
    }

    // 2. Process
    this.processSync(img, imageSrc, effects, options);

    // 3. Copy internal canvas to target canvas
    // Optimization: Only resize if dimensions actually changed to avoid Safari context resets
    if (targetCanvas.width !== this.canvas.width) targetCanvas.width = this.canvas.width;
    if (targetCanvas.height !== this.canvas.height) targetCanvas.height = this.canvas.height;

    // Optimization: Cache the 2D context to avoid context overhead during loop
    let ctx = this.targetCtxMap.get(targetCanvas);
    if (!ctx) {
      ctx = targetCanvas.getContext('2d', { alpha: false }) || undefined;
      if (ctx) this.targetCtxMap.set(targetCanvas, ctx);
    }

    if (ctx) {
      // Paint the floor solid black so alpha parts don't smear with old frames
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
      ctx.drawImage(this.canvas, 0, 0);
    }
  }

  // Static cache shared across all instances (main engine + thumbnail engine)
  private static imageCache: Map<string, HTMLImageElement> = new Map();

  /**
   * Orchestrates the image loading. Handles URL revocation of old blobs.
   */
  private async ensureImageLoaded(imageSrc: string): Promise<void> {
    if (GlitchEngine.imageCache.has(imageSrc)) return;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // If we previously loaded a blob URL that isn't this one, we could revoke it here,
        // but it's cleaner to handle revocation at the source of the blob creation.
        // For now, we just ensure the image is baked into the cache.
        GlitchEngine.imageCache.set(imageSrc, img);
        resolve();
      };
      img.onerror = reject;
      img.src = imageSrc;
    });
  }

  /**
   * The actual rendering logic, now synchronous to prevent Garbage Collection pressure
   * from promise/closure allocations in the animation loop.
   */
  private processSync(
    img: HTMLImageElement | null,
    imageSrc: string | null,
    effects: EffectConfig[],
    options: GlitchRenderOptions = {}
  ): void {
    const { maxSize, integratedReactivity, currentTime, imagelessWidth, imagelessHeight } = options;

    let width: number;
    let height: number;

    if (img) {
      width = img.width;
      height = img.height;
    } else {
      // If no image uploaded, prioritize explicit dimensions, then default to a 16:9 cinematic aspect ratio
      width = imagelessWidth || maxSize || 1920;
      height = imagelessHeight || Math.floor(width * 9 / 16);
    }

    if (maxSize && (width > maxSize || height > maxSize)) {
      const ratio = Math.min(maxSize / width, maxSize / height);
      width = Math.floor(width * ratio);
      height = Math.floor(height * ratio);
    }

    // Force even dimensions (round down) for WebCodecs H.264 (avc) support (ensures preview exactly matches export)
    width = width & ~1;
    height = height & ~1;

    // Detect if we shifted from a Blob URL to a new one
    if (this.currentImageSrc && this.currentImageSrc.startsWith('blob:') && this.currentImageSrc !== imageSrc) {
      URL.revokeObjectURL(this.currentImageSrc);
    }

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.gl.viewport(0, 0, width, height);
      this.pipeline.resize(width, height);

      if (this.inputTexture) this.textureManager.destroyTexture(this.inputTexture);
      this.inputTexture = this.textureManager.createTexture(width, height, img);
      this.pipeline.setInputTexture(this.inputTexture!);
    } else if (this.currentImageSrc !== imageSrc) {
      // If switching to imageless mode (null imageSrc), we recreate the texture as null
      if (!img) {
        if (this.inputTexture) this.textureManager.destroyTexture(this.inputTexture);
        this.inputTexture = this.textureManager.createTexture(width, height, null);
      } else {
        this.textureManager.updateTexture(this.inputTexture!, img);
      }
      this.pipeline.setInputTexture(this.inputTexture!);
    }

    this.currentImageSrc = imageSrc; // update this.currentImageSrc so that texture is updated (previous block) only when imageSrc changes
    const UNIT = Math.min(width, height) / 100;

    this.pipeline.setInputTexture(this.inputTexture!);
    this.pipeline.resetStack();

    // Apply effects sequentially according to the Solo/Mute and Group (Melder) logic
    const anySoloed = effects.some(e => e.soloed);
    let inSubStack = false;

    effects.forEach(effect => {
      const isActive = anySoloed ? effect.soloed : !effect.muted;

      // If this is the start of a melded group, enter the sub-stack
      if (effect.melded && !inSubStack) {
        this.pipeline.enterSubStack();
        inSubStack = true;
      }

      if (isActive) {
        this.applyEffect(effect, UNIT, width, height, options.reactivity, options.integratedReactivity, currentTime);
      }

      // If this is the end of a melded group (or end of array), merge back to main stack
      // A group ends if the current effect is not melded, but we were in a group
      if (inSubStack && !effect.melded) {
        this.pipeline.mergeSubStack();
        inSubStack = false;
      }
    });

    // Safety: If the last effect was somehow marked melded, close it here
    if (inSubStack) {
      this.pipeline.mergeSubStack();
    }

    this.pipeline.renderToScreen(false);
  }

  private applyEffect(
    effect: EffectConfig,
    UNIT: number,
    width: number,
    height: number,
    reactivity?: { sub: number, bass: number, mid: number, treble: number },
    integratedReactivity?: { sub: number, bass: number, mid: number, treble: number },
    currentTime?: number
  ) {
    const { type, params, seed } = effect;
    const meta = SHADER_REGISTRY[type];
    if (!meta) return;

    // Parameter Clocks (Integrated Values):
    // We provide a dedicated 16-slot array of "clocks", one for each parameter.
    // 1. Velocity Params + Sync ON: Use Integrated Reactivity (Accumulated motion).
    // 2. Velocity Params + Sync OFF: Use Time (Constant motion).
    // 3. Standard Params: Use Time (Normal frame progress).
    // Fill reusable buffers instead of creating new ones
    this.uIntegratedBuffer.fill(currentTime || 0);

    params.forEach((p, i) => {
      if (i < 16) {
        let finalValue = p.value;
        const isVelocityParam = meta.velocityParamIndices?.includes(i);

        if (p.frequencyBand !== 'OFF') {
          if (isVelocityParam) {
            // MOTION REACTIVITY: Map to integrated (accumulated) values
            if (integratedReactivity) {
              if (p.frequencyBand === 'SUB') this.uIntegratedBuffer[i] = integratedReactivity.sub;
              else if (p.frequencyBand === 'MID') this.uIntegratedBuffer[i] = integratedReactivity.mid;
              else if (p.frequencyBand === 'TREBLE') this.uIntegratedBuffer[i] = integratedReactivity.treble;
              else this.uIntegratedBuffer[i] = integratedReactivity.bass;
            }
          } else {
            // INSTANTANEOUS REACTIVITY: Map to smoothed amplitude values
            if (reactivity) {
              let energy = reactivity.bass;
              if (p.frequencyBand === 'SUB') energy = reactivity.sub;
              else if (p.frequencyBand === 'MID') energy = reactivity.mid;
              else if (p.frequencyBand === 'TREBLE') energy = reactivity.treble;

              const range = p.value - p.min;
              finalValue = p.min + (range * energy);
            }
          }
        }

        this.uParamsBuffer[i] = finalValue;
      }
    });

    this.uResolutionBuffer[0] = width;
    this.uResolutionBuffer[1] = height;

    const uniforms: Record<string, any> = {
      u_params: this.uParamsBuffer,
      u_integrated_values: this.uIntegratedBuffer,
      u_unit: UNIT,
      u_seed: (seed !== undefined && seed !== null) ? seed : Math.random(),
      u_resolution: this.uResolutionBuffer,
      u_time: currentTime
    };

    this.pipeline.applyPass(type, uniforms);
  }
}

export const mainGlitchEngine = new GlitchEngine();
