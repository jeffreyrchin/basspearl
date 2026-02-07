
import { EffectConfig, GlitchEffectType } from '../types';
import { TextureManager } from './TextureManager';
import { ShaderManager, BASE_VERTEX_SHADER, PASS_THROUGH_FRAGMENT_SHADER } from './ShaderManager';
import { EffectPipeline } from './EffectPipeline';
import { SHADER_REGISTRY } from './glitchShaders';

interface WorkerMessage {
    id: string;
    type: 'PROCESS' | 'SET_SOURCE';
    imageBitmap?: ImageBitmap;
    effects?: EffectConfig[];
}

interface WorkerResponse {
    id: string;
    success: boolean;
    imageBitmap?: ImageBitmap;
    error?: string;
}

class GlitchWorkerEngine {
    private canvas: OffscreenCanvas;
    private gl: WebGL2RenderingContext;
    private textureManager: TextureManager;
    private shaderManager: ShaderManager;
    private pipeline: EffectPipeline;
    private inputTexture: WebGLTexture | null = null;
    private currentWidth: number = 0;
    private currentHeight: number = 0;

    private lastDatamoshState: { active: boolean, intensity: number } = { active: false, intensity: 0 };

    constructor() {
        console.log('[GlitchWorker] Initializing v3.0 (Lean Texture Caching)');
        this.canvas = new OffscreenCanvas(100, 100);
        const gl = this.canvas.getContext('webgl2', {
            preserveDrawingBuffer: true,
            antialias: false
        });
        if (!gl) throw new Error('Could not create worker WebGL2 context');
        this.gl = gl;

        // WebGL context loss recovery
        this.canvas.addEventListener('webglcontextlost', (event) => {
            console.warn('[GlitchWorker] WebGL context lost - GPU memory exhausted');
            event.preventDefault(); // Prevent default browser behavior
        });

        this.canvas.addEventListener('webglcontextrestored', () => {
            console.log('[GlitchWorker] WebGL context restored - reinitializing');
            this.textureManager = new TextureManager(this.gl);
            this.shaderManager = new ShaderManager(this.gl);
            this.initShaders();
            this.pipeline = new EffectPipeline(this.gl, this.textureManager, this.shaderManager);
            this.inputTexture = null; // Force reload on next PROCESS
        });

        this.textureManager = new TextureManager(gl);
        this.shaderManager = new ShaderManager(gl);
        this.initShaders();
        this.pipeline = new EffectPipeline(gl, this.textureManager, this.shaderManager);
    }

    private initShaders() {
        this.shaderManager.createProgram('pass-through', BASE_VERTEX_SHADER, PASS_THROUGH_FRAGMENT_SHADER);

        // Use registry for automatic initialization
        Object.entries(SHADER_REGISTRY).forEach(([name, shader]) => {
            this.shaderManager.createProgram(name, BASE_VERTEX_SHADER, shader.fragmentSource);
        });
    }

    public async setSource(imageBitmap: ImageBitmap) {
        let { width, height } = imageBitmap;
        let processedBitmap = imageBitmap;

        // Hardware limit check only (Main thread handles device-specific 2048px/4096px limits)
        const maxTextureSize = this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE);

        // Auto-downscale ONLY if image exceeds hardware capabilities
        if (width > maxTextureSize || height > maxTextureSize) {
            const scale = maxTextureSize / Math.max(width, height);
            const newWidth = Math.floor(width * scale);
            const newHeight = Math.floor(height * scale);
            console.warn(`[GlitchWorker] Image exceeds hardware limit (${maxTextureSize}px). Downscaling to ${newWidth}×${newHeight}`);

            // Actually create a downscaled ImageBitmap
            processedBitmap = await createImageBitmap(imageBitmap, {
                resizeWidth: newWidth,
                resizeHeight: newHeight,
                resizeQuality: 'high'
            });

            // CRITICAL: Close original bitmap to free GPU memory
            imageBitmap.close();

            width = newWidth;
            height = newHeight;
        }

        this.currentWidth = width;
        this.currentHeight = height;

        // Resize and re-init buffers if needed
        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
            this.gl.viewport(0, 0, width, height);
            this.pipeline.resize(width, height);

            if (this.inputTexture) this.textureManager.destroyTexture(this.inputTexture);
            this.inputTexture = this.textureManager.createTexture(width, height, processedBitmap);
            this.pipeline.setInputTexture(this.inputTexture!);
            this.pipeline.initializeFeedback();
        } else {
            this.textureManager.updateTexture(this.inputTexture!, processedBitmap);
        }

        processedBitmap.close();
        console.log(`[GlitchWorker] Source updated: ${width}x${height}`);
    }

    public async process(effects: EffectConfig[]): Promise<ImageBitmap> {
        if (!this.inputTexture) throw new Error('No source image set in worker');

        const datamoshEffect = effects.find(e => e.type === 'DATA_CORRUPTION' && e.active);
        const datamoshIsActive = !!datamoshEffect && datamoshEffect.intensity > 0;

        // Feedback Logic
        const stateChanged = datamoshIsActive !== this.lastDatamoshState.active ||
            (datamoshIsActive && this.lastDatamoshState.intensity === 0);

        if (stateChanged) {
            this.pipeline.initializeFeedback();
        }

        this.lastDatamoshState = {
            active: datamoshIsActive,
            intensity: datamoshEffect?.intensity || 0
        };

        const width = this.currentWidth;
        const height = this.currentHeight;
        const UNIT = Math.min(width, height) / 100;
        this.pipeline.resetStack();

        // Apply active effects sequentially
        effects.filter(e => e.active).forEach(effect => {
            this.applyEffect(effect, UNIT, width, height);
        });

        this.pipeline.renderToScreen();
        return this.canvas.transferToImageBitmap();
    }

    private applyEffect(effect: EffectConfig, UNIT: number, width: number, height: number) {
        const definition = SHADER_REGISTRY[effect.type];
        if (!definition) {
            console.warn(`Worker: Shader not found for ${effect.type}`);
            return;
        }

        const passes = definition.getPasses ? definition.getPasses(effect.intensity) : 1;
        const seedOffset = Math.floor((effect.seed || 0) * 1000) % 5000;

        const uniforms: Record<string, any> = {
            u_intensity: effect.intensity,
            u_threshold: effect.threshold,
            u_unit: UNIT,
            u_seed: effect.seed || Math.random(),
            u_resolution: [width, height],
            u_time: performance.now() * 0.001
        };

        for (let i = 0; i < passes; i++) {
            uniforms.u_frame = i + seedOffset;
            this.pipeline.applyEffect(effect.type, uniforms);

            if (definition.requiresFeedback) {
                this.pipeline.saveFeedback();
            }
        }
    }
}

const engine = new GlitchWorkerEngine();

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
    const { id, type, imageBitmap, effects } = e.data;

    try {
        if (type === 'SET_SOURCE' && imageBitmap) {
            await engine.setSource(imageBitmap);
            self.postMessage({ id, success: true });
        } else if (type === 'PROCESS' && effects) {
            const resultBitmap = await engine.process(effects);
            const response: WorkerResponse = { id, success: true, imageBitmap: resultBitmap };
            // @ts-ignore
            self.postMessage(response, [resultBitmap]);
        }
    } catch (err) {
        console.error('Worker Error:', err);
        self.postMessage({ id, success: false, error: String(err) });
    }
};
