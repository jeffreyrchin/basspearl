import { useAudioStore } from '../store/useAudioStore';

export const useLiveAudio = () => {
    const store = useAudioStore();

    return {
        isLiveMode: store.isLiveMode,
        startMic: store.startMic,
        stopMic: store.stopMic,
        getLiveReactivity: store.getLiveReactivity
    };
};
