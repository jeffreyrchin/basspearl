import React, { useRef, useEffect, useCallback, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { EffectConfig } from '../types';
import { renderThumbnail } from '../services/thumbnailService';
import { THUMBNAIL_SIZE } from '../constants';

interface HoverCanvasProps {
    targetEl: HTMLElement | null;
    blueprint: EffectConfig[];
}

/**
 * A single globally-shared WebGL canvas.
 * Portals itself into whatever `targetEl` is passed, and runs the
 * render loop for that effect. When `targetEl` is null, it renders nothing.
 * 
 * This means there is EXACTLY ONE extra canvas on the entire page
 * while hovering effects in the library, keeping Safari fluent.
 */
const HoverCanvas: React.FC<HoverCanvasProps> = ({ targetEl, blueprint }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>();
    const startTimeRef = useRef<number>(0);
    const isRenderingRef = useRef(false);
    const [isReady, setIsReady] = useState(false);
    const activeIdRef = useRef<number>(0);

    const scheduleRender = useCallback((time: number, id: number) => {
        if (!canvasRef.current || blueprint.length === 0) return;
        if (isRenderingRef.current) return;
        isRenderingRef.current = true;

        renderThumbnail(canvasRef.current, blueprint, time).finally(() => {
            if (id !== activeIdRef.current) return; // stale id
            isRenderingRef.current = false;

            // Continue the loop as long as we have a target
            if (canvasRef.current) {
                rafRef.current = requestAnimationFrame(() => {
                    const elapsed = (Date.now() - startTimeRef.current) / 1000;
                    scheduleRender(elapsed, id);
                });
                setIsReady(true);
            }
        });
    }, [blueprint]);

    // Start/restart the loop whenever the target or blueprint changes
    useLayoutEffect(() => {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = undefined;
        }
        isRenderingRef.current = false;

        if (targetEl && blueprint.length > 0) {
            setIsReady(false); // useLayoutEffect ensures this runs (sets hover canvas opacity to 0) before hover canvas portal is moved from Card A to Card B
            const currentId = activeIdRef.current + 1;
            activeIdRef.current = currentId;
            startTimeRef.current = Date.now();
            // 16ms delay ensures the canvas is fully mounted in the DOM before first draw
            const t = setTimeout(() => scheduleRender(0, currentId), 16);
            return () => clearTimeout(t);
        }
    }, [targetEl, blueprint, scheduleRender]);

    // Final cleanup on unmount
    useEffect(() => {
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    if (!targetEl) return null;

    return createPortal(
        <canvas
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full object-cover animate-in fade-in duration-150 pointer-events-none z-[5] ${isReady ? 'opacity-100' : 'opacity-0'}`}
            width={THUMBNAIL_SIZE}
            height={THUMBNAIL_SIZE}
        />,
        targetEl
    );
};

export default HoverCanvas;
