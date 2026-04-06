export const GLSL_HASH = `
// Robust Integer Hash for stability across large coordinate ranges and seeds
float hash(vec2 p, float seed) {
    uvec3 v = uvec3(uvec2(ivec2(p)), uint(seed * 12345.0));
    uint h = (v.x * 1597334677u) ^ (v.y * 3812015801u) ^ v.z;
    h = h * (h ^ (h >> 16u));
    h = h * (h ^ (h >> 16u));
    return float(h) * (1.0 / 4294967296.0);
}
`;

export const GLSL_TRANSFORM = `
struct TR {
    vec2 localUV; 
    float mask;
};

// Affine transform: Supports localized aspect-correct rotation, scale, and offset (pan)
TR getTransform_(vec2 uv_, vec2 scale_, vec2 pivot_, vec2 offset_, float rotation_, vec2 res_) {
    float aspect = res_.x / res_.y;
    float sx_ = max(scale_.x / 100.0, 0.0001);
    float sy_ = max(scale_.y / 100.0, 0.0001);
    
    // 1. Move space to the panned center (pivot + offset) and correct for aspect ratio
    vec2 rel_ = uv_ - (pivot_ + offset_ / 100.0);
    rel_.x *= aspect;

    // 2. Rotate
    float angle = -rotation_ / 100.0 * 6.28318530718;
    float c = cos(angle), s = sin(angle);
    rel_ = mat2(c, -s, s, c) * rel_;
    
    // 3. Un-correct aspect, scale relative to the local center, and move to pivot
    rel_.x /= aspect;
    rel_ = rel_ / vec2(sx_, sy_) + pivot_;
    
    // 4. Stencil Boundary Mask
    float m_ = step(0.0, rel_.x) * step(rel_.x, 1.0) * step(0.0, rel_.y) * step(rel_.y, 1.0);
    
    return TR(rel_, m_);
}

// Overload for center-based effects with wide pan (0-100 -> -100 to 100) and rotation
TR getTransform_(vec2 uv_, float scaleX, float scaleY, float panX, float panY, float rotation, vec2 res_) {
    return getTransform_(uv_, vec2(scaleX * 2.0, scaleY * 2.0), vec2(0.5), vec2((panX - 50.0) * 2.0, (panY - 50.0) * 2.0), rotation, res_);
}

// Overload for center-based effects with wide pan (0-100 -> -100 to 100) and no rotation
TR getTransform_(vec2 uv_, float scaleX, float scaleY, float panX, float panY) {
    return getTransform_(uv_, vec2(scaleX * 2.0, scaleY * 2.0), vec2(0.5), vec2((panX - 50.0) * 2.0, (panY - 50.0) * 2.0), 0.0, vec2(1.0));
}
`;

export const CHANNEL_SHIFT_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[6]; // [shiftX, shiftY, scaleX, scaleY, panX, panY]
uniform float u_unit;
uniform vec2 u_resolution;
in vec2 v_texCoord;
out vec4 outColor;
${GLSL_TRANSFORM}

// Branchless (no if/else) sampling that returns transparent black outside 0..1 range (eliminates streaks)
vec4 sampleTexture(sampler2D tex, vec2 uv) {
    // Returns 1.0 if inside [0, 1], 0.0 if outside
    vec2 inside = step(vec2(0.0), uv) * step(uv, vec2(1.0));
    float isVisible = inside.x * inside.y;
    return texture(tex, uv) * isVisible;
}

void main() {
    TR tr = getTransform_(v_texCoord, u_params[2], u_params[3], u_params[4], u_params[5]);
    vec2 pixelSize = 1.0 / u_resolution;
    
    // Target: Max ~100px (10 units).
    // int=100 -> 10 * u_unit.
    // factor = 0.1.
    
    float shiftX = u_params[0] * 0.1 * u_unit * pixelSize.x;
    float shiftY = u_params[1] * 0.1 * u_unit * pixelSize.y;
    
    vec4 color = sampleTexture(u_image, v_texCoord);
    vec4 sampR = sampleTexture(u_image, v_texCoord - vec2(shiftX, shiftY));
    vec4 sampB = sampleTexture(u_image, v_texCoord + vec2(shiftX, shiftY));
    
    // Composite alpha ensures ghosts stay visible and solid when melded
    float finalAlpha = max(color.a, max(sampR.a, sampB.a));
    
    outColor = mix(color, vec4(sampR.r, color.g, sampB.b, finalAlpha), tr.mask);
}
`;

export const BIT_CRUSH_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[6]; // [quantize, resample, scaleX, scaleY, panX, panY]
uniform float u_unit;
uniform vec2 u_resolution;
in vec2 v_texCoord;
out vec4 outColor;
${GLSL_TRANSFORM}

void main() {
    TR tr = getTransform_(v_texCoord, u_params[2], u_params[3], u_params[4], u_params[5]);
    float qFactor = floor(pow(u_params[0] / 10.0, 2.2)) + 1.0;
    float rFactor = max(1.0, (u_params[1] * 0.1) * u_unit);
    
    vec2 res = u_resolution;
    vec2 gridCoord = floor(v_texCoord * res / rFactor) * rFactor / res;
    
    // 1. Sample Background (Sharp) and Crushed pixels separately
    vec4 src = texture(u_image, v_texCoord);
    vec4 crushed = texture(u_image, gridCoord);
    
    // 2. Apply quantization to the crushed sample
    vec3 quant = floor(crushed.rgb * 255.0 / qFactor) * qFactor / 255.0;
    
    // 3. Mix: Sharp photo outside, Crushed math inside
    outColor = mix(src, vec4(quant, crushed.a), tr.mask);
}
`;

export const DEEP_FRY_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[2]; // [heat, posterize]
in vec2 v_texCoord;
out vec4 outColor;

void main() {
    float contrast = 1.0 + pow(u_params[0] / 20.0, 2.0);
    float brightness = (u_params[0] * 1.5) / 255.0;
    // Non-linear levels for better control (255 -> 2)
    float levels = max(2.0, 256.0 / (1.0 + (u_params[1] * 0.5)));
    
    vec4 color = texture(u_image, v_texCoord);
    
    vec3 val = color.rgb;
    val = (val - 0.5) * contrast + 0.5 + brightness;
    val = floor(val * levels) / levels;
    
    if (u_params[0] > 50.0) {
        float m = max(val.r, max(val.g, val.b));
        if (val.r < m) val.r *= 0.8;
        if (val.g < m) val.g *= 0.8;
        if (val.b < m) val.b *= 0.8;
    }
    
    outColor = vec4(clamp(val, 0.0, 1.0), color.a);
}
`;

export const WAVE_DISTORTION_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[3]; // [amplitude, frequency, speed]
uniform float u_unit;
uniform float u_integrated_values[8];
uniform vec2 u_resolution;
in vec2 v_texCoord;
out vec4 outColor;

void main() {
    // 1. Calculate Physical Scale
    // Target: Max Amplitude 300px (30 units).
    // int=100 -> 30 * u_unit.
    // factor = 0.3.
    float ampPixels = u_params[0] * 0.3 * u_unit;
    // We only distort X, so use pixelSize.x
    float amp = ampPixels / u_resolution.x;
    
    // Param 1 functions as purely wave count
    float waves = max(1.0, u_params[1] * 0.5);
    
    // Param 2 functions as purely scroll speed
    float speed = u_params[2] * 0.3;
    
    // We use u_integrated_values[2] for the phase to ensure smooth, non-jittery motion.
    float startPhase = u_integrated_values[2] * speed;
    
    // 2. Centered Projection
    // Expansion/contraction happens from the middle (v_texCoord.y - 0.5)
    float centeredY = v_texCoord.y - 0.5;
    float angle = centeredY * 3.14159 * 2.0 * waves + startPhase;
    
    float xOffset = sin(angle) * amp;
    
    // 3. Infinite Horizontal Wrap
    // Using fract() ensures a seamless repeating look.
    vec2 coord = vec2(v_texCoord.x + xOffset, v_texCoord.y);
    outColor = texture(u_image, fract(coord));
}
`;

