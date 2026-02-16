import { EffectConfig } from '../types';
import { TextureManager } from './TextureManager';
import { ShaderManager, BASE_VERTEX_SHADER, PASS_THROUGH_FRAGMENT_SHADER } from './ShaderManager';
import { EffectPipeline } from './EffectPipeline';
import { SHADER_REGISTRY } from './glitchShaders';

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
    imageSrc: string,
    effects: EffectConfig[],
    maxSize?: number,
    integratedReactivity?: { bass: number, mid: number, treble: number, energy: number },
    currentTime?: number
  ): Promise<void> {
    await this.processInternal(imageSrc, effects, maxSize, integratedReactivity, currentTime);

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
    maxSize?: number,
    integratedReactivity?: { bass: number, mid: number, treble: number, energy: number },
    currentTime?: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const processCachedImage = (img: HTMLImageElement) => {
        let width = img.width;
        let height = img.height;

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
          this.textureManager.updateTexture(this.inputTexture!, img);
          this.pipeline.setInputTexture(this.inputTexture!);
        }

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
    integratedReactivity?: { bass: number, mid: number, treble: number, energy: number },
    currentTime?: number
  ) {
    const { type, params, seed, frequencyBand } = effect;
    const meta = SHADER_REGISTRY[type];
    if (!meta) return;

    // Select the appropriate integrated value based on the effect's frequency band
    let integratedValue = integratedReactivity?.energy ?? 0; // Default to energy
    if (integratedReactivity) {
      if (frequencyBand === 'BASS') integratedValue = integratedReactivity.bass;
      else if (frequencyBand === 'MID') integratedValue = integratedReactivity.mid;
      else if (frequencyBand === 'TREBLE') integratedValue = integratedReactivity.treble;
      else if (frequencyBand === 'ENERGY') integratedValue = integratedReactivity.energy;
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
        integratedValue = currentTime * 0.5; // Scale to match audio range roughly
      }
    }

    const uniforms: Record<string, any> = {
      u_params: params.map(p => p.value),
      u_unit: UNIT,
      u_seed: (seed !== undefined && seed !== null) ? seed : Math.random(),
      u_resolution: [width, height],
      u_time: currentTime,
      u_frame: Math.floor((seed || 0) * 1000) % 5000,
      u_integrated_value: integratedValue
    };

    this.pipeline.applyPass(type, uniforms);
  }
}

export const glitchEngine = new GlitchEngine();
