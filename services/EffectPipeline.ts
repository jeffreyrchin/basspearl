
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
    private feedbackTexture: WebGLTexture | null = null;
    private feedbackFB: WebGLFramebuffer | null = null;

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

        this.feedbackTexture = this.textureManager.createTexture(width, height);
        this.feedbackFB = this.textureManager.createFramebuffer(this.feedbackTexture);

        this.currentFBIndex = 0;
    }

    private cleanupTextures() {
        this.textureManager.destroyTexture(this.pingPongTextures[0]);
        this.textureManager.destroyTexture(this.pingPongTextures[1]);
        this.textureManager.destroyTexture(this.feedbackTexture);
        this.textureManager.destroyFramebuffer(this.pingPongFBs[0]);
        this.textureManager.destroyFramebuffer(this.pingPongFBs[1]);
        this.textureManager.destroyFramebuffer(this.feedbackFB);
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
            const loc = this.shaderManager.getUniformLocation(program, name);
            if (loc === null) return;

            if (typeof value === 'number') {
                gl.uniform1f(loc, value);
            } else if (Array.isArray(value) || value instanceof Float32Array) {
                // Ensure typed array for WebGL
                const data = value instanceof Float32Array ? value : new Float32Array(value);

                if (data.length === 2) gl.uniform2fv(loc, data);
                else if (data.length === 3) gl.uniform3fv(loc, data);
                else if (data.length === 4) gl.uniform4fv(loc, data);
            }
        });

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    public resetStack() {
        if (!this.sourceTexture) return;
        this.draw('pass-through', this.pingPongFBs[0], [{ name: 'u_image', texture: this.sourceTexture }]);
        this.currentFBIndex = 0;
    }

    public applyEffect(programName: string, uniforms: Record<string, any>) {
        const program = this.shaderManager.getProgram(programName);
        if (!program) return;

        const input = this.pingPongTextures[this.currentFBIndex];
        const outputFB = this.pingPongFBs[1 - this.currentFBIndex];

        // Check if shader needs feedback texture
        const prevFrameLoc = this.shaderManager.getUniformLocation(program, 'u_prevFrame');

        if (prevFrameLoc !== null && this.feedbackTexture) {
            this.draw(programName, outputFB, [
                { name: 'u_prevFrame', texture: this.feedbackTexture },
                { name: 'u_image', texture: input }
            ], uniforms);
        } else {
            this.draw(programName, outputFB, [{ name: 'u_image', texture: input }], uniforms);
        }

        this.currentFBIndex = 1 - this.currentFBIndex;
    }

    public saveFeedback() {
        if (!this.feedbackFB) return;
        const currentResult = this.pingPongTextures[this.currentFBIndex];
        this.draw('pass-through', this.feedbackFB, [{ name: 'u_image', texture: currentResult }]);
    }

    public initializeFeedback() {
        if (!this.sourceTexture || !this.feedbackFB) return;
        // Seed feedback
        this.draw('pass-through', this.feedbackFB, [{ name: 'u_image', texture: this.sourceTexture }]);
        // Seed ping-pong 0
        this.draw('pass-through', this.pingPongFBs[0], [{ name: 'u_image', texture: this.sourceTexture }]);
        this.currentFBIndex = 0;
    }

    public renderToScreen(flipY: boolean = true) {
        const currentResult = this.pingPongTextures[this.currentFBIndex];
        this.draw('pass-through', null, [{ name: 'u_image', texture: currentResult }], {}, flipY);
    }

    public setInputTexture(texture: WebGLTexture) {
        this.sourceTexture = texture;
    }

    public getResultTexture(): WebGLTexture {
        return this.pingPongTextures[this.currentFBIndex];
    }
}