export const HUE_ROTATION_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[3]; // [phase offset, speed, vibrance]
uniform float u_integrated_values[8];
in vec2 v_texCoord;
out vec4 outColor;

vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    vec4 color = texture(u_image, v_texCoord);
    vec3 hsv = rgb2hsv(color.rgb);
    
    float phase = u_params[0] / 100.0;
    float speed    = u_params[1] / 100.0;
    float vibrance = u_params[2] / 100.0;
    float time     = u_integrated_values[1] * speed;

    hsv.x = fract(hsv.x + phase + time);
    hsv.y = clamp(hsv.y + vibrance, 0.0, 1.0);
    
    outColor = vec4(hsv2rgb(hsv), color.a);
}
`;

export const INVERT_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[1]; // [inversion]
in vec2 v_texCoord;
out vec4 outColor;

void main() {
    vec4 color = texture(u_image, v_texCoord);
    float opacity = u_params[0] / 100.0;
    
    // Invert relative to alpha (prevents transparent pixels turning white)
    vec3 inverted = color.a - color.rgb;
    vec3 mixed = mix(color.rgb, inverted, opacity);
    
    outColor = vec4(mixed, color.a);
}
`;

export const SPECTRAL_MAP_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[8]; // [resolution, phase offset, speed, strength, scaleX, scaleY, panX, panY]
uniform float u_integrated_values[8];
in vec2 v_texCoord;
out vec4 outColor;
${GLSL_TRANSFORM}

void main() {
    TR tr = getTransform_(v_texCoord, u_params[4], u_params[5], u_params[6], u_params[7]);
    vec4 src = texture(u_image, v_texCoord);
    
    // 1. Calculate Luminance (Luma)
    float lum = dot(src.rgb, vec3(0.299, 0.587, 0.114));
    
    // 2. Synthesize Spectrum (Cosine Palette)
    float freq     = u_params[0] / 20.0; // Resolution of the rainbow
    float shift    = u_params[1] / 100.0; // Rotation/phase offset of the rainbow
    float speed    = u_params[2] / 100.0; // Rotation speed
    float strength = u_params[3] / 100.0; // Blend with original
    float time     = u_integrated_values[2] * speed;
    // t drives the 'time' or 'position' on the color wheel
    float t = lum * freq + shift + time;
    
    // High-fidelity primitive colors (RGB phases)
    vec3 a = vec3(0.5);
    vec3 b = vec3(0.5);
    vec3 c = vec3(1.0);
    vec3 d = vec3(0.00, 0.33, 0.67); // Standard 120-degree RGB split
    
    vec3 spectral = a + b * cos(6.28318 * (c * t + d));
    
    // 3. Application: Multiply-Mixed
    // This preserves the internal darkness of the original image
    vec3 finalColor = mix(src.rgb, src.rgb * spectral, strength);
    
    outColor = mix(src, vec4(finalColor, src.a), tr.mask);
}
`;

export const PIXEL_SORT_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[2]; // [streak length, trigger level]
uniform vec2 u_resolution;
uniform float u_seed;
in vec2 v_texCoord;
out vec4 outColor;

float rand(vec2 co) {
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
    float threshold = (100.0 - u_params[1]) / 100.0;
    float triggerProb = u_params[0] / 100.0;
    
    // 1. Hardware-level "Nearest" Sampling via texelFetch
    ivec2 pixelCoord = ivec2(
        clamp(v_texCoord * u_resolution, vec2(0.0), u_resolution - 1.0)
    );
    vec4 color = texelFetch(u_image, pixelCoord, 0);
    float brightness = dot(color.rgb, vec3(0.333));
    
    // Consistent column sampling (1024 bands) ensures same patterns across resolutions
    float colID = floor(v_texCoord.x * 1024.0);
    float colRand = rand(vec2(colID, u_seed));
    
    // Early exit for performance
    if (colRand > triggerProb || brightness < threshold) {
        outColor = color;
        return;
    }

    // 2. Dynamic Performance: Only loop as far as the user's streak length requires.
    // maxSteps is capped at 300 for 4K safety, but scales down to 1 if streak is low.
    const int MAX_STEPS = 300;
    float streakPercent = u_params[0] / 100.0;
    float maxSteps = max(1.0, streakPercent * float(MAX_STEPS));
    float stepPixels = max(1.0, (streakPercent * 0.4 * u_resolution.y) / maxSteps);
    
    ivec2 pullCoord = pixelCoord;
    
    for(int i = 0; i < MAX_STEPS; i++) {
        if(float(i) >= maxSteps) break;

        ivec2 checkCoord = pixelCoord - ivec2(0, int(float(i) * stepPixels));
        if(checkCoord.y < 0) break;
        
        float checkBrightness = dot(
            texelFetch(u_image, checkCoord, 0).rgb, 
            vec3(0.333)
        );
        
        if(checkBrightness < threshold) {
            pullCoord = checkCoord;
            break;
        }
    }
    
    outColor = texelFetch(u_image, pullCoord, 0);
}
`;

export const DATA_CORRUPTION_SHADER = `#version 300 es
precision highp float;

uniform sampler2D u_image;
uniform float u_params[2]; // [mosh length, mosh density]
uniform vec2 u_resolution;
uniform float u_unit;

in vec2 v_texCoord;
out vec4 outColor;

void main() {
    float moshLength  = u_params[0] / 10.0;
    float moshDensity = u_params[1] / 100.0;

    // Scale block size proportionally to u_unit for perfect resolution consistency.
    // By working in UV space without pixel-snapping the size itself, we avoid "jumps" 
    // in glitch intensity across different canvas sizes.
    vec2 blockUVSize = (u_unit * 0.4) / u_resolution;
    
    // Snap current coordinate to the logical block grid center
    vec2 blockUV = (floor(v_texCoord / blockUVSize) + 0.5) * blockUVSize;

    vec4 src   = texture(u_image, blockUV);
    float luma = dot(src.rgb, vec3(0.299, 0.587, 0.114));

    // Branchless check: 1.0 if moshed, else 0.0
    float isMoshed = step(1.0 - moshDensity, luma);

    // Calculate displacement in terms of whole "block units"
    // (src.rg - 0.5) captures motion vectors from the image content.
    vec2 motion = (src.rg - 0.5) * moshLength * 20.0;
    vec2 dispUV = floor(motion) * blockUVSize;

    // Apply the displacement only where threshold is met
    outColor = texture(u_image, v_texCoord - (dispUV * isMoshed));
}
`;

export const COLOR_BLEED_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[2]; // [bleed, ghosting]
uniform float u_unit;
uniform vec2 u_resolution;
in vec2 v_texCoord;
out vec4 outColor;

// Branchless (no if/else) sampling that returns transparent black outside 0..1 range (eliminates streaks)
vec4 sampleTexture(sampler2D tex, vec2 uv) {
    vec2 inside = step(vec2(0.0), uv) * step(uv, vec2(1.0));
    float isVisible = inside.x * inside.y;
    return texture(tex, uv) * isVisible;
}

