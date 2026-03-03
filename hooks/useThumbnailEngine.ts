import { useEffect, useState } from 'react';
import { GlitchEngine } from '../services/glitchEngine';

let thumbnailEngine: GlitchEngine | null = null;

export const useThumbnailEngine = () => {
    const [engine, setEngine] = useState<GlitchEngine | null>(thumbnailEngine);

    useEffect(() => {
        if (!thumbnailEngine) {
            thumbnailEngine = new GlitchEngine();
            setEngine(thumbnailEngine);
        }
    }, []);

    return engine;
};
