import React, { useRef, useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useEffectStore } from '../store/useEffectStore';
import { dragOverride, setDragOverride, clearDragOverride } from '../services/dragOverride';
import { calculateRadialFactor, getResurrectionScales, calculateRelativeUpdate, calculateRelativeScaleUpdate, calculateRotationValue } from '../services/transformMath';
import { calculateVirtualCanvasRect, mapPanToCSS } from '../services/canvasMath';
import { useDragSync } from '../hooks/useDragSync';
import { useCanvasSelection } from '../hooks/useCanvasSelection';
import { MASTER_ASPECT_RATIO } from '../constants';

interface TransformGizmoProps {
    effectId: string;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    flushGlobalScroll: () => void;
    setFlushGlobalScroll: (fn: () => void) => void;
}

const SCALE_CORNERS = {
    br: { className: 'right-0 bottom-0 translate-x-1/2 translate-y-1/2', xDir: 1, yDir: 1 }, // moving br handle right and down increases scale x, increases scale y
    tr: { className: 'right-0 top-0 translate-x-1/2 -translate-y-1/2', xDir: 1, yDir: -1 }, // moving tr handle right and down increases scale x, decreases scale y
    bl: { className: 'left-0 bottom-0 -translate-x-1/2 translate-y-1/2', xDir: -1, yDir: 1 }, // moving bl handle right and down decreases scale x, increases scale y
    tl: { className: 'left-0 top-0 -translate-x-1/2 -translate-y-1/2', xDir: -1, yDir: -1 }, // moving tl handle right and down decreases scale x, decreases scale y
} as const;

type ScaleCornerId = keyof typeof SCALE_CORNERS;
type TransformType = 'pan' | 'rotate' | ScaleCornerId;

