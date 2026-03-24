import React, { useEffect, useState, useRef } from 'react';
import { GlitchEffectType, MacroType } from '../types';
import { getThumbnailDataUrl, getCachedThumbnail } from '../services/thumbnailService';
import { createMacroInstance, createEffectInstance } from '../constants';
import { motion } from 'framer-motion';

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
    const blueprint = React.useMemo(() => {
        return macroType
            ? createMacroInstance(macroType, true)
            : [createEffectInstance(type, true)];
    }, [type, macroType]);

    const [posterUrl, setPosterUrl] = useState<string | null>(() => getCachedThumbnail(blueprint));
    const wasCachedOnMount = useRef(!!posterUrl);

    useEffect(() => {
        if (posterUrl) return;
        let mounted = true;
        getThumbnailDataUrl(blueprint).then(url => {
            if (mounted) setPosterUrl(url);
        });
        return () => { mounted = false; };
    }, [blueprint]);

    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-900">
            {posterUrl ? (
                <motion.img
                    key={posterUrl}
                    src={posterUrl}
                    alt="Effect Preview"
                    className="w-full h-full object-cover"
                    draggable={false}
                    initial={{ opacity: wasCachedOnMount.current ? 1 : 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                />
            ) : <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />}
        </div>
    );
};

export default EffectPreview;
