import React, { useRef, useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useEffectStore } from '../store/useEffectStore';
import { setDragOverride, clearDragOverride } from '../services/dragOverride';
import { useDragSync } from '../hooks/useDragSync';
import { useCanvasSelection } from '../hooks/useCanvasSelection';

interface TransformGizmoProps {
    canvasRef: React.RefObject<HTMLCanvasElement>;
}

const SCALE_CORNERS = {
    br: { className: 'right-0 bottom-0 translate-x-1/2 translate-y-1/2', xDir: 1, yDir: 1 }, // moving br handle right and down increases scale x, increases scale y
    tr: { className: 'right-0 top-0 translate-x-1/2 -translate-y-1/2', xDir: 1, yDir: -1 }, // moving tr handle right and down increases scale x, decreases scale y
    bl: { className: 'left-0 bottom-0 -translate-x-1/2 translate-y-1/2', xDir: -1, yDir: 1 }, // moving bl handle right and down decreases scale x, increases scale y
    tl: { className: 'left-0 top-0 -translate-x-1/2 -translate-y-1/2', xDir: -1, yDir: -1 }, // moving tl handle right and down decreases scale x, decreases scale y
} as const;

type ScaleCornerId = keyof typeof SCALE_CORNERS;
type TransformType = 'pan' | 'rotate' | ScaleCornerId;

