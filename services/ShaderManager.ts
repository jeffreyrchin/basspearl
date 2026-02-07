
export class ShaderManager {
    private gl: WebGL2RenderingContext;
    private programs: Map<string, WebGLProgram> = new Map();
    private uniformCache: Map<WebGLProgram, Map<string, WebGLUniformLocation | null>> = new Map();

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
    }

    public createProgram(name: string, vertexSource: string, fragmentSource: string): WebGLProgram {
        const gl = this.gl;
        const vertexShader = this.compileShader(vertexSource, gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(fragmentSource, gl.FRAGMENT_SHADER);

        const program = gl.createProgram();
        if (!program) throw new Error('Failed to create program');

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);

        // Explicitly bind attribute locations for consistency across hardware
        gl.bindAttribLocation(program, 0, 'a_position');
        gl.bindAttribLocation(program, 1, 'a_texCoord');

        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            throw new Error('Failed to link program: ' + info);
        }

        this.programs.set(name, program);
        this.uniformCache.set(program, new Map());
        return program;
    }

    public getProgram(name: string): WebGLProgram | undefined {
        return this.programs.get(name);
    }

    public getUniformLocation(program: WebGLProgram, name: string): WebGLUniformLocation | null {
        let cache = this.uniformCache.get(program);
        if (!cache) {
            cache = new Map();
            this.uniformCache.set(program, cache);
        }

        if (cache.has(name)) {
            return cache.get(name)!;
        }

        const loc = this.gl.getUniformLocation(program, name);
        cache.set(name, loc);
        return loc;
    }

    private compileShader(source: string, type: number): WebGLShader {
        const gl = this.gl;
        const shader = gl.createShader(type);
        if (!shader) throw new Error('Failed to create shader');

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error('Failed to compile shader: ' + info);
        }

        return shader;
    }

    public destroy() {
        this.programs.forEach(program => this.gl.deleteProgram(program));
        this.programs.clear();
        this.uniformCache.clear();
    }
}

export const BASE_VERTEX_SHADER = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_texCoord;
uniform float u_flipY;
void main() {
  vec2 pos = a_position;
  if (u_flipY == 1.0) {
    pos.y = -pos.y;
  }
  gl_Position = vec4(pos, 0, 1);
  v_texCoord = a_texCoord;
}
`;

export const PASS_THROUGH_FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
in vec2 v_texCoord;
out vec4 outColor;
void main() {
  outColor = texture(u_image, v_texCoord);
}
`;
