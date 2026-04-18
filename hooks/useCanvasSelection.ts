import React from 'react';
import { useEffectStore } from '../store/useEffectStore';
import { MASTER_ASPECT_RATIO } from '../constants';

/**
 * Hook that returns a pointer down handler capable of performing
 * "Drill-Down" selection logic on mathematically rendered WebGL shapes.
 */
export const useCanvasSelection = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
    return (e: React.PointerEvent<HTMLCanvasElement>) => {
        // 0. Get the actual rendered bounds of the canvas
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect || rect.width === 0 || rect.height === 0) return;

        // 1. Get click position relative to canvas box as percentages (0 - 100)
        let px = ((e.clientX - rect.left) / rect.width);
        let py = ((e.clientY - rect.top) / rect.height);

        // ── INVERSE VIEWPORT MAPPING (object-fit: cover) ──────────────────
        // Since the 16:9 Art is being cropped to fit the UI window, we must
        // remap the mouse UV [0..1] in screen-space back to the Art's [0..1] space.
        const ART_ASPECT = MASTER_ASPECT_RATIO;
        const WIN_ASPECT = rect.width / rect.height;

        if (WIN_ASPECT < ART_ASPECT) {
            // Window is narrower than Art (e.g. Square window vs 16:9 Art)
            // Art width is cropped.
            px = (px - 0.5) * (WIN_ASPECT / ART_ASPECT) + 0.5;
        } else {
            // Window is taller than Art (e.g. 21:9 monitor vs 16:9 Art)
            // Art height is cropped.
            py = (py - 0.5) * (ART_ASPECT / WIN_ASPECT) + 0.5;
        }

        // Convert to 0-100 range for the internal hitbox math
        px *= 100;
        py *= 100;

        const store = useEffectStore.getState();
        const effects = store.effects;
        const hitList: string[] = [];

        // 2. Iterate backwards (Top layer to bottom layer) building a "Hit List"
        for (let i = effects.length - 1; i >= 0; i--) {
            const effect = effects[i];

            // Only consider effects that have scale and pan parameters
            const scaleXParam = effect.params.find(p => p.param === 'Scale X');
            const scaleYParam = effect.params.find(p => p.param === 'Scale Y');
            const panXParam = effect.params.find(p => p.param === 'Pan X');
            const panYParam = effect.params.find(p => p.param === 'Pan Y');

            if (scaleXParam && scaleYParam && panXParam && panYParam) {
                const sx = scaleXParam.value * 2;
                const sy = scaleYParam.value * 2;
                const posX = panXParam.value;
                const posY = panYParam.value;

                // 3. Mirror the Gizmo visual transformation mathematics exactly
                const visualPanX = (posX - 50) * 2 + 50;
                const visualPanY = 150 - (posY * 2);

                const leftEdge = visualPanX - (sx / 2);
                const rightEdge = visualPanX + (sx / 2);
                const topEdge = visualPanY - (sy / 2);
                const bottomEdge = visualPanY + (sy / 2);

                // 4. Gather hits (topmost effect will be index 0)
                if (px >= leftEdge && px <= rightEdge && py >= topEdge && py <= bottomEdge) {
                    hitList.push(effect.id);
                }
            }
        }

        if (hitList.length > 0) {
            // Find the currently selected element if there is only one
            const currentSelectedId = store.selectedIds.size === 1 ? Array.from(store.selectedIds)[0] : null;
            const currentIndex = currentSelectedId ? hitList.indexOf(currentSelectedId) : -1;

            // "Drill-Down" Algorithm: cycle through hits backwards
            const nextIndex = currentIndex !== -1 ? (currentIndex + 1) % hitList.length : 0;

            if (e.shiftKey) {
                // Shift+click: add/remove the group from the existing selection
                store.toggleSelected(hitList[nextIndex], true);
            } else {
                // Normal click: replace selection with just this group
                store.toggleSelected(hitList[nextIndex], false);
            }
        } else {
            // If we clicked outside all effects, clear the selection
            store.clearSelection();
        }
    };
};
