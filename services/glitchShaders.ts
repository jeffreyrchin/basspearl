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
    
    // We use u_integrated_value for the phase to ensure smooth, non-jittery motion.
    float startPhase = u_integrated_value * speed;
    
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
    float r = sampleTexture(u_image, v_texCoord - vec2(bleedAmount, 0.0)).r;
    float b = sampleTexture(u_image, v_texCoord + vec2(bleedAmount, 0.0)).b;
    float g = color.g;
    
    if (ghostShift > 0.0) {
        g = (g + sampleTexture(u_image, v_texCoord - vec2(ghostShift, 0.0)).g) / 1.5;
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

export const RETRO_GRID_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[2]; // [thickness, speed]
uniform float u_integrated_value;
uniform vec2 u_resolution;
in vec2 v_texCoord;
out vec4 outColor;

void main() {
    float thickness = u_params[0] / 100.0 * 0.1;
    float speed = u_params[1] / 100.0;
    float time = u_integrated_value * speed * 10.0;

    vec2 uv = (v_texCoord - 0.5) * u_resolution / u_resolution.y;
    
    // Perspective: Split into floor and ceiling
    float horizon = 0.0;
    float depth = 1.0 / (abs(uv.y - horizon) + 0.01);
    
    // Grid coordinates
    vec2 gridUV = vec2(uv.x * depth, depth + time);
    
    // Line calculation
    vec2 grid = abs(fract(gridUV - 0.5) - 0.5);
    float lines = smoothstep(thickness, 0.0, grid.x) + smoothstep(thickness * 2.0, 0.0, grid.y);
    
    // Fade out at the horizon and edges
    float fade = smoothstep(12.0, 3.0, depth) * smoothstep(0.0, 0.1, abs(uv.y));
    
    vec3 gridColor = vec3(1.0, 0.0, 1.0) * lines * fade;
    
    vec4 src = texture(u_image, v_texCoord);
    outColor = vec4(src.rgb + gridColor, clamp(src.a + (lines * fade), 0.0, 1.0));
}
`;

export const TUNNEL_WARP_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[3]; // [scale, speed, twist]
uniform float u_integrated_value;
uniform vec2 u_resolution;
in vec2 v_texCoord;
out vec4 outColor;
void main() {
    float scale = max(u_params[0] / 100.0 * 2.0, 0.01); // prevent scale from being 0 to prevent y-coordinates from disappearing (prevents single horizontal pixel-row from stretching vertically across canvas)
    float speed = u_params[1] / 100.0;
    float twist = u_params[2] / 100.0 * 5.0;
    float time  = u_integrated_value * speed * 3.0;
    
    vec2 uv = (v_texCoord - 0.5) * u_resolution / u_resolution.y;
    float r = length(uv);
    float a = atan(uv.y, uv.x);
    
    // Tunnel projection
    // x = angle, y = depth + motion
    vec2 warpedUV = vec2(
        a / 6.28318 + 0.5 + (1.0/max(r, 0.01)) * twist * 0.1, 
        1.0/max(r, 0.01) * scale + time
    );
    
    outColor = texture(u_image, fract(warpedUV));
}
`;

export const NOISE_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[3]; // [horizontal, vertical, density]
uniform vec2 u_resolution;
in vec2 v_texCoord;
out vec4 outColor;

float hash(vec2 p) { return clamp(fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453), 0.0, 1.0); }

