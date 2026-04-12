import { useAudioStore } from '../store/useAudioStore';

export const useLiveAudio = () => {
    const store = useAudioStore();

    return {
        isLiveMode: store.isLiveMode,
        liveSourceType: store.liveSourceType,
        startMic: store.startMic,
        startTabAudio: store.startTabAudio,
        stopMic: store.stopMic,
        getLiveReactivity: store.getLiveReactivity
    };
};
