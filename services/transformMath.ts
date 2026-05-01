/**
 * Pure mathematical functions for handling proportional scaling,
 * aspect ratio locking, and resurrection from zero-scale.
 * 
 * These functions are decoupled from React and state, making them 
 * perfectly suited for unit testing.
 */

/**
 * Calculates a robust aspect ratio (X/Y) from two scale values.
 * Handles the 0,0 case by falling back to a provided ratio.
 */
export function getSafeAspectRatio(scaleX: number, scaleY: number, fallbackRatio?: number): number {
    if (scaleX === 0 && scaleY === 0) return fallbackRatio || 1;
    
    // We prevent division by zero here, but the result might still be 0.
    // Callers using this for division should use getLinkedScale which adds a safe floor.
    return scaleX / Math.max(scaleY, 0.001);
}

/**
 * Determines if a drag operation should temporarily decouple the axes.
 * This happens when one axis is 0, allowing the user to "pull" it out
 * of zero without causing the other axis to jump to infinity.
 */
export function shouldDecoupleScale(currentX: number, currentY: number, draggingX: boolean): boolean {
    // If both are zero, we stay coupled (resurrection mode)
    if (currentX === 0 && currentY === 0) return false;
    
    // If only the axis we are dragging is 0, decouple to allow thickening
    if (draggingX && currentX === 0) return true;
    if (!draggingX && currentY === 0) return true;
    
    return false;
}

/**
 * Calculates what the "other" axis should be to maintain a locked proportion.
 * Applies clamping and prevents division-by-zero jumps.
 */
export function getLinkedScale(val: number, ratio: number, isDraggingX: boolean): number {
    // Use a tiny floor for the ratio to prevent Infinity jumps
    const safeRatio = Math.max(ratio, 0.001);
    const result = isDraggingX ? val / safeRatio : val * safeRatio;
    return Math.max(0, Math.min(100, result));
}

/**
 * Logic for "resurrecting" an image from 0,0 scale.
 * Converts a radial factor into X and Y growth based on aspect ratio.
 */
export function getResurrectionScales(factor: number, aspectRatio: number): { scaleX: number, scaleY: number } {
    if (factor <= 1) return { scaleX: 0, scaleY: 0 };
    
    // factor-1 determines how much we've dragged away from center
    // 50 is an arbitrary base scale for the 'first appearance'
    const growth = (factor - 1) * 50;
    
    return {
        scaleX: Math.max(0, Math.min(100, growth * aspectRatio)),
        scaleY: Math.max(0, Math.min(100, growth))
    };
}

/**
 * Calculates the scale factor based on the distance from center.
 */
export function calculateRadialFactor(
    centerX: number, 
    centerY: number, 
    startX: number, 
    startY: number, 
    currentX: number, 
    currentY: number
): number {
    const startDist = Math.sqrt(Math.pow(startX - centerX, 2) + Math.pow(startY - centerY, 2));
    const currentDist = Math.sqrt(Math.pow(currentX - centerX, 2) + Math.pow(currentY - centerY, 2));
    
    // Prevents Infinity if starting exactly at center
    return currentDist / Math.max(startDist, 1);
}

/**
 * Calculates a relative update for a sibling parameter (additive).
 * Used for panning multiple effects together.
 */
export function calculateRelativeUpdate(currentBase: number, startBase: number, siblingStart: number): number {
    const delta = currentBase - startBase;
    return Math.max(0, Math.min(100, siblingStart + delta));
}

/**
 * Calculates a relative scale update for a sibling (multiplicative).
 */
export function calculateRelativeScaleUpdate(factor: number, siblingStart: number): number {
    return Math.max(0, Math.min(100, siblingStart * factor));
}

/**
 * Calculates a new rotation value (0-100) based on mouse movement around a center.
 */
export function calculateRotationValue(
    centerX: number,
    centerY: number,
    startAngle: number,
    baseRotation: number,
    currentX: number,
    currentY: number
): number {
    const currentAngle = Math.atan2(currentY - centerY, currentX - centerX);
    // Convert to degrees and normalize
    const deltaDegrees = (currentAngle - startAngle) * (180 / Math.PI);
    // Map 360 degrees to our 0-100 scale (100 / 360 = 1 / 3.6)
    // We add 100 before modulo to ensure it's always positive
    return (baseRotation + (deltaDegrees / 3.6) + 100) % 100;
}
