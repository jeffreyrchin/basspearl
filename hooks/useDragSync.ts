import { useEffect } from 'react';
import { subscribeToDrag, LiveParamOverride } from '../services/dragOverride';

/**
 * A hook to easily subscribe to the high-performance 'Fast Track' drag override system.
 * This completely bypasses React re-renders, enabling native-speed 60fps UI updates
 * (like dragging sliders or the canvas gizmo).
 * 
 * @param effectId The ID of the effect being dragged.
 * @param paramIdx The index of the parameter being updated.
 * @param callback The function to run when the parameter is updated. It receives the new value (max).
 */

// Overload 1: Single Parameter Mode (Sliders)
export function useDragSync(
    effectId: string | undefined | null,
    paramIdx: number | undefined | null,
    callback: (value?: number) => void
): void;

// Overload 2: Multi-Parameter Mode (Gizmo)
export function useDragSync(
    effectId: string | undefined | null,
    paramIdx: null,
    callback: (params: LiveParamOverride[]) => void
): void;

// Implementation
export function useDragSync(
    effectId: string | undefined | null,
    paramIdx: number | undefined | null,
    callback: any
) {
    useEffect(() => {
        // Skip if there's no valid ID
        if (!effectId) return;

        // If a specific paramIdx is provided but it's invalid (e.g., -1), skip
        if (typeof paramIdx === 'number' && paramIdx < 0) return;

        return subscribeToDrag((id, params) => {
            if (id !== effectId) return;

            if (typeof paramIdx === 'number') {
                // Mode 1: Slider (Single Parameter)
                const override = params.find(p => p.index === paramIdx);
                if (!override) return;

                if (override.value !== undefined) {
                    callback(override.value);
                }
            } else {
                // Mode 2: Gizmo (All Parameters)
                // When paramIdx is null, we return the entire array of overrides
                callback(params);
            }
        });
    }, [effectId, paramIdx, callback]);
}
