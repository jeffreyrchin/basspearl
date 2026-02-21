import {
    Output,
    Mp4OutputFormat,
    BufferTarget,
    CanvasSource,
    AudioBufferSource,
    getFirstEncodableAudioCodec
} from 'mediabunny';
import { GlitchEngine } from './glitchEngine';
import { mapReactivityToEffects } from './calculateReactiveEffects';
import { EffectConfig } from '../types';

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
}

/**
 * Service to export the glitch art to a video file using WebCodecs via Mediabunny.
 */
export const exportVideo = async (options: ExportOptions) => {
    const {
        audioBuffer,
        reactivityMap,
        integratedReactivity,
        imageSrc,
        effects,
        duration,
        fps = 60,
        maxSize = 1280,
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

    // Apply maxSize constraint (Longest Edge) for images
    if (imageSrc && (outWidth > maxSize || outHeight > maxSize)) {
        const ratio = Math.min(maxSize / outWidth, maxSize / outHeight);
        outWidth = Math.floor(outWidth * ratio);
        outHeight = Math.floor(outHeight * ratio);
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

    console.log(`Starting export: ${totalFrames} frames at ${fps}fps`);

    // 8. Generation Loop (Deterministic offline rendering)
    for (let i = 0; i < totalFrames; i++) {
        const time = i / fps;

        // Grab precomputed audio data for this frame index
        const frameData = {
            sub: reactivityMap.sub[i] ?? 0,
            bass: reactivityMap.bass[i] ?? 0,
            mid: reactivityMap.mid[i] ?? 0,
            treble: reactivityMap.treble[i] ?? 0
        };

        // Grab integrated data for this frame index (Starfield/Motion)
        let frameIntegrated = undefined;
        if (integratedReactivity) {
            frameIntegrated = {
                sub: integratedReactivity.sub[i] ?? 0,
                bass: integratedReactivity.bass[i] ?? 0,
                mid: integratedReactivity.mid[i] ?? 0,
                treble: integratedReactivity.treble[i] ?? 0
            };
        }

        // Calculate reactive effects for this frame
        const reactiveEffects = mapReactivityToEffects(frameData, effects, i);

        // Render glitch to our hidden canvas
        await exportEngine.renderToCanvas(renderCanvas, imageSrc, reactiveEffects, {
            maxSize,
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

        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `glitchbrain_${Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(downloadUrl);
        console.log("Export complete!");
    }
};
