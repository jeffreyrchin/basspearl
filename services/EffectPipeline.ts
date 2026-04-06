import { TextureManager } from './TextureManager';
import { ShaderManager } from './ShaderManager';
import { ThreeJSRenderer } from './ThreeJSRenderer';

export class EffectPipeline {
    private gl: WebGL2RenderingContext;
    private textureManager: TextureManager;
    private shaderManager: ShaderManager;
    private threeRenderer: ThreeJSRenderer;

    private vao: WebGLVertexArrayObject | null = null;
    private quadBuffer: WebGLBuffer | null = null;

    // Main stack for the "Background" or "Baseline" image
    private pingPongTextures: [WebGLTexture, WebGLTexture] = [null as any, null as any];
    private pingPongFBs: [WebGLFramebuffer, WebGLFramebuffer] = [null as any, null as any];
    private currentFBIndex = 0;

    // Sub-stack for "Melded" groups (isolated layers)
    private subTextures: [WebGLTexture, WebGLTexture] = [null as any, null as any];
    private subFBs: [WebGLFramebuffer, WebGLFramebuffer] = [null as any, null as any];
    private currentSubFBIndex = 0;
    private inSubStack = false;

    private sourceTexture: WebGLTexture | null = null;

    // Dedicated low-res ping-pong buffers for the downsampled blur (1/4 size, no mipmaps)
    private blurTextures: [WebGLTexture, WebGLTexture] = [null as any, null as any];
    private blurFBs: [WebGLFramebuffer, WebGLFramebuffer] = [null as any, null as any];
    private blurWidth = 1;
    private blurHeight = 1;

    constructor(gl: WebGL2RenderingContext, textureManager: TextureManager, shaderManager: ShaderManager) {
        this.gl = gl;
        this.textureManager = textureManager;
        this.shaderManager = shaderManager;
        this.threeRenderer = new ThreeJSRenderer(gl);
        this.initQuad();
    }

    private initQuad() {
        const gl = this.gl;
        this.quadBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);

