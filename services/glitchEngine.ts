import { EffectConfig, TransitionType } from '../types';
import { dragOverride } from './dragOverride';
import { TextureManager } from './TextureManager';
import { ShaderManager, BASE_VERTEX_SHADER, PASS_THROUGH_FRAGMENT_SHADER } from './ShaderManager';
import { EffectPipeline } from './EffectPipeline';
import { SHADER_REGISTRY } from './glitchShaders';
import { TRANSITION_SHADERS } from './transitionShaders';
import { calculateExportDimensions } from './exportService';

export interface GlitchRenderOptions {
  maxSize?: number;
  reactivity?: { sub: number, bass: number, mid: number, treble: number };
  integratedReactivity?: { sub: number, bass: number, mid: number, treble: number };
  currentTime?: number;
  imagelessWidth?: number;
  imagelessHeight?: number;
  transition?: {
    type: TransitionType;
    progress: number;
    seed?: number;
  };
}

export class GlitchEngine {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private textureManager: TextureManager;
  private shaderManager: ShaderManager;
  private pipeline: EffectPipeline;

  private inputTexture: WebGLTexture | null = null;
  private assetTextures: Map<string, WebGLTexture> = new Map();

  // Reusable buffers: 0 allocations per frame
  private uParamsBuffer = new Float32Array(16);
  private uIntegratedBuffer = new Float32Array(16);
  private uResolutionBuffer = new Float32Array(2);

