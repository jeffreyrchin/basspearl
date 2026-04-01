import React, { useState, useCallback } from 'react';
import { mainGlitchEngine } from '@/services/glitchEngine';
import { analytics } from '@/services/analytics';
import { useEffectStore } from '../store/useEffectStore';

export interface UseProjectAssetsProps {
    audioFile: File | null;
    startMic: () => Promise<void>;
    loadAudioFromUrl: (url: string, title: string) => Promise<void>;
    loadAudioFromFile: (file: File) => Promise<void>;
}

export const useProjectAssets = ({
    audioFile,
    startMic,
    loadAudioFromUrl,
    loadAudioFromFile
}: UseProjectAssetsProps) => {
    const effects = useEffectStore(s => s.effects);

    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const imageFileRef = React.useRef<string | null>(null);

    const [isLandingOpen, setIsLandingOpen] = useState(effects.length === 0 && audioFile === null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    const handleLandingStart = useCallback((audioOption: 'upload' | 'live' | 'demo', selectedAudioFile?: File) => {
        setIsLandingOpen(false);

        // 1. Handle Audio Option
        if (audioOption === 'demo') {
            analytics.audio.demo_started();
            loadAudioFromUrl('/trip.mp3', 'Demo Track').catch(err => {
                console.error('Failed to load demo track:', err);
            });
        } else if (audioOption === 'upload' && selectedAudioFile) {
            loadAudioFromFile(selectedAudioFile).catch(err => {
                console.error('Failed to load uploaded audio:', err);
            });
        } else if (audioOption === 'live') {
            startMic().catch(err => {
                console.error('Failed to start mic:', err);
            });
        }
    }, [loadAudioFromUrl, loadAudioFromFile, startMic]);

    const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            analytics.image.started(file);
            setImageFile(file);
            const imageBlob = URL.createObjectURL(file);
            imageFileRef.current = imageBlob; // Store the URL string for the animation loop

            const img = new Image();
            img.src = imageBlob;

            // Use .decode() to get a real promise that rejects with a meaningful error
            img.decode()
                .then(() => {
                    // Success!
                    if (canvasRef.current) {
                        mainGlitchEngine.renderToCanvas(
                            canvasRef.current,
                            imageBlob,
                            effects,
                            { maxSize: 1920 }
                        );
                        analytics.image.succeeded(file, img.width, img.height);
                    }
                })
                .catch((err: any) => {
                    analytics.image.failed(file, err);
                    console.error("Image decode failed:", err);
                    URL.revokeObjectURL(imageBlob);
                    imageFileRef.current = null;
                    setImageFile(null);
                });
        }
    }, [canvasRef, effects, imageFileRef]);

    return {
        isLandingOpen,
        setIsLandingOpen,
        imageFile,
        handleLandingStart,
        handleImageUpload,
        canvasRef,
        imageFileRef
    };
};