        const vertices = new Float32Array([
            -1, -1, 0, 0,
            1, -1, 1, 0,
            -1, 1, 0, 1,
            -1, 1, 0, 1,
            1, -1, 1, 0,
            1, 1, 1, 1,
        ]);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        const positionLoc = 0;
        const texCoordLoc = 1;

        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 16, 0);

        gl.enableVertexAttribArray(texCoordLoc);
        gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 16, 8);

        gl.bindVertexArray(null);
    }

    public resize(width: number, height: number) {
        this.cleanupTextures();

        // Main Stack
        this.pingPongTextures[0] = this.textureManager.createTexture(width, height);
        this.pingPongTextures[1] = this.textureManager.createTexture(width, height);
        this.pingPongFBs[0] = this.textureManager.createFramebuffer(this.pingPongTextures[0]);
        this.pingPongFBs[1] = this.textureManager.createFramebuffer(this.pingPongTextures[1]);

        // Sub Stack
        this.subTextures[0] = this.textureManager.createTexture(width, height);
        this.subTextures[1] = this.textureManager.createTexture(width, height);
        this.subFBs[0] = this.textureManager.createFramebuffer(this.subTextures[0]);
        this.subFBs[1] = this.textureManager.createFramebuffer(this.subTextures[1]);

        // Blur Stack (quarter resolution — no mipmaps, pure bilinear downsampling)
        this.blurWidth = Math.max(1, Math.floor(width / 4));
        this.blurHeight = Math.max(1, Math.floor(height / 4));
        this.blurTextures[0] = this.textureManager.createTexture(this.blurWidth, this.blurHeight);
        this.blurTextures[1] = this.textureManager.createTexture(this.blurWidth, this.blurHeight);
        this.blurFBs[0] = this.textureManager.createFramebuffer(this.blurTextures[0]);
        this.blurFBs[1] = this.textureManager.createFramebuffer(this.blurTextures[1]);

        this.currentFBIndex = 0;
        this.currentSubFBIndex = 0;
    }

    private cleanupTextures() {
        this.pingPongTextures.forEach(t => this.textureManager.destroyTexture(t));
        this.pingPongFBs.forEach(fb => this.textureManager.destroyFramebuffer(fb));
        this.subTextures.forEach(t => this.textureManager.destroyTexture(t));
        this.subFBs.forEach(fb => this.textureManager.destroyFramebuffer(fb));
        this.blurTextures.forEach(t => this.textureManager.destroyTexture(t));
        this.blurFBs.forEach(fb => this.textureManager.destroyFramebuffer(fb));
    }

    /**
     * Internal helper to execute a shader pass
     * Handles uniform setting and texture binding consistently
     */
    private draw(
        programName: string,
        destFB: WebGLFramebuffer | null,
        inputs: { name: string, texture: WebGLTexture }[],
        uniforms: Record<string, any> = {},
        flipY: boolean = false,
        clear: boolean = false
    ) {
        const gl = this.gl;
        const program = this.shaderManager.getProgram(programName);
        if (!program) return;

        gl.useProgram(program);
        gl.bindVertexArray(this.vao);
        gl.bindFramebuffer(gl.FRAMEBUFFER, destFB);

        if (clear) {
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }

        // Standard Flip Uniform
        const flipLoc = this.shaderManager.getUniformLocation(program, 'u_flipY');
        if (flipLoc !== null) gl.uniform1f(flipLoc, flipY ? 1.0 : 0.0);

        // Set inputs (textures)
        inputs.forEach((input, index) => {
            const loc = this.shaderManager.getUniformLocation(program, input.name);
            if (loc !== null) {
                gl.activeTexture(gl.TEXTURE0 + index);
                gl.bindTexture(gl.TEXTURE_2D, input.texture);
                gl.uniform1i(loc, index);
            }
        });

        // Set custom uniforms
        Object.entries(uniforms).forEach(([name, value]) => {
            const isArrayUniform = name === 'u_params' || name === 'u_integrated_values';
            const loc = isArrayUniform
                ? this.shaderManager.getUniformLocation(program, `${name}[0]`)
                : this.shaderManager.getUniformLocation(program, name);

            if (!loc) return;

            if (typeof value === 'number') {
                this.gl.uniform1f(loc, value);
                return;
            }

            const data =
                value instanceof Float32Array
                    ? value
                    : Array.isArray(value)
                        ? new Float32Array(value)
                        : null;

            if (!data) return;

            if (isArrayUniform) {
                this.gl.uniform1fv(loc, data);
            } else if (data.length === 2) {
                this.gl.uniform2fv(loc, data);
            } else {
                this.gl.uniform1fv(loc, data);
            }
        });

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    public resetStack() {
        if (!this.sourceTexture) return;
        this.draw('pass-through', this.pingPongFBs[0], [{ name: 'u_image', texture: this.sourceTexture }], {}, false, true);
        this.currentFBIndex = 0;
    }

    public enterSubStack() {
        this.inSubStack = true;
        this.currentSubFBIndex = 0;
        // Start sub-stack with a clear transparent texture
        const gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.subFBs[0]);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    public applyPass(programName: string, uniforms: Record<string, any>, is3D?: boolean) {
        if (this.inSubStack) {
            const input = this.subTextures[this.currentSubFBIndex];
            const outputFB = this.subFBs[1 - this.currentSubFBIndex];

            if (is3D) {
                this.renderThreeJS(programName, input, outputFB, uniforms);
            } else {
                this.draw(programName, outputFB, [{ name: 'u_image', texture: input }], uniforms, false, true);
            }
            this.currentSubFBIndex = 1 - this.currentSubFBIndex;
        } else {
            const input = this.pingPongTextures[this.currentFBIndex];
            const outputFB = this.pingPongFBs[1 - this.currentFBIndex];

            if (is3D) {
                this.renderThreeJS(programName, input, outputFB, uniforms);
            } else {
                this.draw(programName, outputFB, [{ name: 'u_image', texture: input }], uniforms, false, true);
            }
            this.currentFBIndex = 1 - this.currentFBIndex;
        }
    }

    /**
     * Executes one separable Gaussian H+V pass entirely within the low-res blur buffers.
     * Reads from blurTextures[0], uses blurTextures[1] as an intermediate,
     * and leaves the result back in blurTextures[0].
     * u_params[1] (blend) must already be set to 1.0 before calling.
     */
    private applyGaussianPassOnSmallBuffer(stepH: number, stepV: number, uniforms: Record<string, any>) {
        uniforms.u_params[0] = stepH;
        this.draw('GAUSSIAN_BLUR_H', this.blurFBs[1], [{ name: 'u_image', texture: this.blurTextures[0] }], uniforms, false, true);

        uniforms.u_params[0] = stepV;
        this.draw('GAUSSIAN_BLUR_V', this.blurFBs[0], [{ name: 'u_image', texture: this.blurTextures[1] }], uniforms, false, true);
    }

    public applyIterativeBlur(uniforms: Record<string, any>) {
        const gl = this.gl;
        const originalIntensity = uniforms.u_params[0];
        const originalBlend = uniforms.u_params[1];
        const normalizedIntensity = originalIntensity / 100.0;
        const normalizedBlend = originalBlend / 100.0;
        const res = uniforms.u_resolution as Float32Array;
        const fullW = res[0];
        const fullH = res[1];

        // Resolve the active stack's current input and output
        const input = this.inSubStack
            ? this.subTextures[this.currentSubFBIndex]
            : this.pingPongTextures[this.currentFBIndex];
        const outputFB = this.inSubStack
            ? this.subFBs[1 - this.currentSubFBIndex]
            : this.pingPongFBs[1 - this.currentFBIndex];

        // ── Step 1: Downsample ───────────────────────────────────────────────────
        // Blit the full-res input into a 1/4-size buffer. The GPU's built-in
        // bilinear filter averages 4x4 pixel blocks automatically — a free
        // first-pass softening with zero mipmapping.
        gl.viewport(0, 0, this.blurWidth, this.blurHeight);
        this.draw('pass-through', this.blurFBs[0], [{ name: 'u_image', texture: input }], {}, false, true);

        // ── Step 2: Multi-pass Gaussian on the small buffer ──────────────────────
        // Three H+V passes at staggered radii [0.5×, 1.0×, 2.0×] approximate a
        // true Gaussian across a wide radius. Running them at 1/4 resolution means
        // this is still ~5× cheaper than a single full-res pass, with no blockiness.
        const baseStep = normalizedIntensity * (uniforms.u_unit / 3.2);
        uniforms.u_params[1] = 1.0; // full internal blend for all passes

        for (const m of [0.5, 1.0, 2.0]) {
            this.applyGaussianPassOnSmallBuffer(
                (m * baseStep) / this.blurWidth,
                (m * baseStep) / this.blurHeight,
                uniforms
            );
        }

        // ── Step 3: Upsample + blend back to full res ────────────────────────────
        // Restore full-res viewport, draw the original to the output (clear),
        // then overlay the blurred result using CONSTANT_ALPHA blending:
        //   result = normalizedBlend * blurred + (1 - normalizedBlend) * original
        // This is identical to mix(original, blurred, blend) — preserving the
        // blend parameter's behaviour exactly as before.
        gl.viewport(0, 0, fullW, fullH);
        this.draw('pass-through', outputFB, [{ name: 'u_image', texture: input }], {}, false, true);

        if (normalizedBlend > 0.0) {
            gl.enable(gl.BLEND);
            gl.blendColor(0, 0, 0, normalizedBlend);
            gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA);
            this.draw('pass-through', outputFB, [{ name: 'u_image', texture: this.blurTextures[0] }], {}, false, false);
            gl.disable(gl.BLEND);
        }

        // Advance the active stack index
        if (this.inSubStack) {
            this.currentSubFBIndex = 1 - this.currentSubFBIndex;
        } else {
            this.currentFBIndex = 1 - this.currentFBIndex;
        }

        // Restore u_params for subsequent effects in the pipeline
        uniforms.u_params[0] = originalIntensity;
        uniforms.u_params[1] = originalBlend;
    }

    private renderThreeJS(type: string, inputTexture: WebGLTexture, destFB: WebGLFramebuffer, uniforms: Record<string, any>) {
        const gl = this.gl;

        // 1. Get the 3D Render result as a Raw WebGLTexture handle
        const threeResultTexture = this.threeRenderer.render({
            type,
            width: gl.canvas.width,
            height: gl.canvas.height,
            image: inputTexture,
            params: uniforms.u_params,
            integratedValues: uniforms.u_integrated_values,
            time: uniforms.u_time
        });

        // 2. Use the 2D Engine's robust pipeline to "blit" this result into the destination
        if (threeResultTexture) {
            // Draw into destination FBO - no flipY needed here as Three already handled perspective
            this.draw('pass-through', destFB, [{ name: 'u_image', texture: threeResultTexture }], {}, false, true);
        } else {
            console.error('EffectPipeline: ThreeJS Render failed to return a texture handle');
            // FALLBACK: If 3D fails, draw the input so we don't vanish
            this.draw('pass-through', destFB, [{ name: 'u_image', texture: inputTexture }], {}, false, true);
        }
    }

    public mergeSubStack() {
        this.inSubStack = false;
        const subResult = this.subTextures[this.currentSubFBIndex];
        const mainInput = this.pingPongTextures[this.currentFBIndex];
        const mainOutputFB = this.pingPongFBs[1 - this.currentFBIndex];

        // Complex Blend: Draw the subResult OVER the mainInput onto mainOutputFB
        const gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, mainOutputFB);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // Premultiplied-safe blend (prevents darkening)

        // 1. Draw Background
        this.draw('pass-through', mainOutputFB, [{ name: 'u_image', texture: mainInput }], {}, false, true);
        // 2. Draw Foreground (Melded Group)
        this.draw('pass-through', mainOutputFB, [{ name: 'u_image', texture: subResult }], {}, false, false);

        gl.disable(gl.BLEND);

        this.currentFBIndex = 1 - this.currentFBIndex;
    }

    public renderToScreen(flipY: boolean = true) {
        const currentResult = this.pingPongTextures[this.currentFBIndex];
        this.draw('pass-through', null, [{ name: 'u_image', texture: currentResult }], {}, flipY, true);
    }

    public setInputTexture(texture: WebGLTexture) {
        this.sourceTexture = texture;
    }

    public dispose() {
        this.cleanupTextures();

        if (this.vao) {
            this.gl.deleteVertexArray(this.vao);
            this.vao = null;
        }
        if (this.quadBuffer) {
            this.gl.deleteBuffer(this.quadBuffer);
            this.quadBuffer = null;
        }
        if (this.threeRenderer) {
            this.threeRenderer.dispose();
        }
    }
}
