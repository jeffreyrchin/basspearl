export interface ShaderDefinition {
    name: string;
    fragmentSource: string;
    velocityParamIndex?: number;
}

export const CHANNEL_SHIFT_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[2]; // [shiftX, shiftY]
uniform float u_unit;
uniform vec2 u_resolution;
in vec2 v_texCoord;
out vec4 outColor;

// Branchless (no if/else) sampling that returns transparent black outside 0..1 range (eliminates streaks)
vec4 sampleTexture(sampler2D tex, vec2 uv) {
    // Returns 1.0 if inside [0, 1], 0.0 if outside
    vec2 inside = step(vec2(0.0), uv) * step(uv, vec2(1.0));
    float isVisible = inside.x * inside.y;
    return texture(tex, uv) * isVisible;
}

void main() {
    vec2 pixelSize = 1.0 / u_resolution;
    
    // Target: Max ~100px (10 units).
    // int=100 -> 10 * u_unit.
    // factor = 0.1.
    
    float shiftX = u_params[0] * 0.1 * u_unit * pixelSize.x;
    float shiftY = u_params[1] * 0.1 * u_unit * pixelSize.y;
    
    vec4 color = sampleTexture(u_image, v_texCoord);
    float r = sampleTexture(u_image, v_texCoord - vec2(shiftX, shiftY)).r;
    float b = sampleTexture(u_image, v_texCoord + vec2(shiftX, shiftY)).b;
    
    outColor = vec4(r, color.g, b, color.a);
}
`;

export const BIT_CRUSH_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[2]; // [quantize, resample]
uniform float u_unit;
uniform vec2 u_resolution;
in vec2 v_texCoord;
out vec4 outColor;

void main() {
    float qFactor = floor(pow(u_params[0] / 10.0, 2.2)) + 1.0;
    float rFactor = max(1.0, floor((u_params[1] * 0.1) * u_unit));
    
    vec2 res = u_resolution;
    vec2 gridCoord = floor(v_texCoord * res / rFactor) * rFactor / res;
    
    vec4 color = texture(u_image, gridCoord);
    
    if (qFactor > 1.0) {
        color.rgb = floor(color.rgb * 255.0 / qFactor) * qFactor / 255.0;
    }
    
    outColor = color;
}
`;

export const SCAN_LINES_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[2]; // [opacity, line spacing]
uniform float u_unit;
uniform vec2 u_resolution;
in vec2 v_texCoord;
out vec4 outColor;

