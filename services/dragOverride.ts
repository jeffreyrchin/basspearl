/**
 * A module-level mutable object that holds "live" parameter values during a
 * Gizmo drag — bypassing React and Zustand entirely.
 *
 * Pattern:
 *   pointermove  → write here          (zero React overhead, zero re-renders)
 *   pointerup    → commit to Zustand   (exactly ONE React re-render)
 *   GlitchEngine → reads here first, falls back to effect.params
 *   useRenderLoop → registers requestRender so Gizmo can trigger a draw
 */

export interface LiveParamOverride {
    index: number;
    value?: number;
    min?: number;
}

interface DragOverrideState {
    effectId: string | null;
    params: LiveParamOverride[];
    /** Registered by useRenderLoop so the Gizmo can request a canvas redraw
     *  without touching React state at all. */
    requestRender: (() => void) | null;
}

export const dragOverride: DragOverrideState = {
    effectId: null,
    params: [],
    requestRender: null,
};

type DragListener = (effectId: string, params: LiveParamOverride[]) => void;
const listeners = new Set<DragListener>();

// Allows the UI to subscribe to drag events
export function subscribeToDrag(fn: DragListener) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

/** Called on every pointermove. Zero React cost. Automatically requests a redraw. */
export function setDragOverride(effectId: string, params: LiveParamOverride[]): void {
    dragOverride.effectId = effectId;
    dragOverride.params = params;
    // Kick the render loop without going through React at all
    dragOverride.requestRender?.();
    // Notify UI subscribers (e.g. sliders)
    listeners.forEach(fn => fn(effectId, params));
}

/** Called once on pointerup, after committing final values to the store. */
export function clearDragOverride(): void {
    dragOverride.effectId = null;
    dragOverride.params = [];
}
