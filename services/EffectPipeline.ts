import { TextureManager } from './TextureManager';
import { ShaderManager } from './ShaderManager';

export class EffectPipeline {
    private gl: WebGL2RenderingContext;
    private textureManager: TextureManager;
    private shaderManager: ShaderManager;

    private vao: WebGLVertexArrayObject | null = null;
    private quadBuffer: WebGLBuffer | null = null;

    private pingPongTextures: [WebGLTexture, WebGLTexture] = [null as any, null as any];
    private pingPongFBs: [WebGLFramebuffer, WebGLFramebuffer] = [null as any, null as any];
    private currentFBIndex = 0;

    private sourceTexture: WebGLTexture | null = null;

    constructor(gl: WebGL2RenderingContext, textureManager: TextureManager, shaderManager: ShaderManager) {
        this.gl = gl;
        this.textureManager = textureManager;
        this.shaderManager = shaderManager;
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

        this.pingPongTextures[0] = this.textureManager.createTexture(width, height);
        this.pingPongTextures[1] = this.textureManager.createTexture(width, height);
        this.pingPongFBs[0] = this.textureManager.createFramebuffer(this.pingPongTextures[0]);
        this.pingPongFBs[1] = this.textureManager.createFramebuffer(this.pingPongTextures[1]);

        this.currentFBIndex = 0;
    }

    private cleanupTextures() {
        this.textureManager.destroyTexture(this.pingPongTextures[0]);
        this.textureManager.destroyTexture(this.pingPongTextures[1]);
        this.textureManager.destroyFramebuffer(this.pingPongFBs[0]);
        this.textureManager.destroyFramebuffer(this.pingPongFBs[1]);
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
        flipY: boolean = false
    ) {
        const gl = this.gl;
        const program = this.shaderManager.getProgram(programName);
        if (!program) return;

        gl.useProgram(program);
        gl.bindVertexArray(this.vao);
        gl.bindFramebuffer(gl.FRAMEBUFFER, destFB);

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
            const loc =
                name === 'u_params'
                    ? this.shaderManager.getUniformLocation(program, `${name}[0]`)
                    : this.shaderManager.getUniformLocation(program, name);

            if (!loc) return;

            if (typeof value === 'number') {
                gl.uniform1f(loc, value);
                return;
            }

            const data =
                value instanceof Float32Array
                    ? value
                    : Array.isArray(value)
                        ? new Float32Array(value)
                        : null;

            if (!data) return;

            if (name === 'u_params') {
                gl.uniform1fv(loc, data);
            } else if (data.length === 2) {
                gl.uniform2fv(loc, data);
            } else {
                gl.uniform1fv(loc, data);
            }
        });

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    public resetStack() {
        if (!this.sourceTexture) return;
        this.draw('pass-through', this.pingPongFBs[0], [{ name: 'u_image', texture: this.sourceTexture }]);
        this.currentFBIndex = 0;
    }

    public applyPass(programName: string, uniforms: Record<string, any>) {
        const input = this.pingPongTextures[this.currentFBIndex];
        const outputFB = this.pingPongFBs[1 - this.currentFBIndex];
        this.draw(programName, outputFB, [{ name: 'u_image', texture: input }], uniforms);
        this.currentFBIndex = 1 - this.currentFBIndex;
    }

    public getVAO(): WebGLVertexArrayObject | null {
        return this.vao;
    }

    public getResultTexture(): WebGLTexture {
        return this.pingPongTextures[this.currentFBIndex];
    }

    public renderToScreen(flipY: boolean = true) {
        const currentResult = this.pingPongTextures[this.currentFBIndex];
        this.draw('pass-through', null, [{ name: 'u_image', texture: currentResult }], {}, flipY);
    }

    public setInputTexture(texture: WebGLTexture) {
        this.sourceTexture = texture;
    }
}