export const TransformGizmo: React.FC<TransformGizmoProps> = ({ canvasRef }) => {
    const handleCanvasPointerDown = useCanvasSelection(canvasRef);
    const updateParameter = useEffectStore(s => s.updateParameter);
    const updateMultipleParameters = useEffectStore(s => s.updateMultipleParameters);
    const commitHistory = useEffectStore(s => s.commitHistory);

    const selectedId = useEffectStore(s => s.selectedIds.size === 1 ? s.selectedIds.values().next().value : null);
    const effect = useEffectStore(s => s.effects.find(e => e.id === selectedId));

    // --- 1. Parameter Definitions ---
    const [panXIdx, panYIdx, scaleXIdx, scaleYIdx, rotationIdx] = useMemo(() => {
        if (!effect) return [-1, -1, -1, -1, -1];
        return [
            effect.params.findIndex(p => p.param === 'Pan X'),
            effect.params.findIndex(p => p.param === 'Pan Y'),
            effect.params.findIndex(p => p.param === 'Scale X'),
            effect.params.findIndex(p => p.param === 'Scale Y'),
            effect.params.findIndex(p => p.param === 'Rotation')
        ];
    }, [selectedId]);

    const isValid = effect && scaleXIdx !== -1 && scaleYIdx !== -1 && panXIdx !== -1 && panYIdx !== -1;

    const panX = isValid ? effect.params[panXIdx].value : 0;
    const panY = isValid ? effect.params[panYIdx].value : 0;
    const scaleX = isValid ? effect.params[scaleXIdx].value : 0;
    const scaleY = isValid ? effect.params[scaleYIdx].value : 0;
    const rotation = rotationIdx !== -1 ? effect.params[rotationIdx].value : 0;

    // --- 2. Element Refs and Canvas Math ---
    const containerRef = useRef<HTMLDivElement>(null);
    const gizmoRef = useRef<HTMLDivElement>(null);
    const [canvasRect, setCanvasRect] = useState<{ left: number, top: number, width: number, height: number } | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

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
        rotation: 0,
        centerX: 0, centerY: 0,
        startAngle: 0,
        panXIdx: -1, panYIdx: -1,
        scaleXIdx: -1, scaleYIdx: -1,
        rotationIdx: -1,
        xDir: 1, yDir: 1
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
            else if (p.index === scaleXIdx) gizmoRef.current!.style.width = `${p.value * 2}%`;
            else if (p.index === scaleYIdx) gizmoRef.current!.style.height = `${p.value * 2}%`;
            else if (p.index === rotationIdx) gizmoRef.current!.style.transform = `translate(-50%, -50%) rotate(${p.value * 3.6}deg)`;
        });
    }, [panXIdx, panYIdx, scaleXIdx, scaleYIdx, rotationIdx]));

    const getCurrentScale = () => {
        const fromScroll = !!timerRef.current;
        const currentScaleX = fromScroll ? dragStateRef.current.scaleX : scaleX;
        const currentScaleY = fromScroll ? dragStateRef.current.scaleY : scaleY;
        return { currentScaleX, currentScaleY };
    };

    // --- 5. Unified Drag Handlers ---
    const handlePointerDown = (e: React.PointerEvent, type: TransformType) => {
        e.preventDefault();
        e.stopPropagation();
        const { currentScaleX, currentScaleY } = getCurrentScale(); // 1. Capture truth
        flushScroll(); // 2. Clean up
        commitHistory();
        setDragType(type);

        const rect = canvasRef.current?.getBoundingClientRect() || containerRef.current?.getBoundingClientRect();
        const corner = type !== 'pan' ? SCALE_CORNERS[type] : null;

        const gRect = gizmoRef.current?.getBoundingClientRect();
        const cX = gRect ? gRect.left + gRect.width / 2 : 0;
        const cY = gRect ? gRect.top + gRect.height / 2 : 0;

        dragStateRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            containerW: rect?.width || 1,
            containerH: rect?.height || 1,
            panX, panY,
            scaleX: currentScaleX,
            scaleY: currentScaleY,
            rotation,
            centerX: cX,
            centerY: cY,
            startAngle: type === 'rotate' ? Math.atan2(e.clientY - cY, e.clientX - cX) : 0,
            panXIdx, panYIdx,
            scaleXIdx, scaleYIdx,
            rotationIdx,
            xDir: corner?.xDir ?? 1,
            yDir: corner?.yDir ?? 1
        };

        // Prime the drag override so the effect doesn't jump
        if (type === 'pan') {
            if (selectedId) setDragOverride(selectedId, [
                { index: panXIdx, value: panX },
                { index: panYIdx, value: panY }
            ]);
        } else if (type === 'rotate') {
            if (selectedId) setDragOverride(selectedId, [
                { index: rotationIdx, value: rotation }
            ]);
        } else { // Scale
            if (selectedId) setDragOverride(selectedId, [
                { index: scaleXIdx, value: dragStateRef.current.scaleX },
                { index: scaleYIdx, value: dragStateRef.current.scaleY }
            ]);
        }
    };

    const handleScroll = useCallback((e: WheelEvent) => {
        if (dragType) return;

        const target = e.target as HTMLElement;
        const container = target.closest?.('[data-section]') as HTMLElement;
        const section = container?.dataset.section;
        if (section !== 'viewport') return;

        e.preventDefault();
        e.stopPropagation();

        const state = dragStateRef.current;
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        } else {
            commitHistory();
            state.scaleX = scaleX;
            state.scaleY = scaleY;
            state.scaleXIdx = scaleXIdx;
            state.scaleYIdx = scaleYIdx;
        }
        timerRef.current = setTimeout(() => {
            flushScroll();
        }, 200);

        const zoomSpeed = 0.001;
        let factor = 1 - (e.deltaY * zoomSpeed);

        const minScale = 0.1;
        const maxScale = 100;

        // If growing, don't let factor be larger than the room remaining for the tighter axis
        if (factor > 1) {
            const roomX = maxScale / Math.max(state.scaleX, 0.001);
            const roomY = maxScale / Math.max(state.scaleY, 0.001);
            factor = Math.min(factor, roomX, roomY);
        }

        // If shrinking, don't let factor take us below our minimum (e.g. 1)
        else {
            const roomX = minScale / Math.max(state.scaleX, 0.001);
            const roomY = minScale / Math.max(state.scaleY, 0.001);
            factor = Math.max(factor, roomX, roomY);
        }

        state.scaleX *= factor;
        state.scaleY *= factor;

        setDragOverride(selectedId, [
            { index: scaleXIdx, value: state.scaleX },
            { index: scaleYIdx, value: state.scaleY }
        ]);

        if (gizmoRef.current) {
            gizmoRef.current.style.width = `${state.scaleX * 2}%`;
            gizmoRef.current.style.height = `${state.scaleY * 2}%`;
        }
    }, [dragType, selectedId, scaleX, scaleY, scaleXIdx, scaleYIdx]);

    const flushScroll = () => {
        if (!timerRef.current) return;
        setDragType(null);
        clearDragOverride();
        updateMultipleParameters(selectedId, [
            { paramIndex: scaleXIdx, update: { value: dragStateRef.current.scaleX } },
            { paramIndex: scaleYIdx, update: { value: dragStateRef.current.scaleY } }
        ]);
        clearTimeout(timerRef.current);
        timerRef.current = null;
    };

    useEffect(() => {
        if (!dragType || !isValid || !selectedId) return;

        const state = dragStateRef.current;

        // Keep track of the live values during the drag
        const liveValues = {
            panX: state.panX,
            panY: state.panY,
            scaleX: state.scaleX,
            scaleY: state.scaleY,
            rotation: state.rotation
        };

        const handlePointerMove = (e: PointerEvent) => {
            // Ensure scale always knows which way is "length" on the box, and pan always knows which way is "right" on your screen
            // This is done by calculating the delta X and Y in pixel space, and then converting them to normalized values (0.0-1.0)
            const state = dragStateRef.current;
            const dx = (e.clientX - state.startX); // raw delta X (in pixels)
            const dy = (e.clientY - state.startY); // raw delta Y (in pixels)
            const pxRaw = dx / state.containerW; // raw normalized delta X (0.0-1.0), relative to the screen/monitor
            const pyRaw = dy / state.containerH; // raw normalized delta Y (0.0-1.0), relative to the screen/monitor

            // Rotation compensation (in pixel space to ensure aspect-independence)
            const angle = (state.rotation / 100) * (Math.PI * 2); // convert rotation to radians
            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);
            const ldx = dx * cosA + dy * sinA; // local delta X (distance moved along the box's own horizontal axis)
            const ldy = dy * cosA - dx * sinA; // local delta Y (distance moved along the box's own vertical axis)
            const px = ldx / state.containerW; // projected normalized delta X (0.0-1.0), relative to the box edges
            const py = ldy / state.containerH; // projected normalized delta Y (0.0-1.0), relative to the box edges

            // Calculate the math for each specific drag type
            if (dragType === 'pan') {
                // Update live values
                liveValues.panX = Math.max(0, Math.min(100, state.panX + (pxRaw * 50)));
                liveValues.panY = Math.max(0, Math.min(100, state.panY - (pyRaw * 50)));

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
            } else if (dragType === 'rotate') {
                const currentAngle = Math.atan2(e.clientY - state.centerY, e.clientX - state.centerX);
                const deltaAngle = (currentAngle - state.startAngle) * (180 / Math.PI);

                // Rotation slider is 0-100 covering 360 degrees. 
                // newRot = oldRot + (delta / 3.6). We use mod 100 to loop correctly.
                liveValues.rotation = (state.rotation + (deltaAngle / 3.6) + 100) % 100;

                setDragOverride(selectedId, [
                    { index: state.rotationIdx, value: liveValues.rotation }
                ]);

                if (gizmoRef.current) {
                    gizmoRef.current.style.transform = `translate(-50%, -50%) rotate(${liveValues.rotation * 3.6}deg)`;
                }
            } else { // Scale
                // Update live values using the xDir/yDir multipliers
                liveValues.scaleX = Math.max(0, Math.min(100, state.scaleX + (px * 100 * state.xDir)));
                liveValues.scaleY = Math.max(0, Math.min(100, state.scaleY + (py * 100 * state.yDir)));

                // Update canvas directly
                setDragOverride(selectedId, [
                    { index: state.scaleXIdx, value: liveValues.scaleX },
                    { index: state.scaleYIdx, value: liveValues.scaleY }
                ]);

                // Update gizmo size
                if (gizmoRef.current) {
                    gizmoRef.current.style.width = `${liveValues.scaleX * 2}%`;
                    gizmoRef.current.style.height = `${liveValues.scaleY * 2}%`;
                }
            }
        };

        const handlePointerUp = (e: PointerEvent) => {
            clearDragOverride();

            // Save the exact final location/scale to the store
            if (dragType === 'pan') {
                // If the mouse didn't move much, treat it as a drill-down click
                const dist = Math.sqrt(Math.pow(e.clientX - state.startX, 2) + Math.pow(e.clientY - state.startY, 2));
                if (dist < 3) handleCanvasPointerDown(e as any);

                updateMultipleParameters(selectedId, [
                    { paramIndex: state.panXIdx, update: { value: liveValues.panX } },
                    { paramIndex: state.panYIdx, update: { value: liveValues.panY } }
                ]);
            } else if (dragType === 'rotate') {
                updateParameter(selectedId, state.rotationIdx, { value: liveValues.rotation });
            } else { // Scale
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

    useEffect(() => {
        if (!isValid || !selectedId) return;

        window.addEventListener('wheel', handleScroll, { passive: false });
        return () => {
            window.removeEventListener('wheel', handleScroll);
        }
    }, [isValid, selectedId, handleScroll]);

    if (!isValid) return null;

    const safeBox = canvasRect || { left: 0, top: 0, width: 100, height: 100 };
    const vPanX = (panX - 50) * 2 + 50;
    const vPanY = 150 - (panY * 2);

    return (
        <div ref={containerRef} className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
            {/* Ghost Shell: Canvas-sized container for the gizmo (makes gizmo calculations relative to the canvas) */}
            <div
                className="absolute pointer-events-none transition-all duration-300 ease-out"
                style={{
                    left: `${safeBox.left}%`,
                    top: `${safeBox.top}%`,
                    width: `${safeBox.width}%`,
                    height: `${safeBox.height}%`
                }}
            >
                {/* The actual gizmo */}
                <div
                    ref={gizmoRef}
                    className={`absolute pointer-events-auto cursor-move focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary group ${dragType ? '' : 'hover:z-50'}`}
                    style={{
                        left: `${vPanX}%`,
                        top: `${vPanY}%`,
                        width: `${scaleX * 2}%`,
                        height: `${scaleY * 2}%`,
                        transform: `translate(-50%, -50%) rotate(${rotation * 3.6}deg)`,
                        border: '1px solid rgba(251, 0, 255, 0.6)'
                    }}
                    onPointerDown={(e) => handlePointerDown(e, 'pan')}
                    title="Pan"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
                        e.preventDefault();
                        e.stopPropagation();
                        flushScroll();
                        commitHistory();
                        const step = e.shiftKey ? 5 : 1;
                        if (e.key === 'ArrowRight') updateParameter(selectedId!, panXIdx, { value: Math.max(0, Math.min(100, panX + step)) });
                        else if (e.key === 'ArrowLeft') updateParameter(selectedId!, panXIdx, { value: Math.max(0, Math.min(100, panX - step)) });
                        else if (e.key === 'ArrowUp') updateParameter(selectedId!, panYIdx, { value: Math.max(0, Math.min(100, panY + step)) });
                        else if (e.key === 'ArrowDown') updateParameter(selectedId!, panYIdx, { value: Math.max(0, Math.min(100, panY - step)) });
                    }}
                >
                    {/* Rotation Handle */}
                    {rotationIdx !== -1 && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full pb-4">
                            <GizmoHandle
                                title="Rotate"
                                className="relative w-8 h-8 md:w-5 md:h-5 -mt-1 rounded-full bg-black border border-primary"
                                onPointerDown={(e) => handlePointerDown(e, 'rotate')}
                                onKeyPress={(key, shift) => {
                                    flushScroll();
                                    commitHistory();
                                    const step = shift ? 5 : 1;
                                    if (key === 'ArrowRight') updateParameter(selectedId!, rotationIdx, { value: (rotation + step + 100) % 100 });
                                    else if (key === 'ArrowLeft') updateParameter(selectedId!, rotationIdx, { value: (rotation - step + 100) % 100 });
                                }}
                            />
                        </div>
                    )}

                    {Object.entries(SCALE_CORNERS).map(([id, corner]) => (
                        <GizmoHandle
                            key={id}
                            title="Scale"
                            className={`z-10 absolute w-7 h-7 md:w-4 md:h-4 rounded-full bg-black border border-primary ${corner.className}`}
                            onPointerDown={(e) => handlePointerDown(e, id as ScaleCornerId)}
                            onKeyPress={(key, shift) => {
                                const { currentScaleX, currentScaleY } = getCurrentScale(); // 1. Capture truth
                                flushScroll(); // 2. Clean up
                                commitHistory();
                                const step = shift ? 5 : 1;
                                // Keyboard arrows map logically based on mx/my multipliers
                                if (key === 'ArrowRight') updateParameter(selectedId!, scaleXIdx, { value: Math.max(0, Math.min(100, currentScaleX + step * corner.xDir)) });
                                else if (key === 'ArrowLeft') updateParameter(selectedId!, scaleXIdx, { value: Math.max(0, Math.min(100, currentScaleX - step * corner.xDir)) });
                                else if (key === 'ArrowUp') updateParameter(selectedId!, scaleYIdx, { value: Math.max(0, Math.min(100, currentScaleY - step * corner.yDir)) });
                                else if (key === 'ArrowDown') updateParameter(selectedId!, scaleYIdx, { value: Math.max(0, Math.min(100, currentScaleY + step * corner.yDir)) });
                            }}
                        />
                    ))}
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
            className={`pointer-events-auto absolute flex outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-primary ${className}`}
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