void main() {
    vec2 pixelSize = 1.0 / u_resolution;
    
    // Target: Max bleed 100px (10 units).
    // int=100 -> 10 * u_unit.
    // factor = 0.1.
    
    float bleedAmount = (u_params[0] * 0.1 * u_unit) * pixelSize.x;
    float ghostShift = (u_params[1] * 0.1 * u_unit) * pixelSize.x;
    
    vec4 color = sampleTexture(u_image, v_texCoord);
    vec4 sampR = sampleTexture(u_image, v_texCoord - vec2(bleedAmount, 0.0));
    vec4 sampB = sampleTexture(u_image, v_texCoord + vec2(bleedAmount, 0.0));
    
    // Calculate ghost colors
    float r = sampR.r;
    float b = sampB.b;
    float g = color.g;
    
    float finalAlpha = max(color.a, max(sampR.a, sampB.a));
    
    if (ghostShift > 0.0) {
        vec4 sampG = sampleTexture(u_image, v_texCoord - vec2(ghostShift, 0.0));
        g = (g + sampG.g) / 1.5;
        finalAlpha = max(finalAlpha, sampG.a);
    }
    
    outColor = vec4((color.r + r)/2.0, g, (color.b + b)/2.0, finalAlpha);
}
`;

export const COMPRESSION_HELL_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[2]; // [block size, artifacting]
uniform float u_unit;
uniform vec2 u_resolution;
in vec2 v_texCoord;
out vec4 outColor;

void main() {
    float blockSize = max(1.0, (0.1 + (u_params[0] * 0.2)) * u_unit);
    float factor = u_params[1] / 10.0;
    float q = 1.0 + factor * 4.0;
    
    vec2 res = u_resolution;
    vec2 blockCoord = floor(v_texCoord * res / blockSize) * blockSize / res;
    
    vec4 color = texture(u_image, blockCoord);
    color.rgb = floor(color.rgb * 255.0 / q) * q / 255.0;
    
    // Ground ringing in block-relative coordinates to ensure consistency
    vec2 blockLocal = (v_texCoord * res) / blockSize;
    float ringing = cos(blockLocal.x * 3.14159) * cos(blockLocal.y * 3.14159) * (factor * 4.0 / 255.0);
    
    // Scale ringing by alpha and clamp to color.a to keep math premultiplied-safe
    vec3 finalRGB = clamp(color.rgb + (ringing * color.a), 0.0, color.a);
    outColor = vec4(finalRGB, color.a);
}
`;

export const ROTATE_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[2]; // [rotation, speed]
uniform float u_integrated_values[8];
uniform vec2 u_resolution;
in vec2 v_texCoord;
out vec4 outColor;

void main() {
    float baseRot = u_params[0] / 100.0 * 6.28318530718;
    float speed = u_params[1] / 100.0 * 10.0;
    float rotation = baseRot + (u_integrated_values[1] * speed);

    vec2 uv = v_texCoord - 0.5;
    float aspect = u_resolution.x / u_resolution.y;
    uv.x *= aspect;

    float cosAngle = cos(rotation);
    float sinAngle = sin(rotation);
    mat2 rot = mat2(cosAngle, -sinAngle, sinAngle, cosAngle);
    uv = rot * uv;

    uv.x /= aspect;
    uv += 0.5;

    float inBounds = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
    outColor = texture(u_image, uv) * inBounds;
}
`;

export const SKEW_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[1]; // [skew]
in vec2 v_texCoord;
out vec4 outColor;

void main() {
    float skew = 2.0 * (u_params[0] - 50.0) / 50.0;
    vec2 uv = v_texCoord - 0.5;
    uv.x -= skew * uv.y;
    uv += 0.5;

    float inBounds = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
    outColor = texture(u_image, uv) * inBounds;
}
`;

export const SCREEN_SHAKE_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[2]; // [displacement, speed]
uniform float u_integrated_values[8];
uniform vec2 u_resolution;
in vec2 v_texCoord;
out vec4 outColor;

float rand(vec2 co) {
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
    // Param 0: Amplitude of displacement
    // Param 1: Speed/Frequency of shake

    // Speed scales the frequency of the noise (Hz).
    // Range 0-100 maps to 0-20 Hz smooth frequency.
    float updateFreq = u_params[1] * 0.2;

    // "Travel" through noise space.
    float t = u_integrated_values[1] * updateFreq;

    // Smooth Value Noise Interpolation
    float i = floor(t);
    float f = fract(t);
    // Cubic smoothing (smoothstep) for better flow
    float u = f * f * (3.0 - 2.0 * f);

    // Jitter X
    float r1 = rand(vec2(i, 12.345));
    float r2 = rand(vec2(i + 1.0, 12.345));
    float smoothX = mix(r1, r2, u);

    // Jitter Y
    float r3 = rand(vec2(i, 67.890));
    float r4 = rand(vec2(i + 1.0, 67.890));
    float smoothY = mix(r3, r4, u);

    // Amplitude scales the displacement
    float amount = (u_params[0] / 100.0) * 0.05;
    
    float jitterX = (smoothX - 0.5) * amount;
    float jitterY = (smoothY - 0.5) * amount;
    
    vec2 coord = v_texCoord + vec2(jitterX, jitterY);

    if (coord.x >= 0.0 && coord.x <= 1.0 && coord.y >= 0.0 && coord.y <= 1.0) {
        outColor = texture(u_image, coord);
    } else {
        outColor = vec4(0.0);
    }
}
`;

export const STARFIELD_SHADER = `#version 300 es
precision highp float;

uniform sampler2D u_image;
uniform float u_params[2]; // [density, speed]
uniform float u_integrated_values[8];
uniform vec2 u_resolution;
uniform float u_seed;

in vec2 v_texCoord;
out vec4 outColor;

${GLSL_HASH}

void main() {
    float density = u_params[0] / 100.0;
    float speedScale = u_params[1] / 100.0;

    float travel = u_integrated_values[1] * speedScale * 4.0 + u_seed * 0.1;

    vec2 uv = (v_texCoord - 0.5) * u_resolution / u_resolution.y;

    vec3 color = vec3(0.0);

    for (float i = 0.0; i < 6.0; i++) {
        float offset = i / 6.0;
        float z = fract(travel + offset);
        float depth = z + 0.05;

        vec2 layerUV = uv / depth;

        float gridCount = 12.0 + i * 3.0;
        vec2 cell = layerUV * gridCount;
        vec2 gridID = floor(cell);
        vec2 gridUV = fract(cell) - 0.5;

        float r = hash(gridID + vec2(i * 37.0), u_seed + floor(travel + offset));

        // Branchless density mask
        float mask = step(1.0 - density * 0.3, r);

        // Squared distance (no sqrt)
        float d = dot(gridUV, gridUV);

        // Size variation
        float size = mix(40.0, 120.0, r);

        // Cheap falloff
        float star = 1.0 / (1.0 + d * size);

        // Parabolic depth fade
        float fade = z * (1.0 - z) * 4.0;

        float intensity = star * fade * mask;

        color += vec3(intensity);
    }

    vec4 src = texture(u_image, v_texCoord);

    // Final Star Alpha (luminance-based)
    float starAlpha = clamp(max(color.r, max(color.g, color.b)), 0.0, 1.0);

    // Premultiplied Mix
    vec3 finalRGB = mix(src.rgb, vec3(1.0), starAlpha);
    float finalAlpha = mix(src.a, 1.0, starAlpha);
    outColor = vec4(finalRGB, finalAlpha);
}
`;

export const TUNNEL_WARP_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[3]; // [scale, speed, twist]
uniform float u_integrated_values[8];
uniform vec2 u_resolution;
in vec2 v_texCoord;
out vec4 outColor;
void main() {
    float scale = max(u_params[0] / 100.0 * 2.0, 0.01); // prevent scale from being 0 to prevent y-coordinates from disappearing (prevents single horizontal pixel-row from stretching vertically across canvas)
    float speed = u_params[1] / 100.0;
    float twist = u_params[2] / 100.0 * 5.0;
    float time  = u_integrated_values[1] * speed * 3.0;
    
    vec2 uv = (v_texCoord - 0.5) * u_resolution / u_resolution.y;
    float r = length(uv);
    float a = atan(uv.y, uv.x);

    // Tunnel projection
    // x = angle, y = depth + motion
    float angleUV = a / 6.28318 + 0.5;
    float finalX = angleUV + (1.0/max(r, 0.001)) * twist * 0.1;
    float depth  = (1.0/max(r, 0.001)) * scale + time;

    // Universal Mirror Trick (Ping-ponging)
    // Ensures coordinates are ALWAYS captured in 0..1 range with no seams
    // Use x2 multiplier to create two mirrored halves around the circle
    vec2 warpedUV = vec2(
        abs(mod(finalX * 2.0, 2.0) - 1.0),
        abs(mod(depth, 2.0) - 1.0)
    );

    outColor = texture(u_image, warpedUV);
}
`;

