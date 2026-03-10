import React, { useEffect, useState } from 'react';
import { GlitchEffectType, MacroType } from '../types';
import { getThumbnailDataUrl } from '../services/thumbnailService';
import { createMacroInstance, createEffectInstance } from '../constants';

interface EffectPreviewProps {
    type?: GlitchEffectType;
    macroType?: MacroType;
}

/**
 * Pure, static poster image for each effect card.
 * This component does NOT own a WebGL canvas. It just shows a cached
 * static image so it costs virtually nothing for Safari's compositor.
 * 
 * The live animation is handled externally by HoverCanvas,
 * which is a single shared canvas that portals into the active card.
 */
const EffectPreview: React.FC<EffectPreviewProps> = ({ type, macroType }) => {
    const [posterUrl, setPosterUrl] = useState<string | null>(null);

    const blueprint = React.useMemo(() => {
        return macroType
            ? createMacroInstance(macroType, true)
            : [createEffectInstance(type, true)];
    }, [type, macroType]);

    useEffect(() => {
        let mounted = true;
        getThumbnailDataUrl(blueprint).then(url => {
            if (mounted) setPosterUrl(url);
        });
        return () => { mounted = false; };
    }, [blueprint]);

    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
            {posterUrl && (
                <img
                    src={posterUrl}
                    alt="Effect Preview"
                    className="w-full h-full object-cover"
                    draggable={false}
                />
            )}
        </div>
    );
};

export default EffectPreview;
