import React from 'react';

export interface WatermarkOptions {
    fontSizeScale?: number; // default 0.03 (3%)
    paddingScale?: number; // default 0.5 (relative to font size)
    opacity?: number; // default 1.0
}

/**
 * Shared Canvas implementation for high-res exports
 */
export const drawWatermarkToCanvas = (
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    width: number,
    height: number,
    options: WatermarkOptions = {}
) => {
    const { fontSizeScale = 0.03, paddingScale = 0.5 } = options;

    // Base constants for the "Stamp" - we draw at 100px font size then scale
    const BASE_FONT_SIZE = 100;
    const glitchText = 'GLITCH';
    const brainText = 'BRAIN';
    const ioText = '.io';

    ctx.save();
    ctx.font = `800 ${BASE_FONT_SIZE}px "Genos", sans-serif`;

    // Measure full stamp width at base size
    const ioWidth = ctx.measureText(ioText).width;
    const brainWidth = ctx.measureText(brainText).width;
    const glitchWidth = ctx.measureText(glitchText).width;
    const totalBaseWidth = glitchWidth + brainWidth + ioWidth;
    const basePadding = BASE_FONT_SIZE * paddingScale;

    // Calculate target scale
    // Target width is (width * fontSizeScale * multiplier) roughly, 
    // but we want robust fitting relative to the canvas.
    let targetFontSize = width * fontSizeScale;

    // Guard: if width is very small, scale down
    const maxAllowedWidth = width - basePadding * 2 * (targetFontSize / BASE_FONT_SIZE);
    const scaleByWidth = maxAllowedWidth / totalBaseWidth;
    const finalScale = Math.min(targetFontSize / BASE_FONT_SIZE, scaleByWidth);

    // Positioning: Bottom Right
    const drawPadding = (basePadding * finalScale);
    ctx.translate(width - drawPadding, height - drawPadding);
    ctx.scale(finalScale, finalScale);

    // Draw at base size (0,0 is now the bottom-right corner including padding)
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.lineJoin = 'round';

    // 1. Black Outline (Stroke)
    ctx.lineWidth = BASE_FONT_SIZE * 0.15;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(ioText, 0, 0);
    ctx.strokeText(brainText, -ioWidth, 0);
    ctx.strokeText(glitchText, -ioWidth - brainWidth, 0);

    // 2. Fills
    ctx.fillStyle = '#ffffff';
    ctx.fillText(ioText, 0, 0);

    ctx.fillStyle = '#fb00ff';
    ctx.fillText(brainText, -ioWidth, 0);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(glitchText, -ioWidth - brainWidth, 0);

    ctx.restore();
};

/**
 * Shared React implementation for the editor UI.
 * This uses a canvas internally to ensure 100% parity with the export.
 * The component will fill its parent container.
 */
export const Watermark: React.FC<{ className?: string }> = ({ className = "" }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        const updateCanvas = () => {
            const container = containerRef.current;
            const canvas = canvasRef.current;
            if (!container || !canvas) return;

            const rect = container.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;

            // Match canvas internal size to container display size * DPR
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.scale(dpr, dpr);
            ctx.clearRect(0, 0, rect.width, rect.height);

            // Draw using the shared logic
            // In the editor, we use a larger scale (e.g., 20% of container width)
            // because the container itself will be small and placed in a corner.
            drawWatermarkToCanvas(ctx, rect.width, rect.height, {
                fontSizeScale: 0.1, // 10% of component width (which is 30% of crop) = 3% total
                paddingScale: 0.2
            });
        };

        updateCanvas();
        window.addEventListener('resize', updateCanvas);
        return () => window.removeEventListener('resize', updateCanvas);
    }, []);

    return (
        <div ref={containerRef} className={`pointer-events-none select-none mix-blend-difference ${className}`}>
            <canvas
                ref={canvasRef}
                className="w-full h-full block"
            />
        </div>
    );
};