export const GRAIN_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[12]; // [width, height, x-freq, y-freq, density, roundness, blend, scaleX, scaleY, panX, panY, rotation]
uniform vec2 u_resolution;
uniform float u_seed;
in vec2 v_texCoord;
out vec4 outColor;
${GLSL_TRANSFORM}
${GLSL_HASH}

void main() {
    TR tr = getTransform_(v_texCoord, u_params[7], u_params[8], u_params[9], u_params[10], u_params[11], u_resolution);
    // 1. Map sliders to frequency and parameters.
    float xScale = u_params[0] / 100.0;
    float yScale = u_params[1] / 100.0;
    float xFreq = u_params[2] / 100.0;
    float yFreq = u_params[3] / 100.0;
    float density = u_params[4] / 100.0;
    float roundness = u_params[5] / 100.0;
    float blend = u_params[6] / 100.0;

    // 2. Exponential frequency: freq=1 at 1%, doubling from there.
    // Fixed reference resolution (1024) ensures consistent cell density regardless of canvas size.
    vec2 freq = vec2(
        round(exp2(xFreq * log2(1024.0))),
        round(exp2(yFreq * log2(1024.0)))
    );

    // 3. Sample background image.
    vec4 src = texture(u_image, v_texCoord);

    // 4. Integer projection.
    vec2 cellCoord = tr.localUV * freq;
    vec2 cell = floor(cellCoord);
    vec2 p = fract(cellCoord) - 0.5; // Center coord [-0.5, 0.5]

    // 5. Generate Random Noise Mask (Optimized: Single Hash Call)
    float baseHash = hash(cell, u_seed);
    float threshold = baseHash; // full [0.0, 1.0] range for fair distribution
    float brightness = fract(baseHash * 43758.5453123) * 0.99 + 0.01; // restrict brightness to [0.01, 1.0] to prevent black voids
    float lit = step(1.0 - density, threshold) * step(0.001, density);

    // 6. Rounded Box SDF
    // Size maps directly to the Width/Height sliders (0.5 is full half-width)
    vec2 size = vec2(xScale, yScale) * 0.5;
    float r = roundness * min(size.x, size.y); // Corner radius
    
    vec2 q = abs(p) - size + r;
    float dist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;

    // 7. Sharp mask
    float shapeMask = step(dist, 0.0);
    lit *= shapeMask * step(0.001, xScale) * step(0.001, yScale); // multiply by 0 when width/height is at 0% to make pixels disappear.

    // 8. Output final color with blend support.
    float alpha = lit * blend * tr.mask;
    vec3 finalRGB = mix(src.rgb, vec3(brightness), alpha);
    float finalAlpha = mix(src.a, 1.0, alpha);
    outColor = vec4(finalRGB, finalAlpha);
}
`;

export const SHAPE_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[10]; // [side count, pointiness, roundness, feather, blend, scaleX, scaleY, panX, panY, rotation]
uniform vec2 u_resolution;
in vec2 v_texCoord;
out vec4 outColor;
${GLSL_TRANSFORM}

float sdStar(vec2 p, float m, float aps, float inr, float edge) {
    float a = atan(p.y, p.x) + aps;
    float aps2 = aps * 2.0;
    vec2 cp = length(p) * vec2(cos(mod(a, aps2) - aps), abs(sin(mod(a, aps2) - aps)));
    cp.x += m * inr * (1.0 - cp.y / max(edge, 0.001));
    cp -= vec2(inr, edge);
    cp.y += clamp(-cp.y, 0.0, edge * 2.0);
    return length(cp) * sign(cp.x);
}

void main() {
    TR tr = getTransform_(v_texCoord, u_params[5], u_params[6], u_params[7], u_params[8], u_params[9], u_resolution);
    float sides = max(floor(u_params[0]), 3.0);
    float roundFactor = u_params[2] / 100.0;
    float pointiness = (u_params[1] / 100.0) * (1.0 - roundFactor) * 0.99;
    float feather = u_params[3] / 100.0;
    float blend = u_params[4] / 100.0;

    float pi = 3.14159265359;
    float tau = 6.28318530718;

    float aps = pi / sides;
    float inr = 1.0 - roundFactor;
    float edge = inr * tan(aps);
    float stepA = 2.0 * aps;

    float nearTop  = round((tau * 0.25) / stepA) * stepA;
    float nearLeft = round(pi / stepA) * stepA;

    bool topIsEdge  = abs(nearTop  - tau * 0.25)    > 0.0001;
    bool leftIsEdge = abs(nearLeft - pi)            > 0.0001;

    float minX = leftIsEdge ? -1.0 / cos(aps) : -1.0;
    float topY = topIsEdge  
        ? max(sin(nearTop) / cos(aps), 1.0 / cos(nearTop - tau * 0.25))
        : 1.0;

    vec2 uv;
    uv.x = mix(minX, 1.0, tr.localUV.x); // rightmost extent of the shape is always x = 1.0
    uv.y = mix(-topY, topY, tr.localUV.y); // shape is vertically symmetric around y = 0
    float d = sdStar(uv, pointiness, aps, inr, edge) - roundFactor;

    vec4 src = texture(u_image, v_texCoord);
    float shape = smoothstep(-feather, 0.0, -d);
    float overlay = shape * blend;
    outColor = mix(src, vec4(1.0), overlay);
}
`;

export const BLACK_HOLE_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[4]; // [intensity, radius, centerX, centerY]
uniform vec2 u_resolution;
in vec2 v_texCoord;
out vec4 outColor;

