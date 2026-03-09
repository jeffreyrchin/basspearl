import * as THREE from 'three';
import { IThreeJSEffect, THREE_JS_EFFECTS } from './ThreeJSEffects';

/**
 * ThreeRenderParams: Unified parameters for 3D effects.
 */
export interface ThreeRenderParams {
    type: string;
    width: number;
    height: number;
    image: WebGLTexture;
    params: Float32Array;
    integratedValues: Float32Array;
    time: number;
}

/**
 * ThreeJSRenderer: A generalized 3D engine for glitch effects.
 *
 * Manages the WebGL context sandbox and texture handoff.
 */
export class ThreeJSRenderer {
    private renderer: THREE.WebGLRenderer;
    private effects: Record<string, IThreeJSEffect> = {};
    private renderTarget: THREE.WebGLRenderTarget;
    private inputTexture: THREE.Texture;
    private gl: WebGL2RenderingContext;

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;

        // Save the current 2D-pipeline pixel store state, reset for Three.js
        // construction (which uploads 3D internal textures that reject FLIP_Y),
        // then restore immediately so the 2D pipeline is unaffected.
        const prevFlip = gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL);
        const prevAlpha = gl.getParameter(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

        this.renderer = new THREE.WebGLRenderer({
            canvas: gl.canvas as HTMLCanvasElement,
            context: gl,
            antialias: false,
            alpha: true,
            premultipliedAlpha: false
        });

        // Restore 2D pipeline pixel store state immediately
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, prevFlip);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, prevAlpha);
        this.renderer.autoClear = false;

        this.renderTarget = new THREE.WebGLRenderTarget(1, 1);

        // Plain Texture — no image data, no DataTexture. We will manually
        // inject the WebGLTexture handle via the properties map each frame.
        this.inputTexture = new THREE.Texture();
        (this.inputTexture as any).isRenderTargetTexture = true; // suppress auto-upload
    }

    private getEffect(type: string): IThreeJSEffect | null {
        if (this.effects[type]) return this.effects[type];
        const effectFactory = THREE_JS_EFFECTS[type];
        if (!effectFactory) return null;
        this.effects[type] = effectFactory();
        return this.effects[type];
    }

    /**
     * Renders the 3D scene and returns the resulting WebGLTexture handle.
     */
    public render(params: ThreeRenderParams): WebGLTexture | null {
        if (params.width <= 0 || params.height <= 0) return null;

        const { type, width, height, image } = params;
        const effect = this.getEffect(type);
        if (!effect) return null;

        const gl = this.gl;

        // 1. Synchronize Dimensions
        if (this.renderTarget.width !== width || this.renderTarget.height !== height) {
            this.renderTarget.setSize(width, height);
            effect.camera.aspect = width / height;
            effect.camera.updateProjectionMatrix();
        }

        // 2. Surgical Texture Injection — NO texImage* calls, NO DataTexture upload.
        // We directly replace the WebGLTexture handle in the properties map.
        // Three.js uses this map when binding uniforms, so it will bind our
        // 2D-pipeline texture correctly without triggering any re-upload.
        let texProps = (this.renderer as any).properties.get(this.inputTexture);
        if (!texProps) {
            // Create an empty entry manually to avoid trigering initTexture
            (this.renderer as any).properties.get(this.inputTexture); // ensure entry exists
            texProps = {};
            (this.renderer as any).properties._properties?.set(this.inputTexture, texProps);
        }

        // Overwrite the handle every frame with the live 2D-pipeline texture
        if (texProps) {
            texProps.__webglTexture = image;
            texProps.webglTexture = image;
            texProps.__texture = image;
            texProps.__webglInit = true;
            texProps.version = this.inputTexture.version;
        }

        // Bump version so Three.js uniform binder considers it "dirty"
        this.inputTexture.needsUpdate = true;
        this.inputTexture.version++;

        // 3. Pass texture to effect uniforms
        effect.update(params, this.inputTexture);
        effect.scene.updateMatrixWorld(true);
        effect.camera.updateMatrixWorld(true);

        // 4. Global Sharpening (Mipmapping & Anisotropy)
        // This is strictly required for high-resolution 3D terrains.
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, image);
        const prevWrapS = gl.getTexParameter(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S);
        const prevWrapT = gl.getTexParameter(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T);
        const prevMinFilter = gl.getTexParameter(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER);
        const prevMagFilter = gl.getTexParameter(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        const ext = gl.getExtension('EXT_texture_filter_anisotropic');
        if (ext) {
            const maxVal = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
            gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, maxVal);
        }
        gl.generateMipmap(gl.TEXTURE_2D);

        const prevUnpackFlip = gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL);
        const prevUnpackAlpha = gl.getParameter(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL);
        const currentVp = gl.getParameter(gl.VIEWPORT);
        const currentVao = gl.getParameter(gl.VERTEX_ARRAY_BINDING);

        // IMPORTANT: Reset pixel store params to neutral values before Three.js
        // renders, so it never tries to upload with FLIP_Y/PREMULTIPLY on a 3D tex.
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

        this.renderer.state.reset();

        // 5. Render to RenderTarget — Solid Black
        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.setViewport(0, 0, width, height);

        gl.colorMask(true, true, true, true);
        gl.depthMask(true);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

        try {
            this.renderer.render(effect.scene, effect.camera);
        } catch (e) {
            console.error('ThreeJSRenderer: Fatal Render Error', e);
        }

        gl.flush();

        // 6. Restore context to 2D-pipeline-safe state (IMPORTANT)
        this.renderer.setRenderTarget(null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindVertexArray(currentVao);
        gl.viewport(currentVp[0], currentVp[1], currentVp[2], currentVp[3]);

        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.SCISSOR_TEST);
        gl.disable(gl.STENCIL_TEST);
        gl.depthMask(false);
        gl.colorMask(true, true, true, true);

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, prevUnpackFlip);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, prevUnpackAlpha);

        // RESTORE THE TEXTURE'S WRAPPING STATE SO 2D SHADERS DON'T BREAK
        gl.bindTexture(gl.TEXTURE_2D, image);
        if (prevWrapS) gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, prevWrapS as number);
        if (prevWrapT) gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, prevWrapT as number);

        // Three.js sets these to linear for mipmapping, but we need to reset them for our 2D shaders!
        if (prevMinFilter) gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, prevMinFilter as number);
        if (prevMagFilter) gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, prevMagFilter as number);

        // UNBIND the texture so it isn't "hot" on this unit for the next pass
        gl.bindTexture(gl.TEXTURE_2D, null);

        this.renderer.state.reset();

        // 7. Broad Spectrum Texture Extraction from the RenderTarget
        const rtTextureProps = (this.renderer as any).properties.get(this.renderTarget.texture);
        let resultHandle: WebGLTexture | null = null;

        if (rtTextureProps) {
            resultHandle = rtTextureProps.__webglTexture
                || rtTextureProps.webglTexture
                || rtTextureProps.__texture;

            if (!resultHandle) {
                const keys = [
                    ...Object.getOwnPropertyNames(rtTextureProps),
                    ...Object.getOwnPropertySymbols(rtTextureProps)
                ];
                for (const key of keys) {
                    const val = rtTextureProps[key as any];
                    if (val instanceof WebGLTexture) {
                        resultHandle = val;
                        break;
                    }
                }
            }
        }

        return resultHandle;
    }

    public dispose() {
        this.renderer.dispose();
        this.renderTarget.dispose();
        this.inputTexture.dispose();
        Object.values(this.effects).forEach(e => e.dispose());
    }
}
