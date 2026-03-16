import {
    Output,
    Mp4OutputFormat,
    BufferTarget,
    CanvasSource,
    AudioBufferSource,
    getFirstEncodableAudioCodec
} from 'mediabunny';
import { GlitchEngine } from './glitchEngine';
import { EffectConfig } from '../types';
import { MAX_PIXELS } from '../constants';

export interface ExportOptions {
    audioBuffer: AudioBuffer | null;
    reactivityMap: {
        sub: Float32Array;
        bass: Float32Array;
        mid: Float32Array;
        treble: Float32Array;
    } | null;
    integratedReactivity: {
        sub: Float32Array;
        bass: Float32Array;
        mid: Float32Array;
        treble: Float32Array;
    } | null;
    imageSrc: string | null;
    effects: EffectConfig[];
    duration: number;
    fps?: number;
    maxSize?: number;
    onProgress?: (progress: number) => void;
    signal?: AbortSignal;
}

/**
 * Service to export the glitch art to a video file using WebCodecs via Mediabunny.
 */
export const exportVideo = async (options: ExportOptions): Promise<{ fileUrl: string, fileName: string } | null> => {
    const {
        audioBuffer,
        reactivityMap,
        integratedReactivity,
        imageSrc,
        effects,
        duration,
        fps = 60,
        maxSize = 1920,
        onProgress
    } = options;

    if (!reactivityMap) throw new Error("Reactivity map is required for export");

    let outWidth = maxSize;
    let outHeight = Math.floor(maxSize * (9 / 16));

    if (imageSrc) {
        // Must decode image to get dimensions (new calculations needed for maxSize, which may be different from preview maxSize of 1920)
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const i = new Image();
            i.onload = () => resolve(i);
            i.onerror = (e) => reject(new Error("Failed to load image for export"));
            i.src = imageSrc;
        });

        outWidth = img.naturalWidth;
        outHeight = img.naturalHeight;
    }

    // Apply maxSize as the absolute longest edge target for images
    if (imageSrc) {
        // Find the ratio needed to make the longest edge equal to maxSize
        const ratio = maxSize / Math.max(outWidth, outHeight);
        outWidth = Math.floor(outWidth * ratio);
        outHeight = Math.floor(outHeight * ratio);

        // Hardware H.264 encoders (avc1) typically cap out around 4K UHD area (3840x2160 = 8.3M pixels).
        // If the resulting scale exceeds this (e.g. 3840x3840 = 14.7M pixels for a square image), 
        // Chrome/Safari will immediately throw an encoder config error.
        // Fix: Safely scale down any over-budget dimensions by their total pixel area.
        const currentPixels = outWidth * outHeight;

        if (currentPixels > MAX_PIXELS) {
            const areaScale = Math.sqrt(MAX_PIXELS / currentPixels);
            outWidth = Math.floor(outWidth * areaScale);
            outHeight = Math.floor(outHeight * areaScale);
        }
    }

    // Force even for H.264 support
    outWidth = outWidth & ~1;
    outHeight = outHeight & ~1;

    console.log(`Initializing output at ${outWidth}x${outHeight}...`);

    // 2. Initialize Mediabunny Output
    const target = new BufferTarget();
    const output = new Output({
        format: new Mp4OutputFormat(),
        target: target
    });

    // 3. Set up Render Canvas
    const renderCanvas = document.createElement('canvas');
    renderCanvas.width = outWidth;
    renderCanvas.height = outHeight;

    // 4. Set up Video Track
    const videoSource = new CanvasSource(renderCanvas, {
        codec: 'avc',
        bitrate: 8_000_000 // 8 Mbps
    });
    output.addVideoTrack(videoSource);

    // 4. Set up Audio Track (Adaptive Probing)
    let audioSource: AudioBufferSource | null = null;
    if (audioBuffer) {
        const bestCodec = await getFirstEncodableAudioCodec(['aac', 'opus', 'mp3', 'vorbis', 'flac', 'ac3', 'eac3', 'pcm-s16', 'pcm-s16be', 'pcm-s24', 'pcm-s24be', 'pcm-s32', 'pcm-s32be', 'pcm-f32', 'pcm-f32be', 'pcm-f64', 'pcm-f64be', 'pcm-u8', 'pcm-s8', 'ulaw', 'alaw']);

        if (bestCodec) {
            console.log(`Using audio codec: ${bestCodec}`);
            audioSource = new AudioBufferSource({
                codec: bestCodec,
                bitrate: 192_000,
            });
            output.addAudioTrack(audioSource);
        } else {
            console.warn('No encodable audio codec found. Exporting as silent video.');
        }
    }

    // 5. Start the output
    await output.start();

    // 6. Add Audio (if available)
    if (audioSource && audioBuffer) {
        await audioSource.add(audioBuffer);
    }

    // 7. Initialize Rendering Engine
    const exportEngine = new GlitchEngine();
    const totalFrames = Math.ceil(duration * fps);

    // Compute audio data rate dynamically from the actual map length
    const audioDataRate = reactivityMap.bass.length / duration;

    // Helper for linear interpolation between audio samples
    const lerp = (arr: Float32Array, baseIdx: number, f: number) => {
        const v1 = arr[baseIdx] ?? 0;
        const v2 = arr[baseIdx + 1] ?? v1;
        return v1 + (v2 - v1) * f;
    };

    console.log(`[Export] START: ${totalFrames} frames at ${fps}fps | audio map: ${reactivityMap.bass.length} samples at ${audioDataRate.toFixed(2)}Hz | duration: ${duration.toFixed(3)}s`);

    // 8. Generation Loop (Deterministic offline rendering)
    try {
        for (let i = 0; i < totalFrames; i++) {
            // Check for user cancellation
            if (options.signal?.aborted) {
                throw new DOMException("Export aborted", "AbortError");
            }

            const time = i / fps;

            // The audio data was captured at 60Hz. We calculate the exact fractional index
            // for the current export time to ensure visuals stay perfectly synced 
            // regardless of the export FPS (no slow motion).
            const audioDataRate = 60;
            const audioIndex = time * audioDataRate;
            const idx = Math.floor(audioIndex);
            const fract = audioIndex - idx;

            // Grab precomputed audio data for this frame index with linear interpolation
            const frameData = {
                sub: lerp(reactivityMap.sub, idx, fract),
                bass: lerp(reactivityMap.bass, idx, fract),
                mid: lerp(reactivityMap.mid, idx, fract),
                treble: lerp(reactivityMap.treble, idx, fract)
            };

            // Grab integrated data for this frame index (Starfield/Motion) with linear interpolation
            let frameIntegrated = undefined;
            if (integratedReactivity) {
                frameIntegrated = {
                    sub: lerp(integratedReactivity.sub, idx, fract),
                    bass: lerp(integratedReactivity.bass, idx, fract),
                    mid: lerp(integratedReactivity.mid, idx, fract),
                    treble: lerp(integratedReactivity.treble, idx, fract)
                };
            }

            // Render glitch to our hidden canvas
            await exportEngine.renderToCanvas(renderCanvas, imageSrc, effects, {
                maxSize,
                reactivity: frameData,
                integratedReactivity: frameIntegrated,
                currentTime: time,
                imagelessWidth: outWidth,
                imagelessHeight: outHeight
            });

            // Inject the current state of the canvas into the video pipeline
            // Mediabunny takes timestamps in seconds
            await videoSource.add(time, 1 / fps);

            // Yield to the main thread every 10 frames to avoid hanging
            if (i % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }

            if (onProgress) {
                onProgress((i + 1) / totalFrames);
            }
        }

        // 9. Finalize and Download
        console.log("Finalizing video file...");
        await output.finalize();

        if (target.buffer) {
            const blob = new Blob([target.buffer], { type: 'video/mp4' });
            const downloadUrl = URL.createObjectURL(blob);
            const fileName = `muxels_${Date.now()}.mp4`;

            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log("Export complete!");
            return { fileUrl: downloadUrl, fileName };
        }

        return null;
    } finally {
        // MUST DISPOSE to prevent WebGL Context Leaks (Max context count limit)
        exportEngine.dispose();
    }
};
