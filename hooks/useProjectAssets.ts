import React, { useState, useCallback } from 'react';
import { analytics } from '@/services/analytics';
import { useEffectStore } from '../store/useEffectStore';

export interface UseProjectAssetsProps {
    audioFile: File | null;
    startMic: () => Promise<void>;
    startTabAudio: () => Promise<void>;
    loadAudioFromUrl: (url: string, title: string) => Promise<void>;
    loadAudioFromFile: (file: File) => Promise<void>;
}

export const useProjectAssets = ({
    audioFile,
    startMic,
    startTabAudio,
    loadAudioFromUrl,
    loadAudioFromFile
}: UseProjectAssetsProps) => {
    const effects = useEffectStore(s => s.effects);

    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    const [isLandingOpen, setIsLandingOpen] = useState(effects.length === 0 && audioFile === null);

    const handleLandingStart = useCallback((audioOption: 'upload' | 'mic' | 'demo' | 'tab', selectedAudioFile?: File) => {
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
        } else if (audioOption === 'mic') {
            startMic().catch(err => {
                console.error('Failed to start mic:', err);
            });
        } else if (audioOption === 'tab') {
            startTabAudio().catch(err => {
                console.error('Failed to start tab audio:', err);
            });
        }
    }, [loadAudioFromUrl, loadAudioFromFile, startMic, startTabAudio]);

    return {
        isLandingOpen,
        setIsLandingOpen,
        handleLandingStart,
        canvasRef,
    };
};
