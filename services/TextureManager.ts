
export class TextureManager {
    private gl: WebGL2RenderingContext;

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    }

    public createTexture(width: number, height: number, data: TexImageSource | null = null): WebGLTexture {
        const gl = this.gl;
        const texture = gl.createTexture();
        if (!texture) throw new Error('Failed to create texture');

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        if (data) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
        } else {
            // Fill with opaque black (0,0,0,255) as default for imageless mode
            const black = new Uint8Array(width * height * 4).fill(0);
            for (let i = 3; i < black.length; i += 4) black[i] = 255;
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, black);
        }

        return texture;
    }

    public updateTexture(texture: WebGLTexture, data: TexImageSource) {
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
    }

    public createFramebuffer(texture: WebGLTexture): WebGLFramebuffer {
        const gl = this.gl;
        const fb = gl.createFramebuffer();
        if (!fb) throw new Error('Failed to create framebuffer');

        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        return fb;
    }

    public destroyTexture(texture: WebGLTexture | null) {
        if (texture) this.gl.deleteTexture(texture);
    }

    public destroyFramebuffer(fb: WebGLFramebuffer | null) {
        if (fb) this.gl.deleteFramebuffer(fb);
    }
}