void main() {
    float intensity = u_params[0] / 100.0;
    float radius    = u_params[1] / 100.0;
    float cx        = u_params[2] / 100.0;
    float cy        = u_params[3] / 100.0;

    vec2 center = vec2(cx, cy);
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);

    vec2 delta       = v_texCoord - center;
    vec2 deltaAspect = delta * aspect;

    float dist    = length(deltaAspect);
    float horizon = max(radius, 0.001);

    float t        = clamp(1.0 - dist / horizon, 0.0, 1.0);
    float strength = intensity * t * t * 10.0;

    // Pull toward center: expand delta
    vec2 warped = delta * (1.0 + strength);
    vec2 rawUV  = center + warped;

    vec2 mirroredUV = 1.0 - abs(2.0 * fract(rawUV * 0.5) - 1.0);
    outColor = textureLod(u_image, mirroredUV, 0.0);
}
`;

export const WHITE_HOLE_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[4]; // [intensity, radius, centerX, centerY]
uniform vec2 u_resolution;
in vec2 v_texCoord;
out vec4 outColor;

void main() {
    float intensity = u_params[0] / 100.0;
    float radius    = u_params[1] / 100.0;
    float cx        = u_params[2] / 100.0;
    float cy        = u_params[3] / 100.0;

    vec2 center = vec2(cx, cy);
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);

    vec2 delta       = v_texCoord - center;
    vec2 deltaAspect = delta * aspect;

    float dist    = length(deltaAspect);
    float horizon = max(radius, 0.001);

    float t        = clamp(1.0 - dist / horizon, 0.0, 1.0);
    float strength = intensity * t * t * 10.0;

    // Push away from center: shrink delta
    vec2 warped = delta * exp(-strength); // asymptotically approaches 0 to prevent inversion artifacts
    vec2 rawUV  = center + warped;

    vec2 mirroredUV = 1.0 - abs(2.0 * fract(rawUV * 0.5) - 1.0);
    outColor = textureLod(u_image, mirroredUV, 0.0);
}
`;


export const TILE_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[4]; // [scaleX, scaleY, panX, panY]
in vec2 v_texCoord;
out vec4 outColor;
${GLSL_TRANSFORM}

void main() {
    TR tr = getTransform_(v_texCoord, u_params[0], u_params[1], u_params[2], u_params[3]);
    vec2 uv = fract(tr.localUV);
    outColor = texture(u_image, uv);
}
`;

export const ORGANIC_NOISE_SHADER = `#version 300 es
precision highp float;

uniform sampler2D u_image;
uniform float u_params[5]; // [scale, complexity, warp, speed, blend]
uniform float u_integrated_values[8];
uniform float u_seed;

in vec2 v_texCoord;
out vec4 outColor;

#define MAX_OCTAVES 6

// Simplex 2D noise
vec3 permute(vec3 x) {
    return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v){
    const vec4 C = vec4(
        0.211324865405187,
        0.366025403784439,
        -0.577350269189626,
        0.024390243902439
    );

    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);

    vec2 i1 = (x0.x > x0.y)
        ? vec2(1.0, 0.0)
        : vec2(0.0, 1.0);

    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;

    i = mod(i, 289.0);
    vec3 p = permute(
        permute(i.y + vec3(0.0, i1.y, 1.0))
        + i.x + vec3(0.0, i1.x, 1.0)
    );

    vec3 m = max(0.5 - vec3(
        dot(x0, x0),
        dot(x12.xy, x12.xy),
        dot(x12.zw, x12.zw)
    ), 0.0);

    m *= m;
    m *= m;

    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 a0 = x - floor(x + 0.5);

    float g0 = a0.x * x0.x + h.x * x0.y;
    vec2 g12 = a0.yz * x12.xz + h.yz * x12.yw;

    return 130.0 * dot(m, vec3(g0, g12));
}

// Fully unrolled, branchless FBM
float fbm(vec2 p, float octaves) {
    // Precompute amplitudes
    float a0 = 0.5;
    float a1 = 0.25;
    float a2 = 0.125;
    float a3 = 0.0625;
    float a4 = 0.03125;
    float a5 = 0.015625;

    // Sum of amplitudes
    float totalAmp = a0 + a1 + a2 + a3 + a4 + a5;

    // Octave fractional weights (clamped 0–1)
    float w0 = clamp(octaves - 0.0, 0.0, 1.0);
    float w1 = clamp(octaves - 1.0, 0.0, 1.0);
    float w2 = clamp(octaves - 2.0, 0.0, 1.0);
    float w3 = clamp(octaves - 3.0, 0.0, 1.0);
    float w4 = clamp(octaves - 4.0, 0.0, 1.0);
    float w5 = clamp(octaves - 5.0, 0.0, 1.0);

    // Compute each octave with scaling
    float n0 = w0 * a0 * snoise(p);
    float n1 = w1 * a1 * snoise(p * 2.0);
    float n2 = w2 * a2 * snoise(p * 4.0);
    float n3 = w3 * a3 * snoise(p * 8.0);
    float n4 = w4 * a4 * snoise(p * 16.0);
    float n5 = w5 * a5 * snoise(p * 32.0);

    float value = n0 + n1 + n2 + n3 + n4 + n5;

    return value / totalAmp; // normalized 0–1
}

void main() {
    // ---- Parameter mapping ----
    float scale = mix(1.0, 20.0, u_params[0] * 0.01);
    float complexity = mix(1.0, float(MAX_OCTAVES), u_params[1] * 0.01);
    float warp = u_params[2] * 0.08;
    float speed = u_params[3] * 0.1;
    float blend = u_params[4] * 0.01;

    // Use seed to offset noise coordinates
    vec2 seedOffset = vec2(fract(u_seed * 0.123), fract(u_seed * 0.456)) * 10.0;
    vec2 uv = v_texCoord * scale + seedOffset;
    float t = u_integrated_values[3] * speed;

    // ---- Domain warp (2 noise calls) ----
    vec2 warpVec = vec2(
        snoise(uv + t * 0.5),
        snoise(uv + vec2(5.2, 1.3) + t * 0.5)
    );

    vec2 warpedUV = uv + warp * warpVec * scale;

    // ---- Main FBM ----
    float noiseVal = fbm(warpedUV, complexity);

    // Apply contrast and clamp
    noiseVal = clamp(noiseVal * 0.5 + 0.5, 0.0, 1.0);

    vec4 src = texture(u_image, v_texCoord);

    // Premultiplied Mix
    vec3 mixedRGB = mix(src.rgb, vec3(noiseVal), blend);
    float mixedAlpha = mix(src.a, 1.0, blend);
    outColor = vec4(mixedRGB, mixedAlpha);
}
`;

export const LUMINANCE_MASK_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[3]; // [threshold, feather, invert]
uniform vec2 u_resolution;
in vec2 v_texCoord;
out vec4 outColor;

void main() {
    float threshold = u_params[0] / 100.0;
    float feather = max(u_params[1] / 100.0, 0.001);
    float invert = u_params[2] / 100.0;

    vec4 src = texture(u_image, v_texCoord);
    float luma = dot(src.rgb, vec3(0.299, 0.587, 0.114));

    float mask = smoothstep(threshold - feather, threshold + feather, luma);
    mask = mix(mask, 1.0 - mask, invert);

    outColor = src * mask;
}
`;

export const LUMINANCE_MAP_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[4]; // [threshold, feather, target, blend]
uniform vec2 u_resolution;
in vec2 v_texCoord;
out vec4 outColor;

void main() {
    float threshold = (100.0 - u_params[0]) / 100.0;
    float feather = max(u_params[1] / 100.0, 0.001);
    float targetValue = u_params[2] / 100.0;
    float blend = u_params[3] / 100.0;

    vec4 src = texture(u_image, v_texCoord);
    float luma = dot(src.rgb, vec3(0.299, 0.587, 0.114));

    // Identify the shapes based on brightness
    float mask = smoothstep(threshold - feather, threshold + feather, luma);

    // Replace the bright pixels with our target gray value (premultiplied by alpha)
    vec3 targetGray = vec3(targetValue) * src.a;
    vec3 finalRGB = mix(src.rgb, targetGray, mask * blend);

    outColor = vec4(finalRGB, src.a);
}
`;

export const CELLULAR_NOISE_SHADER = `#version 300 es
precision highp float;

