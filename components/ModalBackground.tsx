import React, { useRef, useLayoutEffect } from 'react';
import { GlitchEngine } from '../services/glitchEngine';
import { createMacroInstance } from '../constants';
import { MacroType } from '../types';

interface ModalBackgroundProps {
    macroType: MacroType;
    opacity?: number;
}

const ModalBackground: React.FC<ModalBackgroundProps> = ({
    macroType,
    opacity = 0.4
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<GlitchEngine | null>(null);
    const rafRef = useRef<number>();
    const startTimeRef = useRef<number>(Date.now());

    // Preset blueprint
    const blueprint = React.useMemo(() => createMacroInstance(macroType, true), [macroType]);

    useLayoutEffect(() => {
        if (!canvasRef.current) return;

        // Initialize engine for this specific background
        const engine = new GlitchEngine();
        engineRef.current = engine;

        const render = () => {
            if (!canvasRef.current || !engineRef.current) return;

            const elapsed = (Date.now() - startTimeRef.current) / 1000;

            // Sync canvas size to its display size
            const rect = canvasRef.current.getBoundingClientRect();
            const width = Math.floor(rect.width);
            const height = Math.floor(rect.height);

            // Render the macro preview
            engineRef.current.renderToCanvas(canvasRef.current, blueprint, {
                currentTime: elapsed,
                targetWidth: width,
                reactivity: { sub: 0.0, bass: 0.0, mid: 0.0, treble: 0.0 }
            });

            rafRef.current = requestAnimationFrame(render);
        };

        rafRef.current = requestAnimationFrame(render);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            if (engineRef.current) {
                engineRef.current.dispose();
                engineRef.current = null;
            }
        };
    }, [blueprint]);

    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
            <canvas
                ref={canvasRef}
                style={{ opacity }}
                className="w-full h-full object-cover"
            />

            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
        </div>
    );
};

export default ModalBackground;
