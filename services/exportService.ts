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
    aspectRatio?: number;
    onProgress?: (progress: number) => void;
    signal?: AbortSignal;
}

/**
 * Calculates standardized export dimensions that fit within a 16:9 or 9:16 'resolution class' box.
 */
export const calculateExportDimensions = (aspectRatio: number, maxSize: number): { width: number, height: number } => {
    // 1. Determine the standard "Box" for this resolution (e.g., 1080p -> 1920x1080 or 1080x1920)
    const boxW = aspectRatio >= 1 ? maxSize : Math.floor(maxSize * (9 / 16));
    const boxH = aspectRatio >= 1 ? Math.floor(maxSize * (9 / 16)) : maxSize;

    // 2. Scale our custom aspect ratio to fit inside that box
    const scale = Math.min(boxW / aspectRatio, boxH);
    let w = Math.floor(aspectRatio * scale) & ~1;
    let h = Math.floor(scale) & ~1;

    // 3. Absolute safety cap to prevent hardware encoder crashes (Total pixel area limit)
    const pixels = w * h;
    if (pixels > MAX_PIXELS) {
        const areaScale = Math.sqrt(MAX_PIXELS / pixels);
        w = Math.floor(w * areaScale) & ~1; // Force even for H.264 support
        h = Math.floor(h * areaScale) & ~1; // Force even for H.264 support
    }

    return { width: w, height: h };
};

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
        aspectRatio = 16 / 9,
        onProgress
    } = options;

    if (!reactivityMap) throw new Error("Reactivity map is required for export");
    if (!audioBuffer) throw new Error("Audio buffer is required for export");

    let targetRatio = aspectRatio;

    if (imageSrc) {
        // Must decode image to get dimensions
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const i = new Image();
            i.onload = () => resolve(i);
            i.onerror = (e) => reject(new Error("Failed to load image for export"));
            i.src = imageSrc;
        });
        targetRatio = img.naturalWidth / img.naturalHeight;
    }

    const { width: outWidth, height: outHeight } = calculateExportDimensions(targetRatio, maxSize);

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
