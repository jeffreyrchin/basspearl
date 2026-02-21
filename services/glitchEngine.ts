import { EffectConfig } from '../types';
import { TextureManager } from './TextureManager';
import { ShaderManager, BASE_VERTEX_SHADER, PASS_THROUGH_FRAGMENT_SHADER } from './ShaderManager';
import { EffectPipeline } from './EffectPipeline';
import { SHADER_REGISTRY } from './glitchShaders';

export interface GlitchRenderOptions {
  maxSize?: number;
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
  private currentImage: HTMLImageElement | null = null;
  private inputTexture: WebGLTexture | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
    const gl = this.canvas.getContext('webgl2', {
      preserveDrawingBuffer: true,
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
    await this.processInternal(imageSrc || '', effects, options);

    // Copy internal canvas to target canvas
    targetCanvas.width = this.canvas.width;
    targetCanvas.height = this.canvas.height;
    const ctx = targetCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(this.canvas, 0, 0);
    }
  }

  private async processInternal(
    imageSrc: string,
    effects: EffectConfig[],
    options: GlitchRenderOptions = {}
  ): Promise<void> {
    const { maxSize, integratedReactivity, currentTime, imagelessWidth, imagelessHeight } = options;

    return new Promise((resolve, reject) => {
      const processCachedImage = (img: HTMLImageElement | null) => {
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

        // Apply active effects sequentially
        effects.filter(e => e.active).forEach(effect => {
          this.applyEffect(effect, UNIT, width, height, integratedReactivity, currentTime);
        });

        this.pipeline.renderToScreen(false);
        resolve();
      };

      // If no imageSrc is provided, we just process with a null image
      if (!imageSrc) {
        this.currentImage = null;
        processCachedImage(null);
        return;
      }

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

  private applyEffect(
    effect: EffectConfig,
    UNIT: number,
    width: number,
    height: number,
    integratedReactivity?: { sub: number, bass: number, mid: number, treble: number },
    currentTime?: number
  ) {
    const { type, params, seed, frequencyBand } = effect;
    const meta = SHADER_REGISTRY[type];
    if (!meta) return;

    // Select the appropriate integrated value based on the effect's frequency band
    let integratedValue = integratedReactivity?.bass ?? 0; // Default to bass
    if (integratedReactivity) {
      if (frequencyBand === 'SUB') integratedValue = integratedReactivity.sub;
      else if (frequencyBand === 'BASS') integratedValue = integratedReactivity.bass;
      else if (frequencyBand === 'MID') integratedValue = integratedReactivity.mid;
      else if (frequencyBand === 'TREBLE') integratedValue = integratedReactivity.treble;
    }

    // VELOCITY CONTROLLED EFFECTS:
    // If the shader handles velocity (via u_integrated_value * speed),
    // we switch the source of that value:
    // 1. Sync on (reactive): Use integrated reactivity (p-value accumulation)
    // 2. Sync off (manual):  Use time (constant linear accumulation)
    if (meta.velocityParamIndex !== undefined) {
      const velocityParam = params[meta.velocityParamIndex];
      if (velocityParam && !velocityParam.reactive) {
        // Manual mode: Use the current song time as the "integrated value" for constant acceleration
        integratedValue = currentTime;
      }
    }

    const uniforms: Record<string, any> = {
      u_params: params.map(p => p.value),
      u_unit: UNIT,
      u_seed: (seed !== undefined && seed !== null) ? seed : Math.random(),
      u_resolution: [width, height],
      u_time: currentTime,
      u_integrated_value: integratedValue
    };

    this.pipeline.applyPass(type, uniforms);
  }
}

export const glitchEngine = new GlitchEngine();