void main() {
    float opacity = u_params[0] / 100.0;
    float spacing = max(2.0, floor(2.0 + (u_params[1] * 0.1 * u_unit)));
    
    vec4 color = texture(u_image, v_texCoord);
    
    float y = v_texCoord.y * u_resolution.y;
    if (mod(floor(y), spacing) == 0.0) {
        color.r *= (1.0 - opacity);
        color.g *= (1.0 - (opacity * 0.8));
        color.b *= (1.0 - (opacity * 0.9));
    }
    
    outColor = color;
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
uniform float u_integrated_value;
uniform vec2 u_resolution;
in vec2 v_texCoord;
out vec4 outColor;

void main() {
    if (u_params[0] == 0.0) {
        outColor = texture(u_image, v_texCoord);
        return;
    }
    
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
    
    // We use u_integrated_value for the phase to ensure smooth, non-jittery motion.
    float startPhase = u_integrated_value * speed;

    // We use a centered Y coordinate to anchor the wave distortion to the middle
    // of the screen. This ensures that frequency-synced jitter is distributed
    // symmetrically (expanding from center) rather than accumulating at the bottom.
    float centeredY = v_texCoord.y - 0.5;
    float angle = centeredY * 3.14159 * 2.0 * waves + startPhase;
    
    float xOffset = sin(angle) * amp;
    xOffset += cos(angle * 2.0 - startPhase * 0.5) * (amp * 0.2);
    
    vec2 coord = vec2(v_texCoord.x + xOffset, v_texCoord.y);
    if (coord.x >= 0.0 && coord.x <= 1.0) {
        outColor = texture(u_image, coord);
    } else {
        outColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
}
`;

export const HUE_ROTATION_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[2]; // [hue, saturation/vibrance]
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
    
    hsv.x = fract(hsv.x + u_params[0] / 100.0);
    hsv.y = min(1.0, hsv.y * (1.0 + (u_params[1] / 100.0) * 2.0));
    
    outColor = vec4(hsv2rgb(hsv), color.a);
}
`;

export const INVERT_GHOST_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[1]; // [inversion]
in vec2 v_texCoord;
out vec4 outColor;

void main() {
    vec4 color = texture(u_image, v_texCoord);
    float opacity = u_params[0] / 100.0;
    vec3 inverted = 1.0 - color.rgb;
    outColor = vec4(mix(color.rgb, inverted, opacity), color.a);
}
`;

export const ANALOG_NOISE_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[2]; // [gain, grayscale]
uniform float u_seed;
uniform vec2 u_resolution; 
in vec2 v_texCoord;
out vec4 outColor;

// Robust Integer Hash for pixel-perfect noise
float hash(vec2 col, float seed) {
    uvec3 p = uvec3(uvec2(col), uint(seed * 12345.0));
    p = p * 0x74779649u + (p >> 1u);
    p.x *= p.y * p.z;
    p.y *= p.x * p.z;
    p.z *= p.x * p.y;
    return float(p.x ^ p.y ^ p.z) * (1.0 / 4294967295.0);
}

void main() {
    vec4 color = texture(u_image, v_texCoord);
    
    if (u_params[0] <= 0.0) {
        outColor = color;
        return;
    }

    float amount = u_params[0] / 100.0;
    float monoThreshold = u_params[1] / 100.0;
    vec2 pixelPos = floor(v_texCoord * u_resolution); // Floor ensures we snap to pixels
    
    // Random value for this pixel
    float pixelRand = hash(pixelPos, u_seed);
    
    bool isMono = pixelRand < monoThreshold;
    
    if (isMono) {
        float r = hash(pixelPos, u_seed + 1.1);
        float noise = (r - 0.5) * amount;
        color.rgb = clamp(color.rgb + noise, 0.0, 1.0);
    } else {
        float r1 = hash(pixelPos, u_seed + 1.2);
        float r2 = hash(pixelPos, u_seed + 1.3);
        float r3 = hash(pixelPos, u_seed + 1.4);
        
        color.r = clamp(color.r + (r1 - 0.5) * amount, 0.0, 1.0);
        color.g = clamp(color.g + (r2 - 0.5) * amount, 0.0, 1.0);
        color.b = clamp(color.b + (r3 - 0.5) * amount, 0.0, 1.0);
    }

    outColor = color;
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
    
    vec2 res = u_resolution;
    vec2 pixelSize = 1.0 / res;
    
    // Sort approximation: if brightness > threshold, look upwards for a dark pixel to "pull" from
    vec4 color = texture(u_image, v_texCoord);
    float brightness = (color.r + color.g + color.b) / 3.0;
    
    float colSeed = (rand(vec2(floor(v_texCoord.x * res.x), u_seed))) * 12345.0;
    float colRand = fract(sin(colSeed) * 10000.0);
    
    if (colRand > triggerProb || brightness < threshold) {
        outColor = color;
        return;
    }

    // Pull brightness from above
    // Max loop 600 ensures performance. 
    // We map 100% intensity to 600 pixels length.
    float maxPixels = 600.0;
    float sortLength = (u_params[0] / 100.0) * maxPixels * pixelSize.y;
    
    vec2 pullCoord = v_texCoord;
    
    for(float i = 0.0; i < 600.0; i++) {
        // Stop if we exceed user intensity length
        if (i * pixelSize.y > sortLength) break;
        
        vec2 checkCoord = v_texCoord - vec2(0.0, i * pixelSize.y);
        if(checkCoord.y < 0.0) break;
        
        vec4 checkColor = texture(u_image, checkCoord);
        float checkBrightness = (checkColor.r + checkColor.g + checkColor.b) / 3.0;
        if(checkBrightness < threshold) {
            pullCoord = checkCoord;
            break;
        }
    }
    
    outColor = texture(u_image, pullCoord);
}
`;

export const DATA_CORRUPTION_SHADER = `#version 300 es
precision highp float;

uniform sampler2D u_image;
uniform float u_params[2]; // [mosh length, mosh density]
uniform vec2 u_resolution;

in vec2 v_texCoord;
out vec4 outColor;

void main() {
    float moshLength  = u_params[0] / 10.0;
    float moshDensity = u_params[1] / 100.0;

    float blockSize = 1.0; // smaller = more fine-grained
    vec2 pixelPos   = v_texCoord * u_resolution;
    vec2 blockId    = floor(pixelPos / blockSize);
    vec2 blockUV    = (blockId * blockSize) / u_resolution;

    vec4 src   = texture(u_image, blockUV);
    float luma = dot(src.rgb, vec3(0.299, 0.587, 0.114));

    if (luma < 1.0 - moshDensity) {
        outColor = src;
        return;
    }

    vec2 motion = (src.rg - 0.5) * moshLength * 64.0;
    vec2 disp   = floor(motion) * blockSize / u_resolution;

    outColor = texture(u_image, v_texCoord - disp);
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

void main() {
    vec2 pixelSize = 1.0 / u_resolution;
    
    // Target: Max bleed 100px (10 units).
    // int=100 -> 10 * u_unit.
    // factor = 0.1.
    
    float bleedAmount = (u_params[0] * 0.1 * u_unit) * pixelSize.x;
    float ghostShift = (u_params[1] * 0.1 * u_unit) * pixelSize.x;
    
    vec4 color = texture(u_image, v_texCoord);
    float r = texture(u_image, v_texCoord - vec2(bleedAmount, 0.0)).r;
    float b = texture(u_image, v_texCoord + vec2(bleedAmount, 0.0)).b;
    float g = color.g;
    
    if (ghostShift > 0.0) {
        g = (g + texture(u_image, v_texCoord - vec2(ghostShift, 0.0)).g) / 1.5;
    }
    
    outColor = vec4((color.r + r)/2.0, g, (color.b + b)/2.0, color.a);
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
    float blockSize = max(1.0, floor((0.1 + (u_params[0] * 0.2)) * u_unit));
    float factor = u_params[1] / 10.0;
    float q = 1.0 + factor * 4.0;
    
    vec2 res = u_resolution;
    vec2 blockCoord = floor(v_texCoord * res / blockSize) * blockSize / res;
    
    vec4 color = texture(u_image, blockCoord);
    color.rgb = floor(color.rgb * 255.0 / q) * q / 255.0;
    
    float freq = (1.0 / u_unit) * (1.0 + factor * 0.5);
    float ringing = cos(v_texCoord.x * v_texCoord.y * 1000.0 * freq) * (factor * 4.0 / 255.0);
    
    outColor = vec4(clamp(color.rgb + ringing, 0.0, 1.0), color.a);
}
`;

export const RANDOM_CHAOS_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[2]; // [entropy, jitter]
uniform float u_unit;
uniform float u_seed;
uniform vec2 u_resolution;
in vec2 v_texCoord;
out vec4 outColor;

// Robust Integer Hash (Triple32 or PCG style) for stability with large coordinates
float hash(vec2 col, float seed) {
    uvec3 p = uvec3(uvec2(col), uint(seed * 12345.0));
    p = p * 0x74779649u + (p >> 1u);
    p.x *= p.y * p.z;
    p.y *= p.x * p.z;
    p.z *= p.x * p.y;
    return float(p.x ^ p.y ^ p.z) * (1.0 / 4294967295.0);
}

void main() {
    float blockSize = max(1.0, floor((u_params[1] * 0.1) * u_unit));
    float probThreshold = 1.0 - pow(u_params[0] / 100.0, 0.5) * 0.5;
    
    vec2 pixelPos = v_texCoord * u_resolution;
    vec2 blockIndex = floor(pixelPos / blockSize);
    
    vec4 color = texture(u_image, v_texCoord);
    
    // Use blockIndex for randomness
    if (hash(blockIndex, u_seed) > probThreshold) {
        float chaos = hash(blockIndex, u_seed + 1.23);
        
        if (chaos < 0.3) {
            color.rgb = 1.0 - color.rgb;
        } else if (chaos < 0.6) {
            color.g = color.b;
        } else {
            color.b = 1.0;
        }
    }
    
    outColor = color;
}
`;

export const ZOOM_PAN_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[2]; // [zoom/scale, pan]
in vec2 v_texCoord;
out vec4 outColor;

void main() {
    float zoom = 1.0 + (u_params[0] / 100.0) * 0.5;
    vec2 center = vec2(0.5, 0.5);
    
    // Slight offset based on threshold (pan)
    vec2 offset = vec2(u_params[1] / 1000.0, sin(u_params[0] * 0.1) * 0.01);
    
    vec2 coord = (v_texCoord - center - offset) / zoom + center + offset;
    
    if (coord.x >= 0.0 && coord.x <= 1.0 && coord.y >= 0.0 && coord.y <= 1.0) {
        outColor = texture(u_image, coord);
    } else {
        outColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
}
`;

export const SCREEN_SHAKE_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[2]; // [displacement, speed]
uniform float u_integrated_value;
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
    float t = u_integrated_value * updateFreq;
    
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
        outColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
}
`;

export const STARFIELD_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[2]; // [density, speed]
uniform float u_integrated_value;
uniform vec2 u_resolution;
in vec2 v_texCoord;
out vec4 outColor;

float rand(vec2 co) {
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
    // Normalize parameters to 0..1
    float density = u_params[0] / 100.0;
    float speedScale = u_params[1] / 100.0; 
    
    // 'travel' represents our total displacement through the starfield.
    // It is driven by u_integrated_value, which is either:
    // 1. Time-integrated (Manual mode) for constant speed.
    // 2. Audio-integrated (Sync mode) for reactive acceleration.

    // Use a single "Aesthetic Multiplier" to get the speed you want
    // 4.0 means: at Speed 100, 4 laps per second.
    float travel = u_integrated_value * speedScale * 4.0;
    
    // Normalize UVs to center (0,0) and handle aspect ratio to prevent stretching.
    vec2 uv = (v_texCoord - 0.5) * u_resolution / u_resolution.y;
    vec3 color = vec3(0.0);
    
    // Render 3 parallax layers of stars at different depth offsets.
    for(float i=0.0; i<3.0; i++) {
        // z represents the fractional depth of the layer (0.0=Far/Center, 1.0=Near/Edges).
        // Using fract() creates a continuous loop as we travel forward.
        float z = fract(travel + i * 0.333); 
        
        // Stabilize the singular point at (0,0,0) with a softening offset.
        // This allows stars to appear very close to the center without math errors.
        float depth = z + 0.04; 
        
        vec2 layerUV = uv / depth;

        // Layer 0: 12.0 + (0 * 5.0) = 12.0 columns/rows
        // Layer 1: 12.0 + (1 * 5.0) = 17.0 columns/rows
        // Layer 2: 12.0 + (2 * 5.0) = 22.0 columns/rows
        float numGridCells = 12.0 + (i * 5.0);
        vec2 gridID = floor(layerUV * numGridCells);
        vec2 gridUV = fract(layerUV * numGridCells) - 0.5;

        float lap = floor(travel + i * 0.333); 
        float r = rand(gridID + i * 111.0 + lap);
        
        // Probability check for star existence based on density.
        if (r > (1.0 - (density * 0.25))) {
             float d = length(gridUV);
             
             // Smoothly bloom stars in at the center (z -> 0) and fade at the edges (z -> 1).
             float fade = smoothstep(0.0, 0.3, z) * smoothstep(1.0, 0.8, z);
             
             // Stable Exponential Glow: 
             // We use a lower "sharpness" (25 instead of 100) to avoid sub-pixel flickering.
             float star = exp(-d * 25.0) * 1.5; // Base glow/soft halo
             star += exp(-d * 50.0) * 1.5; // Hotspot/core
             
             color += vec3(star) * fade * r;
        }
    }
    
    vec4 src = texture(u_image, v_texCoord);
    float starAlpha = clamp(length(color) * 2.0, 0.0, 1.0);
    outColor = vec4(src.rgb + color, clamp(src.a + starAlpha, 0.0, 1.0));
}
`;

export const SHADER_REGISTRY: Record<string, ShaderDefinition> = {
    CHANNEL_SHIFT: { name: 'CHANNEL_SHIFT', fragmentSource: CHANNEL_SHIFT_SHADER },
    BIT_CRUSH: { name: 'BIT_CRUSH', fragmentSource: BIT_CRUSH_SHADER },
    SCAN_LINES: { name: 'SCAN_LINES', fragmentSource: SCAN_LINES_SHADER },
    DEEP_FRY: { name: 'DEEP_FRY', fragmentSource: DEEP_FRY_SHADER },
    WAVE_DISTORTION: { name: 'WAVE_DISTORTION', fragmentSource: WAVE_DISTORTION_SHADER, velocityParamIndex: 2 },
    HUE_ROTATION: { name: 'HUE_ROTATION', fragmentSource: HUE_ROTATION_SHADER },
    INVERT_GHOST: { name: 'INVERT_GHOST', fragmentSource: INVERT_GHOST_SHADER },
    ANALOG_NOISE: { name: 'ANALOG_NOISE', fragmentSource: ANALOG_NOISE_SHADER },
    PIXEL_SORT: { name: 'PIXEL_SORT', fragmentSource: PIXEL_SORT_SHADER },
    DATA_CORRUPTION: { name: 'DATA_CORRUPTION', fragmentSource: DATA_CORRUPTION_SHADER },
    COLOR_BLEED: { name: 'COLOR_BLEED', fragmentSource: COLOR_BLEED_SHADER },
    COMPRESSION_HELL: { name: 'COMPRESSION_HELL', fragmentSource: COMPRESSION_HELL_SHADER },
    RANDOM_CHAOS: { name: 'RANDOM_CHAOS', fragmentSource: RANDOM_CHAOS_SHADER },
    ZOOM_PAN: { name: 'ZOOM_PAN', fragmentSource: ZOOM_PAN_SHADER },
    SCREEN_SHAKE: { name: 'SCREEN_SHAKE', fragmentSource: SCREEN_SHAKE_SHADER, velocityParamIndex: 1 },
    STARFIELD: { name: 'STARFIELD', fragmentSource: STARFIELD_SHADER, velocityParamIndex: 1 },
};
