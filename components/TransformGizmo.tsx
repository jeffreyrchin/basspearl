import React, { useRef, useState, useEffect } from 'react';
import { useEffectStore } from '../store/useEffectStore';

interface TransformGizmoProps {
    canvasRef: React.RefObject<HTMLCanvasElement>;
}

export const TransformGizmo: React.FC<TransformGizmoProps> = ({ canvasRef }) => {
    const effects = useEffectStore(s => s.effects);
    const selectedIds = useEffectStore(s => s.selectedIds);
    const updateParameter = useEffectStore(s => s.updateParameter);
    const commitHistory = useEffectStore(s => s.commitHistory);

    const selectedId = selectedIds.size === 1 ? Array.from(selectedIds)[0] : null;
    const effect = selectedId ? effects.find(e => e.id === selectedId) : null;

    const scaleXIdx = effect ? effect.params.findIndex(p => p.param === 'Scale X') : -1;
    const scaleYIdx = effect ? effect.params.findIndex(p => p.param === 'Scale Y') : -1;
    const panXIdx = effect ? effect.params.findIndex(p => p.param === 'Pan X') : -1;
    const panYIdx = effect ? effect.params.findIndex(p => p.param === 'Pan Y') : -1;

    const isValid = effect && scaleXIdx !== -1 && scaleYIdx !== -1 && panXIdx !== -1 && panYIdx !== -1;

    const scaleX = isValid ? effect.params[scaleXIdx].value : 0;
    const scaleY = isValid ? effect.params[scaleYIdx].value : 0;
    const panX = isValid ? effect.params[panXIdx].value : 0;
    const panY = isValid ? effect.params[panYIdx].value : 0;

    const containerRef = useRef<HTMLDivElement>(null);

    // Track the actual rendered canvas bounds
    const [canvasRect, setCanvasRect] = useState<{ left: number, top: number, width: number, height: number } | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const updateRect = () => {
            const cRect = canvas.getBoundingClientRect();
            const pRect = containerRef.current.getBoundingClientRect();

            if (pRect.width > 0 && pRect.height > 0) {
                setCanvasRect({
                    left: ((cRect.left - pRect.left) / pRect.width) * 100,
                    top: ((cRect.top - pRect.top) / pRect.height) * 100,
                    width: (cRect.width / pRect.width) * 100,
                    height: (cRect.height / pRect.height) * 100
                });
            }
        };

        updateRect();

        const observer = new ResizeObserver(updateRect);

        // Observe window resizing, layout shifts, etc.
        if (containerRef.current?.parentElement) {
            observer.observe(containerRef.current.parentElement);
        }

        // Observe canvas resizing (e.g. when uploading a new image)
        observer.observe(canvas);

        return () => {
            observer.disconnect();
        };
    }, [isValid]);

    // State for dragging
    const [isDragging, setIsDragging] = useState<'pan' | 'scale' | null>(null);

    // We use ref to store latest state to avoid re-binding listeners
    const dragStateRef = useRef({
        startX: 0,
        startY: 0,
        startPanX: 0,
        startPanY: 0,
        startScaleX: 0,
        startScaleY: 0,
        containerW: 0,
        containerH: 0,
    });

    const handlePointerDown = (e: React.PointerEvent, type: 'pan' | 'scale') => {
        e.preventDefault();
        e.stopPropagation();

        commitHistory(); // Commit once before drag

        setIsDragging(type);

        const canvas = canvasRef.current;
        const rect = canvas?.getBoundingClientRect() || containerRef.current?.getBoundingClientRect();

        dragStateRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startPanX: panX,
            startPanY: panY,
            startScaleX: scaleX,
            startScaleY: scaleY,
            containerW: rect?.width || 1,
            containerH: rect?.height || 1,
        };
    };

    useEffect(() => {
        if (!isDragging || !isValid || !selectedId) return;

        const handlePointerMove = (e: PointerEvent) => {
            const { startX, startY, startPanX, startPanY, startScaleX, startScaleY, containerW, containerH } = dragStateRef.current;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            if (isDragging === 'pan') {
                // screen percentage
                const px = dx / containerW;
                const py = dy / containerH;

                // pan slider maps: visual center = 2 * panX - 50 
                // so delta slider = delta visual_percent * 50
                const newPanX = Math.max(0, Math.min(100, startPanX + (px * 50)));
                const newPanY = Math.max(0, Math.min(100, startPanY - (py * 50)));

                updateParameter(selectedId, panXIdx, { value: newPanX });
                updateParameter(selectedId, panYIdx, { value: newPanY });
            } else if (isDragging === 'scale') {
                // Dragging bottom-right handle.
                // Edge shifts by dx/dy. Width/Height shift by 2 * that.
                const px = dx / containerW;
                const py = dy / containerH;

                const newScaleX = Math.max(0, Math.min(100, startScaleX + (px * 200)));
                const newScaleY = Math.max(0, Math.min(100, startScaleY + (py * 200)));

                updateParameter(selectedId, scaleXIdx, { value: newScaleX });
                updateParameter(selectedId, scaleYIdx, { value: newScaleY });
            }
        };

        const handlePointerUp = () => {
            setIsDragging(null);
            document.body.style.cursor = 'default';
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [isDragging, isValid, selectedId, panXIdx, panYIdx, scaleXIdx, scaleYIdx, updateParameter]);

    if (!isValid) return null;

    // Visually center shape
    const visualPanX = (panX - 50) * 2 + 50;
    const visualPanY = 150 - (panY * 2);

    const safeBox = canvasRect || { left: 0, top: 0, width: 100, height: 100 };

    return (
        <div ref={containerRef} className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
            {/* The "Safe Box" Wrapper that exactly matches the canvas pixels */}
            <div className="absolute pointer-events-none transition-all duration-300 ease-out" style={{ left: `${safeBox.left}%`, top: `${safeBox.top}%`, width: `${safeBox.width}%`, height: `${safeBox.height}%` }}>
                <div
                    className={`absolute pointer-events-none group ${isDragging ? '' : 'hover:z-50'}`}
                    style={{
                        left: `${visualPanX}%`,
                        top: `${visualPanY}%`,
                        width: `${scaleX}%`,
                        height: `${scaleY}%`,
                        transform: 'translate(-50%, -50%)',
                        border: '1px solid rgba(251, 0, 255, 0.4)',
                        boxShadow: '0 0 10px rgba(251, 0, 255, 0.2) inset, 0 0 10px rgba(251, 0, 255, 0.2)'
                    }}
                >
                    {/* Center Pan Handle */}
                    <div
                        className={`pointer-events-auto absolute left-1/2 top-1/2 w-8 h-8 -ml-4 -mt-4 bg-primary/20 border border-primary rounded-full flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-move`}
                        onPointerDown={(e) => handlePointerDown(e, 'pan')}
                        title="Pan"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
                            e.preventDefault();
                            e.stopPropagation();
                            commitHistory();
                            const step = e.shiftKey ? 5 : 1;
                            if (e.key === 'ArrowRight') {
                                updateParameter(selectedId, panXIdx, { value: Math.max(0, Math.min(100, panX + step)) });
                            } else if (e.key === 'ArrowLeft') {
                                updateParameter(selectedId, panXIdx, { value: Math.max(0, Math.min(100, panX - step)) });
                            } else if (e.key === 'ArrowUp') {
                                updateParameter(selectedId, panYIdx, { value: Math.max(0, Math.min(100, panY + step)) });
                            } else if (e.key === 'ArrowDown') {
                                updateParameter(selectedId, panYIdx, { value: Math.max(0, Math.min(100, panY - step)) });
                            }
                        }}

                    >
                        <div className="w-2 h-2 bg-primary rounded-full" />
                    </div>

                    {/* Bottom Right Scale Handle */}
                    <div
                        className={`pointer-events-auto absolute right-0 bottom-0 w-4 h-4 translate-x-1/2 translate-y-1/2 bg-black border border-primary outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-nwse-resize`}
                        onPointerDown={(e) => handlePointerDown(e, 'scale')}
                        title="Scale"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
                            e.preventDefault();
                            e.stopPropagation();
                            commitHistory();
                            const step = e.shiftKey ? 5 : 1;
                            if (e.key === 'ArrowRight') {
                                updateParameter(selectedId, scaleXIdx, { value: Math.max(0, Math.min(100, scaleX + step)) });
                            } else if (e.key === 'ArrowLeft') {
                                updateParameter(selectedId, scaleXIdx, { value: Math.max(0, Math.min(100, scaleX - step)) });
                            } else if (e.key === 'ArrowUp') {
                                updateParameter(selectedId, scaleYIdx, { value: Math.max(0, Math.min(100, scaleY - step)) });
                            } else if (e.key === 'ArrowDown') {
                                updateParameter(selectedId, scaleYIdx, { value: Math.max(0, Math.min(100, scaleY + step)) });
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
