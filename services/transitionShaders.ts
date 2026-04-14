/**
 * transitionShaders.ts
 * 
 * Specialized shaders for blending between two scene textures.
 * These shaders take two inputs: u_image (from) and u_overlay (to),
 * plus a u_progress uniform (0.0 to 1.0).
 */

export const TRANSITION_SHADERS = {
  CROSSFADE: `#version 300 es
    precision highp float;
    uniform sampler2D u_image;
    uniform sampler2D u_overlay;
    uniform float u_progress;
    in vec2 v_texCoord;
    out vec4 outColor;

    void main() {
        vec4 from = texture(u_image, v_texCoord);
        vec4 to = texture(u_overlay, v_texCoord);
        outColor = mix(from, to, u_progress);
    }`,

  FADE_TO_BLACK: `#version 300 es
    precision highp float;
    uniform sampler2D u_image;
    uniform sampler2D u_overlay;
    uniform float u_progress;
    in vec2 v_texCoord;
    out vec4 outColor;

    void main() {
        vec4 from = texture(u_image, v_texCoord);
        vec4 to = texture(u_overlay, v_texCoord);
        
        if (u_progress < 0.5) {
            outColor = mix(from, vec4(0.0, 0.0, 0.0, 1.0), u_progress * 2.0);
        } else {
            outColor = mix(vec4(0.0, 0.0, 0.0, 1.0), to, (u_progress - 0.5) * 2.0);
        }
    }`,

  FLASH: `#version 300 es
    precision highp float;
    uniform sampler2D u_image;
    uniform sampler2D u_overlay;
    uniform float u_progress;
    in vec2 v_texCoord;
    out vec4 outColor;

    void main() {
        vec4 from = texture(u_image, v_texCoord);
        vec4 to = texture(u_overlay, v_texCoord);
        
        if (u_progress < 0.5) {
            outColor = mix(from, vec4(1.0, 1.0, 1.0, 1.0), u_progress * 2.0);
        } else {
            outColor = mix(vec4(1.0, 1.0, 1.0, 1.0), to, (u_progress - 0.5) * 2.0);
        }
    }`,

  ZOOM_FADE: `#version 300 es
    precision highp float;
    uniform sampler2D u_image;
    uniform sampler2D u_overlay;
    uniform float u_progress;
    in vec2 v_texCoord;
    out vec4 outColor;

    void main() {
        // Magnify Scene A (Start at 1.0, zoom IN to 0.7)
        float zoomA = 1.0 - (u_progress * 0.3);
        vec2 uvFrom = (v_texCoord - 0.5) * zoomA + 0.5;
        
        // Scene B starts magnified (0.7) and pulls BACK to 1.0
        float zoomB = 0.7 + (u_progress * 0.3);
        vec2 uvTo = (v_texCoord - 0.5) * zoomB + 0.5;
        
        vec4 from = texture(u_image, uvFrom);
        vec4 to = texture(u_overlay, uvTo);
        
        outColor = mix(from, to, u_progress);
    }`
};
