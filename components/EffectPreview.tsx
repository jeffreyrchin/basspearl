import React, { useRef, useEffect, useCallback } from 'react';
import { GlitchEffectType } from '../types';
import { renderThumbnail } from '../services/thumbnailService';

interface EffectPreviewProps {
    type: GlitchEffectType;
}

const EffectPreview: React.FC<EffectPreviewProps> = ({ type }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const hoveredRef = useRef(false);
    const rafRef = useRef<number>();
    const startTimeRef = useRef<number>(0);
    const isRenderingRef = useRef(false);

    const scheduleRender = useCallback((time: number) => {
        if (!canvasRef.current) return;

        // Prevent queueing a new render while one is already in-flight
        if (isRenderingRef.current) return;
        isRenderingRef.current = true;

        renderThumbnail(canvasRef.current, type, time).finally(() => {
            isRenderingRef.current = false;

            // If still hovered, queue next frame
            if (hoveredRef.current) {
                rafRef.current = requestAnimationFrame(() => {
                    scheduleRender((Date.now() - startTimeRef.current) / 1000);
                });
            }
        });
    }, [type]);

    // Render a static poster frame once the canvas is mounted
    useEffect(() => {
        scheduleRender(10);
    }, [scheduleRender]);

    const handleMouseEnter = useCallback(() => {
        hoveredRef.current = true;
        startTimeRef.current = Date.now();
        // Kick off the animation loop
        scheduleRender(0);
    }, [scheduleRender]);

    const handleMouseLeave = useCallback(() => {
        hoveredRef.current = false;
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = undefined;
        }
        // Go back to a stable frame-10 snapshot
        scheduleRender(10);
    }, [scheduleRender]);

    // Keyboard navigation: listen for focus/blur on the parent button to trigger animations
    useEffect(() => {
        const parent = canvasRef.current?.closest('button');
        if (!parent) return;

        parent.addEventListener('focus', handleMouseEnter);
        parent.addEventListener('blur', handleMouseLeave);
        return () => {
            parent.removeEventListener('focus', handleMouseEnter);
            parent.removeEventListener('blur', handleMouseLeave);
        };
    }, [handleMouseEnter, handleMouseLeave]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            hoveredRef.current = false;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return (
        <div
            className="absolute inset-0 w-full h-full overflow-hidden"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <canvas
                ref={canvasRef}
                className="w-full h-full object-cover"
                width={256}
                height={256}
            />
        </div>
    );
};

export default EffectPreview;