void main() {
    // 1. Map sliders to frequency and parameters.
    float normX = u_params[0] / 100.0;
    float normY = u_params[1] / 100.0;
    float density = u_params[2] / 100.0;

    // Exponential frequency: freq=1 at 1% (one centered line), doubling from there.
    vec2 freq = vec2(
        round(exp2(normX * log2(u_resolution.x))),
        round(exp2(normY * log2(u_resolution.y)))
    );

    // 2. Sample background image.
    vec4 src = texture(u_image, v_texCoord);

    // 3. Simple integer projection.
    vec2 cell = floor(v_texCoord * freq);

    // 4. Generate Random Noise Mask.
    float threshold = hash(cell); // full [0.0, 1.0] range for fair distribution
    float brightness = hash(cell + 0.1) * 0.7 + 0.3; // restrict brightness to [0.3, 1.0] to prevent black voids
    float lit = step(1.0 - density, threshold) * step(0.001, density);

    // 5. Output Final Color.
    vec3 color = vec3(brightness);
    outColor = vec4(
        mix(src.rgb, color, lit),
        max(src.a, lit)
    );
}
`;

export const BEAM_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[2]; // [radius, intensity]
uniform vec2 u_resolution;
in vec2 v_texCoord;
out vec4 outColor;

void main() {
    float radius = u_params[0] / 100.0 * 1.5 + 0.1;
    float intensity = u_params[1] / 100.0;
    vec2 uv = (v_texCoord - 0.5) * u_resolution / u_resolution.y;
    float r = length(uv);

    float glow = 1.0 - smoothstep(0.0, radius, r);
    vec3 color = vec3(1.0);
    vec4 src = texture(u_image, v_texCoord);
    outColor = vec4(src.rgb + color * glow * intensity, clamp(src.a + glow * intensity * 0.4, 0.0, 1.0));
}
`;

export const GRID_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform float u_params[4]; // [horizontal, vertical, thickness, feather]
uniform vec2 u_resolution;
in vec2 v_texCoord;
out vec4 outColor;

void main() {
    // 1. Map sliders to frequency and parameters.
    float normX = u_params[0] / 100.0;
    float normY = u_params[1] / 100.0;
    float thickness = u_params[2] / 100.0;
    float feather = u_params[3] / 100.0;

    // Exponential frequency: freq=1 at 1% (one centered line), doubling from there.
    // Multiply resolution by 0.25 to ensure gridlines are still visible at max horizontal/vertical lines
    vec2 freq = vec2(
        round(exp2(normX * log2(u_resolution.x * 0.25))),
        round(exp2(normY * log2(u_resolution.y * 0.25)))
    );

    // 2. Sample background image.
    vec4 src = texture(u_image, v_texCoord);

    // 3. Simple integer projection.
    vec2 uv = v_texCoord * freq;

    // 4. Calculate Grid Mask with Anti-Aliasing & Feathering.
    float targetPixelWidth = mix(1.0, 200.0, thickness);
    float featherPixels = mix(0.5, 200.0, feather); // Range from 0.5px (sharp) to 200px (glow)
    
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

    // 5. Output Final Color.
    outColor = vec4(src.rgb + mask, clamp(src.a + mask * 0.8, 0.0, 1.0));
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
    PIXEL_SORT: { name: 'PIXEL_SORT', fragmentSource: PIXEL_SORT_SHADER },
    DATA_CORRUPTION: { name: 'DATA_CORRUPTION', fragmentSource: DATA_CORRUPTION_SHADER },
    COLOR_BLEED: { name: 'COLOR_BLEED', fragmentSource: COLOR_BLEED_SHADER },
    COMPRESSION_HELL: { name: 'COMPRESSION_HELL', fragmentSource: COMPRESSION_HELL_SHADER },
    RANDOM_CHAOS: { name: 'RANDOM_CHAOS', fragmentSource: RANDOM_CHAOS_SHADER },
    ZOOM_PAN: { name: 'ZOOM_PAN', fragmentSource: ZOOM_PAN_SHADER },
    SCREEN_SHAKE: { name: 'SCREEN_SHAKE', fragmentSource: SCREEN_SHAKE_SHADER, velocityParamIndex: 1 },
    STARFIELD: { name: 'STARFIELD', fragmentSource: STARFIELD_SHADER, velocityParamIndex: 1 },
    RETRO_GRID: { name: 'RETRO_GRID', fragmentSource: RETRO_GRID_SHADER, velocityParamIndex: 1 },
    TUNNEL_WARP: { name: 'TUNNEL_WARP', fragmentSource: TUNNEL_WARP_SHADER, velocityParamIndex: 1 },
    NOISE: { name: 'NOISE', fragmentSource: NOISE_SHADER },
    BEAM: { name: 'BEAM', fragmentSource: BEAM_SHADER },
    GRID: { name: 'GRID', fragmentSource: GRID_SHADER },
};