  private transitionSnapshotTexture: WebGLTexture | null = null;

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
      // 3D-only shaders (like ThreeJS) do not need to be compiled as 2D programs
      if (!shader.is3D) {
        this.shaderManager.createProgram(name, BASE_VERTEX_SHADER, shader.fragmentSource);
      }
    });

    // Initialize transition shaders
    Object.entries(TRANSITION_SHADERS).forEach(([name, fragmentSource]) => {
      this.shaderManager.createProgram(`TRANSITION_${name}`, BASE_VERTEX_SHADER, fragmentSource);
    });
  }

  public async renderToCanvas(
    targetCanvas: HTMLCanvasElement,
    effects: EffectConfig[],
    options: GlitchRenderOptions = {}
  ): Promise<void> {
    // 1. Preload any images/assets (Sync if cached, Async if new)
    const urlsToLoad = new Set<string>();
    effects.forEach(e => { if (e.assetUrl) urlsToLoad.add(e.assetUrl); });

    const loadPromises: Promise<void>[] = [];
    urlsToLoad.forEach(url => {
      if (!GlitchEngine.imageCache.has(url)) {
        loadPromises.push(this.ensureImageLoaded(url));
      }
    });

    if (loadPromises.length > 0) {
      await Promise.all(loadPromises);
    }

    // 2. Process
    this.processSync(effects, options);

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
   * Orchestrates the image loading.
   */
  private async ensureImageLoaded(imageSrc: string): Promise<void> {
    if (GlitchEngine.imageCache.has(imageSrc)) return;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
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
    effects: EffectConfig[],
    options: GlitchRenderOptions = {}
  ): void {
    const { maxSize, integratedReactivity, currentTime, imagelessWidth, imagelessHeight } = options;

    let targetRatio = 16 / 9;
    if (imagelessWidth && imagelessHeight) {
      targetRatio = imagelessWidth / imagelessHeight;
    }

    const dims = calculateExportDimensions(targetRatio, maxSize || 1920);
    const width = dims.width;
    const height = dims.height;

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.gl.viewport(0, 0, width, height);
      this.pipeline.resize(width, height);

      if (this.inputTexture) this.textureManager.destroyTexture(this.inputTexture);
      this.inputTexture = this.textureManager.createTexture(width, height, null);

      this.assetTextures.forEach(t => this.textureManager.destroyTexture(t));
      this.assetTextures.clear();

      this.pipeline.setInputTexture(this.inputTexture!);
    }

    const UNIT = Math.min(width, height) / 100;

    // Refresh supplementary asset textures
    const currentAssetUrls = new Set(effects.map(e => e.assetUrl).filter(Boolean) as string[]);

    currentAssetUrls.forEach(url => {
      if (!this.assetTextures.has(url)) {
        const cachedImg = GlitchEngine.imageCache.get(url);
        if (cachedImg) {
          this.assetTextures.set(url, this.textureManager.createTexture(width, height, cachedImg));
        }
      }
    });

    Array.from(this.assetTextures.keys()).forEach(url => {
      if (!currentAssetUrls.has(url)) {
        const t = this.assetTextures.get(url);
        if (t) this.textureManager.destroyTexture(t);
        this.assetTextures.delete(url);
      }
    });

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
        let secondaryTexture: WebGLTexture | null = null;
        if (effect.assetUrl && this.assetTextures.has(effect.assetUrl)) {
          secondaryTexture = this.assetTextures.get(effect.assetUrl) || null;
        }
        this.applyEffect(effect, UNIT, width, height, options.reactivity, options.integratedReactivity, currentTime, secondaryTexture);
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

    // If we are currently in a transition, we apply it as a final post-process pass
    // The snapshot is captured externally via captureTransitionSnapshot() right before the first render of the new scene.
    // Apply transition if active
    if (options.transition && options.transition.type !== 'none' && this.transitionSnapshotTexture) {
      this.pipeline.applyTransition(
        options.transition.type,
        this.transitionSnapshotTexture,
        options.transition.progress,
        {
          u_time: currentTime || 0,
          u_seed: options.transition.seed || 0,
          u_resolution: this.uResolutionBuffer
        }
      );
    }

    this.pipeline.renderToScreen(false);
  }

  /**
   * Captures the current content of the internal canvas into a persistent snapshot texture.
   * This is used for "Scene Handover" transitions.
   */
  public captureTransitionSnapshot() {
    if (!this.gl) return;

    // Lazily create or resize the snapshot texture to match current internal canvas
    if (this.transitionSnapshotTexture) {
      this.textureManager.destroyTexture(this.transitionSnapshotTexture);
    }

    this.transitionSnapshotTexture = this.textureManager.createTexture(this.canvas.width, this.canvas.height);

    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.transitionSnapshotTexture);
    gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, this.canvas.width, this.canvas.height, 0);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  private applyEffect(
    effect: EffectConfig,
    UNIT: number,
    width: number,
    height: number,
    reactivity?: { sub: number, bass: number, mid: number, treble: number },
    integratedReactivity?: { sub: number, bass: number, mid: number, treble: number },
    currentTime?: number,
    secondaryTexture?: WebGLTexture | null
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

    // If there is an active drag override for this effect, read from it directly —
    // this avoids a Zustand store update + React re-render on every pointermove.
    const liveOverrides = dragOverride.overrides.get(effect.id) || null;

    params.forEach((p, i) => {
      if (i < 16) {
        const override = liveOverrides?.find(o => o.index === i);
        let finalMax = override?.value !== undefined ? override.value : p.value;
        let finalMin = override?.min !== undefined ? override.min : p.min;
        let finalValue = finalMax;

        const isVelocityParam = meta.velocityParamIndices?.includes(i);

        if (p.frequencyBand !== 'OFF') {
          if (isVelocityParam) {
            // MOTION REACTIVITY: Hybrid Clock logic
            if (integratedReactivity) {
              let audioClock = integratedReactivity.bass;
              if (p.frequencyBand === 'SUB') audioClock = integratedReactivity.sub;
              else if (p.frequencyBand === 'MID') audioClock = integratedReactivity.mid;
              else if (p.frequencyBand === 'TREBLE') audioClock = integratedReactivity.treble;

              const range = finalMax - finalMin;
              const steadyTime = (currentTime || 0);

              this.uIntegratedBuffer[i] = (finalMin * steadyTime) + (range * audioClock);
              finalValue = 1.0;
            }
          } else {
            // INSTANTANEOUS REACTIVITY: Map to smoothed amplitude values
            if (reactivity) {
              let energy = reactivity.bass;
              if (p.frequencyBand === 'SUB') energy = reactivity.sub;
              else if (p.frequencyBand === 'MID') energy = reactivity.mid;
              else if (p.frequencyBand === 'TREBLE') energy = reactivity.treble;

              const range = finalMax - finalMin;
              finalValue = finalMin + (range * energy);
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

    if (type === 'BLUR') {
      this.pipeline.applyIterativeBlur(uniforms);
    } else if (type === 'GLOW') {
      this.pipeline.applyGlow(uniforms);
    } else {
      this.pipeline.applyPass(type, uniforms, !!meta.is3D, secondaryTexture);
    }
  }

  public dispose() {
    // 1. Dispose pipeline (and 3D renderer inside it)
    if (this.pipeline) {
      this.pipeline.dispose();
    }

    // 2. Lose WebGL context to free up browser resources
    if (this.gl) {
      const ext = this.gl.getExtension('WEBGL_lose_context');
      if (ext) {
        ext.loseContext();
      }
    }

    // 3. Nullify references
    this.canvas.width = 1;
    this.canvas.height = 1;
    this.gl = null as any;
    this.assetTextures.clear();
  }
}

export const mainGlitchEngine = new GlitchEngine();
