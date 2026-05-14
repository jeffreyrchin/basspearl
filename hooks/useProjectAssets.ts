import React, { useEffect, useCallback } from 'react';
import { useEffectStore } from '../store/useEffectStore';

export interface UseProjectAssetsProps {
    loadAudioFromUrl: (url: string, title: string) => Promise<void>;
}

export const useProjectAssets = ({
    loadAudioFromUrl,
}: UseProjectAssetsProps) => {
    const puzzleAudio = useEffectStore(s => s.puzzleAudio);

    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    const loadPuzzleAudio = useCallback(() => {
        if (!puzzleAudio) return;
        loadAudioFromUrl(puzzleAudio.url, puzzleAudio.label).catch(err => {
            console.error('Failed to load puzzle audio:', err);
        });
    }, [loadAudioFromUrl, puzzleAudio]);

    // Switch puzzle audio when puzzle difficulty changes
    useEffect(() => {
        if (puzzleAudio) loadPuzzleAudio();
    }, [puzzleAudio, loadPuzzleAudio]);

    return {
        canvasRef,
    };
};