uniform sampler2D u_image;
uniform float u_params[8]; // [cell width, cell height, x-freq, y-freq, density, jitter, speed, blend]
uniform float u_integrated_values[8];
uniform float u_seed;
uniform vec2 u_resolution;

in vec2 v_texCoord;
out vec4 outColor;

${GLSL_HASH}

// Bhaskara I's sine approximation — branchless, continuous, max error 0.166%.
// Avoids native transcendental sin/cos by using a rational parabolic function.
// Works correctly over the full range with zero discontinuities at period boundaries.
float fastSin(float x) {
    x = fract(x * 0.15915);             // Normalize to one full period [0, 1)
    float sign = step(0.5, x) * -2.0 + 1.0; // +1 for first half, -1 for second
    x = fract(x * 2.0);                // Fold each half to [0, 1)
    float k = 4.0 * x * (1.0 - x);    // Parabola with peak 1.0
    return sign * k / (1.25 - 0.25 * k); // Bhaskara rational curve
}

void main() {
    // 1. Map parameters
    float xFreq = u_params[2] / 100.0;
    float yFreq = u_params[3] / 100.0;
    float cellWidth = u_params[0] / 100.0 * 2.0;  // [0, 2]: allows overlapping dots
    float cellHeight = u_params[1] / 100.0 * 2.0; // (requires 5x5 search when > 1)
    float probDensity = u_params[4] / 100.0;
    float jitter = u_params[5] / 100.0;
    float speed = u_params[6] / 100.0 * 50.0;
    float blend = u_params[7] / 100.0;

    // 2. Exponential frequency (consistent across resolutions using 1024px reference)
    vec2 freq = vec2(
        round(exp2(xFreq * log2(1024.0))),
        round(exp2(yFreq * log2(1024.0)))
    );

    float t = u_integrated_values[6] * speed * 0.5;
    vec2 cellCoord = v_texCoord * freq;
    vec2 gv = floor(cellCoord);
    vec2 fv = fract(cellCoord);

    float f1 = 8.0;

    vec2 cellScaling = 1.0 / max(vec2(cellWidth, cellHeight), 0.01);

    // 5x5 Branchless Worley Search
    float probMask = step(0.001, probDensity); // Handle 0 density edge case

    for (int y = -2; y <= 2; y++) {
        for (int x = -2; x <= 2; x++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 cell = gv + neighbor;

            // 2D hash — must use both x and y to avoid grid aliasing
            float baseHash = hash(cell, u_seed);

            // Density Probability Mask: points only exist if hash <= density. 
            // If they don't exist, we push them far away so they never win.
            float exists = step(baseHash, probDensity) + step(0.99, probDensity);
            float distBias = (1.0 - clamp(exists, 0.0, 1.0)) * 100.0;

            vec2 seed = vec2(baseHash, fract(baseHash * 43758.5453123));

            // Morphic Jitter (Bhaskara Sine)
            vec2 wiggle = 0.5 + 0.5 * vec2(
                fastSin(t + seed.x * 6.2831),
                fastSin(t * 0.8 + seed.y * 6.2831 + 1.5708)
            );
            vec2 offset = mix(vec2(0.5), wiggle, jitter);
            vec2 diff = neighbor + offset - fv;

            // Apply cell geometry scaling (stretching/spacing)
            // No longer resolution dependent because freq is grounded
            vec2 scaledDiff = diff * cellScaling;
            
            float dist = dot(scaledDiff, scaledDiff);
            f1 = min(f1, dist + distBias);
        }
    }

    f1 = sqrt(f1);
    float intensity = smoothstep(1.0, 0.0, f1) * probMask;

    vec4 src = texture(u_image, v_texCoord);
    float alpha = blend * step(0.001, probDensity);

    // Premultiplied Mix
    vec3 finalRGB = mix(src.rgb, vec3(intensity), alpha);
    float finalAlpha = mix(src.a, 1.0, alpha);
    outColor = vec4(finalRGB, finalAlpha);
}
`;

export const EDGE_MASK_SHADER = `#version 300 es
precision highp float;

uniform sampler2D u_image;    // Input: normalized grayscale or RGB
uniform float u_params[3];    // [sensitivity, thickness, invert]
uniform vec2 u_resolution;
uniform float u_unit;

in vec2 v_texCoord;
out vec4 outColor;

void main() {
    // Map parameters
    float sensitivity = max(u_params[0] / 100.0, 0.01);       // 0 = weak, 1 = strong
    float thickness = mix(0.05, 3.0, u_params[1] / 100.0);
    float invert = u_params[2] / 100.0;

    // Scale thickness by u_unit so edges are visually identical across all resolutions
    vec2 texel = (thickness * u_unit) / u_resolution;
    vec3 luma = vec3(0.299, 0.587, 0.114);

    // Sample 8-neighbor luminance
    float c = dot(texture(u_image, v_texCoord).rgb, luma);
    float l = dot(texture(u_image, v_texCoord + vec2(-texel.x, 0.0)).rgb, luma);
    float r = dot(texture(u_image, v_texCoord + vec2(texel.x, 0.0)).rgb, luma);
    float t = dot(texture(u_image, v_texCoord + vec2(0.0, texel.y)).rgb, luma);
    float b = dot(texture(u_image, v_texCoord + vec2(0.0, -texel.y)).rgb, luma);
    float tl = dot(texture(u_image, v_texCoord + vec2(-texel.x, texel.y)).rgb, luma);
    float tr = dot(texture(u_image, v_texCoord + vec2(texel.x, texel.y)).rgb, luma);
    float bl = dot(texture(u_image, v_texCoord + vec2(-texel.x, -texel.y)).rgb, luma);
    float br = dot(texture(u_image, v_texCoord + vec2(texel.x, -texel.y)).rgb, luma);

    // Standard Laplacian
    float laplacian = 8.0 * c - (l + r + t + b + tl + tr + bl + br);

    // Normalize Laplacian to roughly 0–1
    float lapNorm = abs(laplacian) / 8.0;

    // Apply sensitivity linearly
    float mask = smoothstep(0.0, sensitivity, lapNorm);

    // Inversion
    mask = mix(mask, 1.0 - mask, invert);

    // Apply mask to the original image
    vec4 src = texture(u_image, v_texCoord);
    outColor = src * mask;
}`;

export const GRID_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[9]; // [horizontal, vertical, thickness, feather, scaleX, scaleY, panX, panY, rotation]
uniform vec2 u_resolution;
uniform float u_unit;
in vec2 v_texCoord;
out vec4 outColor;
${GLSL_TRANSFORM}

void main() {
    TR tr = getTransform_(v_texCoord, u_params[4], u_params[5], u_params[6], u_params[7], u_params[8], u_resolution);

    // 1. Map sliders to frequency and parameters.
    float normX = u_params[0] / 100.0;
    float normY = u_params[1] / 100.0;
    float thickness = u_params[2] / 100.0;
    float feather = u_params[3] / 100.0 * 5.0;

    // Exponential frequency: freq=1 at 1%, doubling from there.
    // Fixed reference (1024) ensures the grid look won't change as you resize the window/export.
    vec2 freq = vec2(
        round(exp2(normX * log2(1024.0))),
        round(exp2(normY * log2(1024.0)))
    );

    // 2. Sample background image.
    vec4 src = texture(u_image, v_texCoord);

    // 3. Simple integer projection.
    vec2 uv = tr.localUV * freq;

    // Calculate Grid Mask with Anti-Aliasing & Feathering.
    // Scale widths by u_unit for resolution independence. 
    // Since pWidth (fwidth) scales inversely with resolution, the result is consistent.
    float targetPixelWidth = mix(0.1, 20.0, thickness) * u_unit;
    float featherPixels = mix(0.05, 5.0, feather) * u_unit; 
    
    vec2 pWidth = fwidth(uv);
    vec2 thickUV = pWidth * targetPixelWidth;
    vec2 featherUV = pWidth * featherPixels;

    // Centered transition: line spans from (thickness - feather) to (thickness + feather)
    vec2 outer = (thickUV + featherUV) * 0.5;
    vec2 inner = max(thickUV - featherUV, 0.0) * 0.5;

    vec2 dist = abs(fract(uv - 0.5) - 0.5);
    vec2 grid = smoothstep(outer, inner, dist);

    // Suppress border artifact when a slider is at 0%.
    grid.x *= step(0.001, normX);
    grid.y *= step(0.001, normY);

    float mask = max(grid.x, grid.y);

    float factor = mask * tr.mask;

    // 5. Output Final Color (Premultiplied Mix)
    vec3 finalRGB = mix(src.rgb, vec3(1.0), factor);
    float finalAlpha = mix(src.a, 1.0, factor);
    outColor = vec4(finalRGB, finalAlpha);
}
`;