export const TransformGizmo: React.FC<TransformGizmoProps> = ({ effectId, canvasRef, flushGlobalScroll, setFlushGlobalScroll }) => {
    const handleCanvasPointerDown = useCanvasSelection(canvasRef);
    const updateParameter = useEffectStore(s => s.updateParameter);
    const updateMultipleParameters = useEffectStore(s => s.updateMultipleParameters);
    const commitHistory = useEffectStore(s => s.commitHistory);

    const effect = useEffectStore(s => s.effects.find(e => e.id === effectId));

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
    }, [effectId, effect]);

    const isValid = effect && scaleXIdx !== -1 && scaleYIdx !== -1 && panXIdx !== -1 && panYIdx !== -1;

    const panX = isValid ? effect.params[panXIdx].value : 0;
    const panY = isValid ? effect.params[panYIdx].value : 0;
    const scaleX = isValid ? effect.params[scaleXIdx].value : 0;
    const scaleY = isValid ? effect.params[scaleYIdx].value : 0;
    const rotation = isValid && rotationIdx !== -1 ? effect.params[rotationIdx].value : 0;

    // --- 2. Element Refs and Canvas Math ---
    const containerRef = useRef<HTMLDivElement>(null);
    const gizmoRef = useRef<HTMLDivElement>(null);
    const [canvasRect, setCanvasRect] = useState<{ left: number, top: number, width: number, height: number } | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!containerRef.current || !canvasRef.current) return;

        const updateRect = () => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (!canvas || !container) return;

            const cRect = canvas.getBoundingClientRect();
            const pRect = container.getBoundingClientRect();

            if (pRect.width > 0 && pRect.height > 0) {
                const virtualRect = calculateVirtualCanvasRect(cRect, pRect, MASTER_ASPECT_RATIO);
                setCanvasRect(virtualRect);
            }
        };

        updateRect();

        const observer = new ResizeObserver(updateRect);

        if (containerRef.current.parentElement) {
            observer.observe(containerRef.current.parentElement);
        }

        observer.observe(canvasRef.current);

        return () => observer.disconnect();
    }, [isValid, canvasRef, containerRef]);

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
        xDir: 1, yDir: 1,
        aspectLocked: false,
        aspectRatio: 1,
        startDistance: 1,
        siblingStarts: undefined as Map<string, { scaleX: number; scaleY: number; sxIdx: number; syIdx: number }> | undefined
    });

    // --- 4. Unified Fast-Track Sync ---
    // Listens to the sliders in the sidebar and moves the Gizmo without re-rendering
    const isGizmoListening = effectId && !dragType;

    useDragSync(isGizmoListening ? effectId : null, null, useCallback((params) => {
        if (!gizmoRef.current) return;

        params.forEach(p => {
            if (p.value === undefined) return;

            // Update gizmo
            const cssPos = mapPanToCSS(p.index === panXIdx ? p.value : panX, p.index === panYIdx ? p.value : panY);
            if (p.index === panXIdx) gizmoRef.current!.style.left = `${cssPos.x}%`;
            else if (p.index === panYIdx) gizmoRef.current!.style.top = `${cssPos.y}%`;
            else if (p.index === scaleXIdx) gizmoRef.current!.style.width = `${p.value * 2}%`;
            else if (p.index === scaleYIdx) gizmoRef.current!.style.height = `${p.value * 2}%`;
            else if (p.index === rotationIdx) gizmoRef.current!.style.transform = `translate(-50%, -50%) rotate(${p.value * 3.6}deg)`;
        });
    }, [panXIdx, panYIdx, scaleXIdx, scaleYIdx, rotationIdx]));

    const getCurrentValues = () => {
        let cPanX = panX, cPanY = panY, cScaleX = scaleX, cScaleY = scaleY, cRot = rotation;

        // 1. Freshest store state (bypasses component closure staleness)
        const freshEffect = useEffectStore.getState().effects.find(e => e.id === effectId);
        if (freshEffect) {
            cPanX = panXIdx !== -1 ? freshEffect.params[panXIdx].value : cPanX;
            cPanY = panYIdx !== -1 ? freshEffect.params[panYIdx].value : cPanY;
            cScaleX = scaleXIdx !== -1 ? freshEffect.params[scaleXIdx].value : cScaleX;
            cScaleY = scaleYIdx !== -1 ? freshEffect.params[scaleYIdx].value : cScaleY;
            cRot = rotationIdx !== -1 ? freshEffect.params[rotationIdx].value : cRot;
        }

        // 2. Overrides (highest priority, captures active scroll/drag without waiting for a re-render)
        const overrides = dragOverride.overrides.get(effectId);
        if (overrides) {
            overrides.forEach(o => {
                if (o.index === panXIdx && o.value !== undefined) cPanX = o.value;
                if (o.index === panYIdx && o.value !== undefined) cPanY = o.value;
                if (o.index === scaleXIdx && o.value !== undefined) cScaleX = o.value;
                if (o.index === scaleYIdx && o.value !== undefined) cScaleY = o.value;
                if (o.index === rotationIdx && o.value !== undefined) cRot = o.value;
            });
        }

        return { currentPanX: cPanX, currentPanY: cPanY, currentScaleX: cScaleX, currentScaleY: cScaleY, currentRotation: cRot, aspectLocked: freshEffect?.aspectLocked, aspectRatio: freshEffect?.aspectRatio };
    };

    // Only the "last selected" gizmo claims the scroll wheel to avoid conflicts
    // when multiple gizmos are rendered simultaneously.
    const isScrollOwner = useEffectStore(s => Array.from(s.selectedIds).at(-1) === effectId);

    // --- 5. Unified Drag Handlers ---
    const handlePointerDown = (e: React.PointerEvent, type: TransformType) => {
        e.preventDefault();
        e.stopPropagation();
        const { currentPanX, currentPanY, currentScaleX, currentScaleY, currentRotation, aspectLocked, aspectRatio } = getCurrentValues(); // 1. Capture absolute truth
        flushGlobalScroll(); // 2. Clean up
        commitHistory();
        setDragType(type);

        const rect = canvasRef.current?.getBoundingClientRect() || containerRef.current?.getBoundingClientRect();
        const corner = type !== 'pan' && type !== 'rotate' ? SCALE_CORNERS[type] : null;

        const gRect = gizmoRef.current?.getBoundingClientRect();
        const cX = gRect ? gRect.left + gRect.width / 2 : 0;
        const cY = gRect ? gRect.top + gRect.height / 2 : 0;

        dragStateRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            containerW: rect?.width || 1,
            containerH: rect?.height || 1,
            panX: currentPanX, panY: currentPanY,
            scaleX: currentScaleX,
            scaleY: currentScaleY,
            rotation: currentRotation,
            centerX: cX,
            centerY: cY,
            startAngle: type === 'rotate' ? Math.atan2(e.clientY - cY, e.clientX - cX) : 0,
            panXIdx, panYIdx,
            scaleXIdx, scaleYIdx,
            rotationIdx,
            xDir: corner?.xDir ?? 1,
            yDir: corner?.yDir ?? 1,
            aspectLocked: !!aspectLocked,
            aspectRatio: aspectRatio || 1,
            startDistance: Math.sqrt(Math.pow(e.clientX - cX, 2) + Math.pow(e.clientY - cY, 2)),
            siblingStarts: undefined
        };

        // Prime the drag override so the effect doesn't jump
        if (type === 'pan') {
            if (effectId) setDragOverride(effectId, [
                { index: panXIdx, value: currentPanX },
                { index: panYIdx, value: currentPanY }
            ]);
        } else if (type === 'rotate') {
            if (effectId) setDragOverride(effectId, [
                { index: rotationIdx, value: currentRotation }
            ]);
        } else { // Scale
            if (effectId) setDragOverride(effectId, [
                { index: scaleXIdx, value: currentScaleX },
                { index: scaleYIdx, value: currentScaleY }
            ]);
        }
    };

    const flushScroll = useCallback(() => {
        if (!timerRef.current) return;
        setDragType(null);
        clearDragOverride();

        // Commit self
        updateMultipleParameters(effectId, [
            { paramIndex: scaleXIdx, update: { value: dragStateRef.current.scaleX } },
            { paramIndex: scaleYIdx, update: { value: dragStateRef.current.scaleY } }
        ]);

        // Commit siblings
        if (dragStateRef.current.siblingStarts) {
            dragStateRef.current.siblingStarts.forEach((sib, sibId) => {
                updateMultipleParameters(sibId, [
                    { paramIndex: sib.sxIdx, update: { value: sib.scaleX } },
                    { paramIndex: sib.syIdx, update: { value: sib.scaleY } }
                ]);
            });
            dragStateRef.current.siblingStarts = undefined;
        }

        clearTimeout(timerRef.current);
        timerRef.current = null;
        setFlushGlobalScroll(() => { });
    }, [effectId, scaleXIdx, scaleYIdx, updateMultipleParameters]);

    const handleScroll = useCallback((e: WheelEvent) => {
        if (dragOverride.overrides.size > 0 && !timerRef.current) return;
        const target = e.target as HTMLElement;
        const container = target.closest?.('[data-section]') as HTMLElement;
        const section = container?.dataset.section;
        if (section !== 'viewport') return;

        e.preventDefault();
        e.stopPropagation();

        const state = dragStateRef.current;
        const allEffects = useEffectStore.getState().effects;
        const allSelectedIds = Array.from(useEffectStore.getState().selectedIds);

        if (timerRef.current) {
            clearTimeout(timerRef.current);
        } else {
            setFlushGlobalScroll(() => { flushScroll(); });
            // --- First frame of scroll sequence: Initialize state for self AND siblings ---
            const { currentScaleX, currentScaleY, aspectRatio } = getCurrentValues();
            commitHistory();
            state.scaleX = currentScaleX;
            state.scaleY = currentScaleY;
            state.scaleXIdx = scaleXIdx;
            state.scaleYIdx = scaleYIdx;
            state.aspectRatio = aspectRatio || 1;

            // Capture sibling starting scales
            state.siblingStarts = new Map<string, { scaleX: number; scaleY: number; sxIdx: number; syIdx: number }>();
            allSelectedIds.forEach(sibId => {
                if (sibId === effectId) return;
                const sib = allEffects.find(e => e.id === sibId);
                if (!sib) return;
                const sxIdx = sib.params.findIndex(p => p.param === 'Scale X');
                const syIdx = sib.params.findIndex(p => p.param === 'Scale Y');
                if (sxIdx === -1 || syIdx === -1) return;
                state.siblingStarts!.set(sibId, {
                    scaleX: sib.params[sxIdx].value,
                    scaleY: sib.params[syIdx].value,
                    sxIdx,
                    syIdx
                });
            });
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

        // If shrinking, don't let factor take us below our minimum (e.g. 0.1)
        // But if an axis is ALREADY at 0, don't use it to force the factor up to 100
        else {
            const roomX = state.scaleX > minScale ? minScale / state.scaleX : 0;
            const roomY = state.scaleY > minScale ? minScale / state.scaleY : 0;
            factor = Math.max(factor, roomX, roomY);
        }

        // 1. Calculate the new scales
        let newX = state.scaleX * factor;
        let newY = state.scaleY * factor;

        // Fallback for 0,0 case: allow scaling up from zero using stored ratio
        if (state.scaleX === 0 && state.scaleY === 0 && factor > 1) {
            const resurrection = getResurrectionScales(factor, state.aspectRatio);
            newX = resurrection.scaleX;
            newY = resurrection.scaleY;
        }

        state.scaleX = Math.max(0, Math.min(100, newX));
        state.scaleY = Math.max(0, Math.min(100, newY));

        // --- Apply and Broadcast Factor ---
        setDragOverride(effectId, [
            { index: scaleXIdx, value: state.scaleX },
            { index: scaleYIdx, value: state.scaleY }
        ]);

        if (state.siblingStarts) {
            state.siblingStarts.forEach((sib, sibId) => {
                sib.scaleX = calculateRelativeScaleUpdate(factor, sib.scaleX);
                sib.scaleY = calculateRelativeScaleUpdate(factor, sib.scaleY);
                setDragOverride(sibId, [
                    { index: sib.sxIdx, value: sib.scaleX },
                    { index: sib.syIdx, value: sib.scaleY }
                ]);
            });
        }

        if (gizmoRef.current) {
            gizmoRef.current.style.width = `${state.scaleX * 2}%`;
            gizmoRef.current.style.height = `${state.scaleY * 2}%`;
        }
    }, [dragType, effectId, scaleX, scaleY, scaleXIdx, scaleYIdx, commitHistory, flushScroll]);

    useEffect(() => {
        if (!dragType || !isValid || !effectId) return;

        // Gather sibling selected effects that also have the relevant parameters
        // so we can broadcast drag deltas to all selected gizmos simultaneously
        const allEffects = useEffectStore.getState().effects;
        const allSelectedIds = [...useEffectStore.getState().selectedIds];

        // Capture each sibling's starting pan values at drag-start (like state.panX for the primary)
        // so we can compute pan overrides relative to a fixed origin each frame.
        const siblingStarts = new Map<string, { panX: number; panY: number; panXIdx: number; panYIdx: number }>();
        allSelectedIds.forEach(sibId => {
            if (sibId === effectId) return;
            const sib = allEffects.find(e => e.id === sibId);
            if (!sib) return;
            const sxIdx = sib.params.findIndex(p => p.param === 'Pan X');
            const syIdx = sib.params.findIndex(p => p.param === 'Pan Y');
            if (sxIdx === -1 || syIdx === -1) return;
            siblingStarts.set(sibId, {
                panX: sib.params[sxIdx].value,
                panY: sib.params[syIdx].value,
                panXIdx: sxIdx,
                panYIdx: syIdx
            });
        });

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
                setDragOverride(effectId, [
                    { index: state.panXIdx, value: liveValues.panX },
                    { index: state.panYIdx, value: liveValues.panY }
                ]);

                // Broadcast pan delta to all other selected effects
                siblingStarts.forEach(({ panX: startX, panY: startY, panXIdx: sxIdx, panYIdx: syIdx }, sibId) => {
                    setDragOverride(sibId, [
                        { index: sxIdx, value: Math.max(0, Math.min(100, startX + (pxRaw * 50))) },
                        { index: syIdx, value: Math.max(0, Math.min(100, startY - (pyRaw * 50))) }
                    ]);
                });

                // Update gizmo position
                const cssPos = mapPanToCSS(liveValues.panX, liveValues.panY);
                if (gizmoRef.current) {
                    gizmoRef.current.style.left = `${cssPos.x}%`;
                    gizmoRef.current.style.top = `${cssPos.y}%`;
                }
            } else if (dragType === 'rotate') {
                liveValues.rotation = calculateRotationValue(state.centerX, state.centerY, state.startAngle, state.rotation, e.clientX, e.clientY);

                setDragOverride(effectId, [
                    { index: state.rotationIdx, value: liveValues.rotation }
                ]);

                if (gizmoRef.current) {
                    gizmoRef.current.style.transform = `translate(-50%, -50%) rotate(${liveValues.rotation * 3.6}deg)`;
                }
            } else { // Scale
                if (state.aspectLocked) {
                    // --- Distance-Based Proportional Scaling ---
                    // This eliminates "teleporting" by using a single radial factor 
                    // instead of switching between X and Y axis deltas.
                    const factor = calculateRadialFactor(state.centerX, state.centerY, state.startX, state.startY, e.clientX, e.clientY);

                    let newX = state.scaleX * factor;
                    let newY = state.scaleY * factor;

                    // Fallback for 0,0 case: allow growing from zero using stored ratio
                    if (state.scaleX === 0 && state.scaleY === 0 && factor > 1) {
                        const resurrection = getResurrectionScales(factor, state.aspectRatio);
                        newX = resurrection.scaleX;
                        newY = resurrection.scaleY;
                    }

                    liveValues.scaleX = Math.max(0, Math.min(100, newX));
                    liveValues.scaleY = Math.max(0, Math.min(100, newY));
                } else {
                    // --- Independent Scaling ---
                    liveValues.scaleX = Math.max(0, Math.min(100, state.scaleX + (px * 100 * state.xDir)));
                    liveValues.scaleY = Math.max(0, Math.min(100, state.scaleY + (py * 100 * state.yDir)));
                }

                // Update canvas directly
                setDragOverride(effectId, [
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

                updateMultipleParameters(effectId, [
                    { paramIndex: state.panXIdx, update: { value: liveValues.panX } },
                    { paramIndex: state.panYIdx, update: { value: liveValues.panY } }
                ]);

                // Commit pan to all other selected siblings
                siblingStarts.forEach(({ panX: startX, panY: startY, panXIdx: sxIdx, panYIdx: syIdx }, sibId) => {
                    const finalX = calculateRelativeUpdate(liveValues.panX, startX, state.panX);
                    const finalY = calculateRelativeUpdate(liveValues.panY, startY, state.panY);
                    updateMultipleParameters(sibId, [
                        { paramIndex: sxIdx, update: { value: finalX } },
                        { paramIndex: syIdx, update: { value: finalY } }
                    ]);
                });
            } else if (dragType === 'rotate') {
                updateParameter(effectId, state.rotationIdx, { value: liveValues.rotation });
            } else { // Scale
                updateMultipleParameters(effectId, [
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
    }, [dragType, isValid, effectId, updateMultipleParameters, updateParameter]);

    useEffect(() => {
        if (!isValid || !effectId || !isScrollOwner) return;

        window.addEventListener('wheel', handleScroll, { passive: false });
        return () => {
            window.removeEventListener('wheel', handleScroll);
        }
    }, [isValid, effectId, isScrollOwner, handleScroll]);

    if (!isValid) return null;

    const safeBox = canvasRect || { left: 0, top: 0, width: 100, height: 100 };
    const cssPos = mapPanToCSS(panX, panY);

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
                    className={`absolute pointer-events-auto cursor-move border border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary group ${dragType ? '' : 'hover:z-50'}`}
                    style={{
                        left: `${cssPos.x}%`,
                        top: `${cssPos.y}%`,
                        width: `${scaleX * 2}%`,
                        height: `${scaleY * 2}%`,
                        transform: `translate(-50%, -50%) rotate(${rotation * 3.6}deg)`
                    }}
                    onPointerDown={(e) => handlePointerDown(e, 'pan')}
                    title="Pan"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
                        e.preventDefault();
                        e.stopPropagation();
                        const { currentPanX, currentPanY } = getCurrentValues();
                        flushGlobalScroll();
                        commitHistory();
                        const step = e.shiftKey ? 5 : 1;
                        if (e.key === 'ArrowRight') updateParameter(effectId!, panXIdx, { value: Math.max(0, Math.min(100, currentPanX + step)) });
                        else if (e.key === 'ArrowLeft') updateParameter(effectId!, panXIdx, { value: Math.max(0, Math.min(100, currentPanX - step)) });
                        else if (e.key === 'ArrowUp') updateParameter(effectId!, panYIdx, { value: Math.max(0, Math.min(100, currentPanY + step)) });
                        else if (e.key === 'ArrowDown') updateParameter(effectId!, panYIdx, { value: Math.max(0, Math.min(100, currentPanY - step)) });
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
                                    const { currentRotation } = getCurrentValues();
                                    flushGlobalScroll();
                                    commitHistory();
                                    const step = shift ? 5 : 1;
                                    if (key === 'ArrowRight') updateParameter(effectId!, rotationIdx, { value: (currentRotation + step + 100) % 100 });
                                    else if (key === 'ArrowLeft') updateParameter(effectId!, rotationIdx, { value: (currentRotation - step + 100) % 100 });
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
                                const { currentScaleX, currentScaleY, aspectLocked } = getCurrentValues();
                                flushGlobalScroll();
                                commitHistory();
                                const step = shift ? 5 : 1;
                                const ratio = currentScaleX / Math.max(currentScaleY, 0.001);

                                if (aspectLocked) {
                                    // Proportional Keyboard Scaling
                                    let nextX = currentScaleX;
                                    let nextY = currentScaleY;

                                    if (key === 'ArrowRight' || key === 'ArrowUp') {
                                        nextX = Math.min(100, currentScaleX + step);
                                        nextY = nextX / ratio;
                                        if (nextY > 100) {
                                            nextY = 100;
                                            nextX = nextY * ratio;
                                        }
                                    } else {
                                        nextX = Math.max(0, currentScaleX - step);
                                        nextY = nextX / ratio;
                                    }

                                    updateMultipleParameters(effectId!, [
                                        { paramIndex: scaleXIdx, update: { value: nextX } },
                                        { paramIndex: scaleYIdx, update: { value: nextY } }
                                    ]);
                                } else {
                                    // Independent Keyboard Scaling
                                    if (key === 'ArrowRight') updateParameter(effectId!, scaleXIdx, { value: Math.max(0, Math.min(100, currentScaleX + step * corner.xDir)) });
                                    else if (key === 'ArrowLeft') updateParameter(effectId!, scaleXIdx, { value: Math.max(0, Math.min(100, currentScaleX - step * corner.xDir)) });
                                    else if (key === 'ArrowUp') updateParameter(effectId!, scaleYIdx, { value: Math.max(0, Math.min(100, currentScaleY - step * corner.yDir)) });
                                    else if (key === 'ArrowDown') updateParameter(effectId!, scaleYIdx, { value: Math.max(0, Math.min(100, currentScaleY + step * corner.yDir)) });
                                }
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
