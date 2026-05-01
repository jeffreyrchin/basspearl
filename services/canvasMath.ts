/**
 * Utility functions for mapping coordinates between DOM elements 
 * and the virtual canvas space.
 */

export interface Rect {
    left: number;
    top: number;
    width: number;
    height: number;
}

/**
 * Calculates the bounding box of a virtual 16:9 canvas within a container,
 * accounting for 'object-fit: cover' behavior.
 * 
 * Returns coordinates in percentage (%) relative to the container.
 */
export function calculateVirtualCanvasRect(
    canvasDOMRect: DOMRect,
    containerDOMRect: DOMRect,
    artAspectRatio: number
): Rect {
    const winAspect = canvasDOMRect.width / canvasDOMRect.height;
    
    let virtualW = canvasDOMRect.width;
    let virtualH = canvasDOMRect.height;
    let offsetX = 0;
    let offsetY = 0;

    if (winAspect < artAspectRatio) {
        // Window is narrower than Art. Height matches, Width is wider.
        virtualW = canvasDOMRect.height * artAspectRatio;
        offsetX = (canvasDOMRect.width - virtualW) / 2;
    } else {
        // Window is taller than Art. Width matches, Height is taller.
        virtualH = canvasDOMRect.width / artAspectRatio;
        offsetY = (canvasDOMRect.height - virtualH) / 2;
    }

    return {
        left: ((canvasDOMRect.left + offsetX - containerDOMRect.left) / containerDOMRect.width) * 100,
        top: ((canvasDOMRect.top + offsetY - containerDOMRect.top) / containerDOMRect.height) * 100,
        width: (virtualW / containerDOMRect.width) * 100,
        height: (virtualH / containerDOMRect.height) * 100
    };
}

/**
 * Calculates the initial Scale X and Scale Y for an image to fit within
 * the virtual canvas without stretching.
 */
export function calculateInitialImageScale(
    imgWidth: number, 
    imgHeight: number, 
    canvasAspectRatio: number
): { scaleX: number; scaleY: number } {
    const imgAspect = imgWidth / imgHeight;
    let sX = 50;
    let sY = 50;

    if (imgAspect > canvasAspectRatio) {
        // Image is wider than canvas: fit to width
        sX = 50;
        sY = 50 / (imgAspect / canvasAspectRatio);
    } else {
        // Image is taller than canvas: fit to height
        sY = 50;
        sX = 50 * (imgAspect / canvasAspectRatio);
    }

    return { scaleX: sX, scaleY: sY };
}

/**
 * Maps our 0-100 normalized pan values to CSS percentage coordinates
 * for the Transform Gizmo.
 */
export function mapPanToCSS(panX: number, panY: number): { x: number; y: number } {
    // panX 0-100 -> -50% to 150% (range of 200%)
    const x = (panX - 50) * 2 + 50;
    // panY 0-100 -> 150% to -50% (flipped)
    const y = 150 - (panY * 2);
    return { x, y };
}