export const SCROLL_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[6]; // [Left, Right, Up, Down, Ghost X, Ghost Y]
uniform float u_integrated_values[8];
in vec2 v_texCoord;
out vec4 outColor;

void main() {
    // Use independent clocks for each direction
    float left = (u_params[0] / 100.0) * u_integrated_values[0];
    float right = (u_params[1] / 100.0) * u_integrated_values[1];
    float up = (u_params[2] / 100.0) * u_integrated_values[2];
    float down = (u_params[3] / 100.0) * u_integrated_values[3];

    float ghostX = 1.0 - (u_params[4] / 100.0);
    float ghostY = 1.0 - (u_params[5] / 100.0);
    
    vec2 scroll = vec2(right - left, up - down) * 2.0;

    // Primary and secondary coordinates offset by half the screen
    vec2 coord1 = fract(v_texCoord - scroll); // Original image
    vec2 coord2 = fract(v_texCoord - scroll + 0.5); // Ghost image
    
    // Determine blend weights based on distance to the seam (0.0 or 1.0)
    float wx = (ghostX < 1.0) ? smoothstep(ghostX, 1.0, abs(coord1.x - 0.5) * 2.0) : 0.0;
    float wy = (ghostY < 1.0) ? smoothstep(ghostY, 1.0, abs(coord1.y - 0.5) * 2.0) : 0.0;

    // Sample 4 points to handle simultaneous X and Y wrapping
    vec4 c1 = texture(u_image, coord1); // Original
    vec4 c2 = texture(u_image, vec2(coord2.x, coord1.y)); // Left/right ghosts
    vec4 c3 = texture(u_image, vec2(coord1.x, coord2.y)); // Top/bottom ghosts
    vec4 c4 = texture(u_image, coord2); // Diagonal ghosts

    // Bilinearly blend the 4 samples based on our seam weights
    outColor = mix(mix(c1, c2, wx), mix(c3, c4, wx), wy);
}
`;

export const TRANSFORM_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[5]; // [Scale X, Scale Y, Pan X, Pan Y, Rotation]
uniform vec2 u_resolution;
in vec2 v_texCoord;
out vec4 outColor;
${GLSL_TRANSFORM}

void main() {
    TR tr = getTransform_(v_texCoord, u_params[0], u_params[1], u_params[2], u_params[3], u_params[4], u_resolution);
    vec4 src = texture(u_image, tr.localUV);
    outColor = mix(vec4(0.0), src, tr.mask);
}
`;

export const CHECKERBOARD_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[7]; // [freqX, freqY, scaleX, scaleY, panX, panY, rotation]
uniform vec2 u_resolution;
in vec2 v_texCoord;
out vec4 outColor;
${GLSL_TRANSFORM}

void main() {
    TR tr = getTransform_(v_texCoord, u_params[2], u_params[3], u_params[4], u_params[5], u_params[6], u_resolution);

    vec4 src = texture(u_image, v_texCoord);

    vec2 grid = floor(tr.localUV * max(vec2(1.0), vec2(u_params[0], u_params[1])));
    
    // Calculate the grid value [0.0 or 1.0]
    float val = mod(grid.x + grid.y, 2.0);

    // Premultiplied Mix
    float factor = val * tr.mask;
    vec3 finalRGB = mix(src.rgb, vec3(1.0), factor);
    float finalAlpha = mix(src.a, 1.0, factor);
    outColor = vec4(finalRGB, finalAlpha);
}
`;

export const RGBA_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[4]; // [r, g, b, a]
in vec2 v_texCoord;
out vec4 outColor;

void main() {
    vec4 color = texture(u_image, v_texCoord);

    float r = u_params[0] / 100.0;
    float g = u_params[1] / 100.0;
    float b = u_params[2] / 100.0;
    float a = u_params[3] / 100.0;

    // Apply sliders to the current color. Since the input is already 
    // premultiplied, we only scale by the *new* alpha value.
    outColor = vec4(color.rgb * vec3(r, g, b) * a, color.a * a);
}
`;

export const LINEAR_GRADIENT_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[3]; // [feather, rotation, pan]
in vec2 v_texCoord;
out vec4 outColor;

void main() {
    float feather = u_params[0] / 100.0;
    float rotation = u_params[1] / 100.0 * 6.28318;
    float pan = 1.0 - (u_params[2] / 100.0) - 0.5;

    vec2 uv = v_texCoord - 0.5;
    mat2 rot = mat2(cos(rotation), -sin(rotation), sin(rotation), cos(rotation));
    vec2 rotatedUV = rot * uv;

    float g = rotatedUV.x + pan;

    float halfWidth = max(feather * 0.5, 0.00001);
    float alpha = smoothstep(-halfWidth, halfWidth, g);

    vec4 src = texture(u_image, v_texCoord);

    vec3 mixedRGB = mix(src.rgb, vec3(1.0), alpha);
    float mixedAlpha  = mix(src.a, 1.0, alpha);
    outColor = vec4(mixedRGB, mixedAlpha);
}
`;

export const RADIAL_GRADIENT_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[5]; // [feather, frequency, speed, panX, panY]
uniform float u_integrated_values[8];
uniform vec2 u_resolution;
in vec2 v_texCoord;
out vec4 outColor;

void main() {
    float feather = max(u_params[0] / 100.0 * 10.0, 0.0001);
    float frequency = u_params[1] / 10.0;
    float speed = u_params[2] / 100.0 * 30.0;
    vec2 pan = vec2(u_params[3] / 100.0, u_params[4] / 100.0);

    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = v_texCoord - pan;
    uv.x *= aspect;

    float d = length(uv);
    
    // Wave phase using integrated speed
    float phase = u_integrated_values[2] * speed;
    
    // Calculate ripple wave using sine
    float wave = sin(d * frequency * 6.28318 - phase);
    
    // Normalize wave [-1, 1] to [0, 1] and apply feathering
    float halfFeather = feather * 0.5;
    float alpha = smoothstep(-halfFeather, halfFeather, wave);

    vec4 src = texture(u_image, v_texCoord);
    
    // Premultiplied Mix
    vec3 finalRGB = mix(src.rgb, vec3(1.0), alpha);
    float finalAlpha = mix(src.a, 1.0, alpha);
    outColor = vec4(finalRGB, finalAlpha);
}
`;

