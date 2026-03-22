import React, { useRef, useState, useEffect, useCallback, memo } from 'react';
import { useEffectStore } from '../store/useEffectStore';
import { setDragOverride, clearDragOverride } from '../services/dragOverride';
import { useDragSync } from '../hooks/useDragSync';
import { useCanvasSelection } from '../hooks/useCanvasSelection';

interface TransformGizmoProps {
    canvasRef: React.RefObject<HTMLCanvasElement>;
}

type TransformType = 'pan' | 'scale';

export const TransformGizmo: React.FC<TransformGizmoProps> = ({ canvasRef }) => {
    const handleCanvasPointerDown = useCanvasSelection(canvasRef);
    const effects = useEffectStore(s => s.effects);
    const selectedIds = useEffectStore(s => s.selectedIds);
    const updateParameter = useEffectStore(s => s.updateParameter);
    const updateMultipleParameters = useEffectStore(s => s.updateMultipleParameters);
    const commitHistory = useEffectStore(s => s.commitHistory);

    const selectedId = selectedIds.size === 1 ? Array.from(selectedIds)[0] : null;
    const effect = selectedId ? effects.find(e => e.id === selectedId) : null;

    // --- 1. Parameter Definitions ---
    const panXIdx = effect ? effect.params.findIndex(p => p.param === 'Pan X') : -1;
    const panYIdx = effect ? effect.params.findIndex(p => p.param === 'Pan Y') : -1;
    const scaleXIdx = effect ? effect.params.findIndex(p => p.param === 'Scale X') : -1;
    const scaleYIdx = effect ? effect.params.findIndex(p => p.param === 'Scale Y') : -1;

    const isValid = effect && scaleXIdx !== -1 && scaleYIdx !== -1 && panXIdx !== -1 && panYIdx !== -1;

    const panX = isValid ? effect.params[panXIdx].value : 0;
    const panY = isValid ? effect.params[panYIdx].value : 0;
    const scaleX = isValid ? effect.params[scaleXIdx].value : 0;
    const scaleY = isValid ? effect.params[scaleYIdx].value : 0;

    // --- 2. Element Refs and Canvas Math ---
    const containerRef = useRef<HTMLDivElement>(null);
    const gizmoRef = useRef<HTMLDivElement>(null);
    const [canvasRect, setCanvasRect] = useState<{ left: number, top: number, width: number, height: number } | null>(null);

    useEffect(() => {
        if (!containerRef.current || !canvasRef.current) return;

        const updateRect = () => {
            const cRect = canvasRef.current!.getBoundingClientRect();
            const pRect = containerRef.current!.getBoundingClientRect();

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

        if (containerRef.current.parentElement) {
            observer.observe(containerRef.current.parentElement);
        }

        observer.observe(canvasRef.current);

        return () => observer.disconnect();
    }, [isValid, canvasRef]);

    // --- 3. Dragging State ---
    const [dragType, setDragType] = useState<TransformType | null>(null);

    // We store the values from the exact moment the drag started
    const dragStateRef = useRef({
        startX: 0, startY: 0,
        containerW: 1, containerH: 1,
        panX: 0, panY: 0,
        scaleX: 0, scaleY: 0,
        panXIdx: -1, panYIdx: -1,
        scaleXIdx: -1, scaleYIdx: -1
    });

    // --- 4. Unified Fast-Track Sync ---
    // Listens to the sliders in the sidebar and moves the Gizmo without re-rendering
    const isGizmoListening = selectedId && !dragType;

    useDragSync(isGizmoListening ? selectedId : null, null, useCallback((params) => {
        if (!gizmoRef.current) return;

        params.forEach(p => {
            if (p.value === undefined) return;

            // Update gizmo
            if (p.index === panXIdx) gizmoRef.current!.style.left = `${(p.value - 50) * 2 + 50}%`;
            else if (p.index === panYIdx) gizmoRef.current!.style.top = `${150 - (p.value * 2)}%`;
            else if (p.index === scaleXIdx) gizmoRef.current!.style.width = `${p.value}%`;
            else if (p.index === scaleYIdx) gizmoRef.current!.style.height = `${p.value}%`;
        });
    }, [panXIdx, panYIdx, scaleXIdx, scaleYIdx]));

    // --- 5. Unified Drag Handlers ---
    const handlePointerDown = (e: React.PointerEvent, type: TransformType) => {
        e.preventDefault();
        e.stopPropagation();
        commitHistory();
        setDragType(type);

        const rect = canvasRef.current?.getBoundingClientRect() || containerRef.current?.getBoundingClientRect();

        dragStateRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            containerW: rect?.width || 1,
            containerH: rect?.height || 1,
            panX, panY,
            scaleX, scaleY,
            panXIdx, panYIdx,
            scaleXIdx, scaleYIdx
        };

        // Prime the drag override so it doesn't jump
        if (type === 'pan') {
            if (selectedId) setDragOverride(selectedId, [
                { index: panXIdx, value: panX },
                { index: panYIdx, value: panY }
            ]);
        } else if (type === 'scale') {
            if (selectedId) setDragOverride(selectedId, [
                { index: scaleXIdx, value: scaleX },
                { index: scaleYIdx, value: scaleY }
            ]);
        }
    };

    useEffect(() => {
        if (!dragType || !isValid || !selectedId) return;

        const state = dragStateRef.current;

        // Keep track of the live values during the drag
        const liveValues = {
            panX: state.panX,
            panY: state.panY,
            scaleX: state.scaleX,
            scaleY: state.scaleY
        };

        const handlePointerMove = (e: PointerEvent) => {
            const px = (e.clientX - state.startX) / state.containerW;
            const py = (e.clientY - state.startY) / state.containerH;

            // Calculate the math for each specific drag type
            if (dragType === 'pan') {
                // Update live values
                liveValues.panX = Math.max(0, Math.min(100, state.panX + (px * 50)));
                liveValues.panY = Math.max(0, Math.min(100, state.panY - (py * 50)));

                // Update canvas directly
                setDragOverride(selectedId, [
                    { index: state.panXIdx, value: liveValues.panX },
                    { index: state.panYIdx, value: liveValues.panY }
                ]);

                // Update gizmo position
                if (gizmoRef.current) {
                    gizmoRef.current.style.left = `${(liveValues.panX - 50) * 2 + 50}%`;
                    gizmoRef.current.style.top = `${150 - (liveValues.panY * 2)}%`;
                }
            } else if (dragType === 'scale') {
                // Update live values
                liveValues.scaleX = Math.max(0, Math.min(100, state.scaleX + (px * 200)));
                liveValues.scaleY = Math.max(0, Math.min(100, state.scaleY + (py * 200)));

                // Update canvas directly
                setDragOverride(selectedId, [
                    { index: state.scaleXIdx, value: liveValues.scaleX },
                    { index: state.scaleYIdx, value: liveValues.scaleY }
                ]);

                // Update gizmo size
                if (gizmoRef.current) {
                    gizmoRef.current.style.width = `${liveValues.scaleX}%`;
                    gizmoRef.current.style.height = `${liveValues.scaleY}%`;
                }
            }
        };

        const handlePointerUp = (e: PointerEvent) => {
            clearDragOverride();

            // If the mouse didn't move much, treat it as a drill-down click
            const dist = Math.sqrt(Math.pow(e.clientX - state.startX, 2) + Math.pow(e.clientY - state.startY, 2));
            if (dist < 3) handleCanvasPointerDown(e as any);

            // Save the exact final location to the store
            if (dragType === 'pan') {
                updateMultipleParameters(selectedId, [
                    { paramIndex: state.panXIdx, update: { value: liveValues.panX } },
                    { paramIndex: state.panYIdx, update: { value: liveValues.panY } }
                ]);
            } else if (dragType === 'scale') {
                updateMultipleParameters(selectedId, [
                    { paramIndex: state.scaleXIdx, update: { value: liveValues.scaleX } },
                    { paramIndex: state.scaleYIdx, update: { value: liveValues.scaleY } }
                ]);
            }

            setDragType(null);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [dragType, isValid, selectedId, updateMultipleParameters]);

    if (!isValid) return null;

    const safeBox = canvasRect || { left: 0, top: 0, width: 100, height: 100 };
    const vPanX = (panX - 50) * 2 + 50;
    const vPanY = 150 - (panY * 2);

    return (
        <div ref={containerRef} className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
            <div
                className="absolute pointer-events-none transition-all duration-300 ease-out"
                style={{
                    left: `${safeBox.left}%`,
                    top: `${safeBox.top}%`,
                    width: `${safeBox.width}%`,
                    height: `${safeBox.height}%`
                }}
            >
                <div
                    ref={gizmoRef}
                    className={`absolute pointer-events-auto cursor-move focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary group ${dragType ? '' : 'hover:z-50'}`}
                    style={{
                        left: `${vPanX}%`,
                        top: `${vPanY}%`,
                        width: `${scaleX}%`,
                        height: `${scaleY}%`,
                        transform: 'translate(-50%, -50%)',
                        border: '1px solid rgba(251, 0, 255, 0.6)'
                    }}
                    onPointerDown={(e) => handlePointerDown(e, 'pan')}
                    title="Pan"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
                        e.preventDefault();
                        e.stopPropagation();
                        commitHistory();
                        const step = e.shiftKey ? 5 : 1;
                        if (e.key === 'ArrowRight') updateParameter(selectedId!, panXIdx, { value: Math.max(0, Math.min(100, panX + step)) });
                        else if (e.key === 'ArrowLeft') updateParameter(selectedId!, panXIdx, { value: Math.max(0, Math.min(100, panX - step)) });
                        else if (e.key === 'ArrowUp') updateParameter(selectedId!, panYIdx, { value: Math.max(0, Math.min(100, panY + step)) });
                        else if (e.key === 'ArrowDown') updateParameter(selectedId!, panYIdx, { value: Math.max(0, Math.min(100, panY - step)) });
                    }}
                >

                    <GizmoHandle
                        title="Scale"
                        className="z-10 right-0 bottom-0 w-6 h-6 md:w-4 md:h-4 rounded-full translate-x-1/2 translate-y-1/2 bg-black border border-primary cursor-nwse-resize"
                        onPointerDown={(e) => handlePointerDown(e, 'scale')}
                        onKeyPress={(key, shift) => {
                            commitHistory();
                            const step = shift ? 5 : 1;
                            if (key === 'ArrowRight') updateParameter(selectedId!, scaleXIdx, { value: Math.max(0, Math.min(100, scaleX + step)) });
                            else if (key === 'ArrowLeft') updateParameter(selectedId!, scaleXIdx, { value: Math.max(0, Math.min(100, scaleX - step)) });
                            else if (key === 'ArrowUp') updateParameter(selectedId!, scaleYIdx, { value: Math.max(0, Math.min(100, scaleY - step)) });
                            else if (key === 'ArrowDown') updateParameter(selectedId!, scaleYIdx, { value: Math.max(0, Math.min(100, scaleY + step)) });
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

interface GizmoHandleProps {
    title: string;
    className: string;
    onPointerDown: (e: React.PointerEvent) => void;
    onKeyPress?: (key: string, shiftKey: boolean) => void;
    children?: React.ReactNode;
}

const GizmoHandle: React.FC<GizmoHandleProps> = memo(({ title, className, onPointerDown, onKeyPress, children }) => {
    return (
        <div
            className={`pointer-events-auto absolute flex outline-none focus-visible:ring-2 focus-visible:ring-primary ${className}`}
            onPointerDown={onPointerDown}
            title={title}
            tabIndex={0}
            onKeyDown={(e) => {
                if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
                e.preventDefault();
                e.stopPropagation();
                if (onKeyPress) onKeyPress(e.key, e.shiftKey);
            }}
        >
            {children}
        </div>
    );
});
