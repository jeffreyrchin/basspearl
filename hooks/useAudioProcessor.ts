import React from 'react';
import { useAudioStore } from '../store/useAudioStore';
import { mainAudioEngine } from '../services/audioEngine';

export const useAudioProcessor = () => {
    const store = useAudioStore();

    return {
        // UI State (Subscribed from Zustand)
        audioFile: store.audioFile,
        isPlaying: store.isPlaying,
        currentTime: store.currentTime,
        duration: store.duration,
        isProcessing: store.isProcessing,
        processingProgress: store.processingProgress,

        // Logic Actions (Subscribed from Zustand)
        handleAudioUpload: (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files[0]) {
                store.loadAudioFromFile(e.target.files[0]);
            }
        },
        togglePlay: store.togglePlay,
        handleSeek: store.handleSeek,
        getElapsedSeconds: store.getElapsedSeconds,
        formatTime: store.formatTime,
        setCurrentTime: store.setCurrentTime,
        loadAudioFromUrl: store.loadAudioFromUrl,
        loadAudioFromFile: store.loadAudioFromFile,
        stopPlayback: store.stopPlayback,

        // Engine Access (Computed properties to ensure they are always "Live" and not stale captures)
        audioContextRef: { get current() { return mainAudioEngine.context; } },
        isPlayingRef: { get current() { return mainAudioEngine.isPlaying; } },
        reactivityMapRef: { get current() { return mainAudioEngine.reactivityMap; } },
        integratedReactivityMapRef: { get current() { return mainAudioEngine.integratedReactivityMap; } },
        audioBufferRef: { get current() { return mainAudioEngine.buffer; } }
    };
};