// 7-tap separable Gaussian blur (sigma = 1.5).
// Weights: center=0.2707, ±1=0.2168, ±2=0.1113, ±3=0.0366 (sum = 1.0)
export const GAUSSIAN_BLUR_H_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[2]; // [intensity, blend]
in vec2 v_texCoord;
out vec4 outColor;

void main() {
    float step  = u_params[0];
    float blend = u_params[1];

    vec4 center = texture(u_image, v_texCoord);

    // Gaussian-weighted horizontal accumulation (sigma = 1.5)
    vec4 sum = center * 0.2707;
    sum += (texture(u_image, v_texCoord + vec2(step,        0.0)) +
            texture(u_image, v_texCoord - vec2(step,        0.0))) * 0.2168;
    sum += (texture(u_image, v_texCoord + vec2(2.0 * step,  0.0)) +
            texture(u_image, v_texCoord - vec2(2.0 * step,  0.0))) * 0.1113;
    sum += (texture(u_image, v_texCoord + vec2(3.0 * step,  0.0)) +
            texture(u_image, v_texCoord - vec2(3.0 * step,  0.0))) * 0.0366;

    outColor = mix(center, sum, blend);
}
`;

export const GAUSSIAN_BLUR_V_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[2]; // [intensity, blend]
in vec2 v_texCoord;
out vec4 outColor;

void main() {
    float step  = u_params[0];
    float blend = u_params[1];

    vec4 center = texture(u_image, v_texCoord);

    // Gaussian-weighted vertical accumulation (sigma = 1.5)
    vec4 sum = center * 0.2707;
    sum += (texture(u_image, v_texCoord + vec2(0.0, step       )) +
            texture(u_image, v_texCoord - vec2(0.0, step       ))) * 0.2168;
    sum += (texture(u_image, v_texCoord + vec2(0.0, 2.0 * step)) +
            texture(u_image, v_texCoord - vec2(0.0, 2.0 * step))) * 0.1113;
    sum += (texture(u_image, v_texCoord + vec2(0.0, 3.0 * step)) +
            texture(u_image, v_texCoord - vec2(0.0, 3.0 * step))) * 0.0366;

    outColor = mix(center, sum, blend);
}
`;

export interface ShaderDefinition {
    name: string;
    fragmentSource: string;
    velocityParamIndices?: number[]; // Indices of parameters that control speed/velocity
    is3D?: boolean;
}

export const SHADER_REGISTRY: Record<string, ShaderDefinition> = {
    CHANNEL_SHIFT: { name: 'CHANNEL_SHIFT', fragmentSource: CHANNEL_SHIFT_SHADER },
    BIT_CRUSH: { name: 'BIT_CRUSH', fragmentSource: BIT_CRUSH_SHADER },
    DEEP_FRY: { name: 'DEEP_FRY', fragmentSource: DEEP_FRY_SHADER },
    WAVE_DISTORTION: { name: 'WAVE_DISTORTION', fragmentSource: WAVE_DISTORTION_SHADER, velocityParamIndices: [2] },
    HUE_ROTATION: { name: 'HUE_ROTATION', fragmentSource: HUE_ROTATION_SHADER, velocityParamIndices: [1] },
    INVERT: { name: 'INVERT', fragmentSource: INVERT_SHADER },
    PIXEL_SORT: { name: 'PIXEL_SORT', fragmentSource: PIXEL_SORT_SHADER },
    DATA_CORRUPTION: { name: 'DATA_CORRUPTION', fragmentSource: DATA_CORRUPTION_SHADER },
    COLOR_BLEED: { name: 'COLOR_BLEED', fragmentSource: COLOR_BLEED_SHADER },
    COMPRESSION_HELL: { name: 'COMPRESSION_HELL', fragmentSource: COMPRESSION_HELL_SHADER },
    SCREEN_SHAKE: { name: 'SCREEN_SHAKE', fragmentSource: SCREEN_SHAKE_SHADER, velocityParamIndices: [1] },
    STARFIELD: { name: 'STARFIELD', fragmentSource: STARFIELD_SHADER, velocityParamIndices: [1] },
    TUNNEL_WARP: { name: 'TUNNEL_WARP', fragmentSource: TUNNEL_WARP_SHADER, velocityParamIndices: [1] },
    GRAIN: { name: 'GRAIN', fragmentSource: GRAIN_SHADER },
    SHAPE: { name: 'SHAPE', fragmentSource: SHAPE_SHADER },
    ROTATE: { name: 'ROTATE', fragmentSource: ROTATE_SHADER, velocityParamIndices: [1] },
    SKEW: { name: 'SKEW', fragmentSource: SKEW_SHADER },
    TILE: { name: 'TILE', fragmentSource: TILE_SHADER },
    ORGANIC_NOISE: { name: 'ORGANIC_NOISE', fragmentSource: ORGANIC_NOISE_SHADER, velocityParamIndices: [3] },
    CELLULAR_NOISE: { name: 'CELLULAR_NOISE', fragmentSource: CELLULAR_NOISE_SHADER, velocityParamIndices: [6] },
    LUMINANCE_MASK: { name: 'LUMINANCE_MASK', fragmentSource: LUMINANCE_MASK_SHADER },
    EDGE_MASK: { name: 'EDGE_MASK', fragmentSource: EDGE_MASK_SHADER },
    BLACK_HOLE: { name: 'BLACK_HOLE', fragmentSource: BLACK_HOLE_SHADER },
    WHITE_HOLE: { name: 'WHITE_HOLE', fragmentSource: WHITE_HOLE_SHADER },
    GRID: { name: 'GRID', fragmentSource: GRID_SHADER },
    SPECTRAL_MAP: { name: 'SPECTRAL_MAP', fragmentSource: SPECTRAL_MAP_SHADER, velocityParamIndices: [2] },
    SCROLL: { name: 'SCROLL', fragmentSource: SCROLL_SHADER, velocityParamIndices: [0, 1, 2, 3] },
    LUMINANCE_MAP: { name: 'LUMINANCE_MAP', fragmentSource: LUMINANCE_MAP_SHADER },
    TERRAIN: { name: 'TERRAIN', fragmentSource: '', velocityParamIndices: [2], is3D: true },
    TERRAIN_SPHERE: { name: 'TERRAIN_SPHERE', fragmentSource: '', velocityParamIndices: [6, 7, 8], is3D: true },
    TRANSFORM: { name: 'TRANSFORM', fragmentSource: TRANSFORM_SHADER },
    CHECKERBOARD: { name: 'CHECKERBOARD', fragmentSource: CHECKERBOARD_SHADER },
    RGBA: { name: 'RGBA', fragmentSource: RGBA_SHADER },
    LINEAR_GRADIENT: { name: 'LINEAR_GRADIENT', fragmentSource: LINEAR_GRADIENT_SHADER },
    RADIAL_GRADIENT: { name: 'RADIAL_GRADIENT', fragmentSource: RADIAL_GRADIENT_SHADER, velocityParamIndices: [2] },
    INFINITE_ZOOM: { name: 'INFINITE_ZOOM', fragmentSource: '', velocityParamIndices: [0], is3D: true },
    BLUR: { name: 'BLUR', fragmentSource: '', is3D: true },
    GAUSSIAN_BLUR_H: { name: 'GAUSSIAN_BLUR_H', fragmentSource: GAUSSIAN_BLUR_H_SHADER },
    GAUSSIAN_BLUR_V: { name: 'GAUSSIAN_BLUR_V', fragmentSource: GAUSSIAN_BLUR_V_SHADER },
};
