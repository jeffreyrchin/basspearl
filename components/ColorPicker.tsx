import { useDragSync } from '@/hooks/useDragSync';
import { clearDragOverride, setDragOverride } from '@/services/dragOverride';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';

/**
 * ColorPicker: A specialized UI for the RGBA effect.
 * Uses react-colorful for a cross-browser experience.
 * Bypasses React during drags to maintain 60fps performance.
 */
interface ColorPickerProps {
    r: number; // 0-100
    g: number; // 0-100
    b: number; // 0-100
    onChange: (r: number, g: number, b: number) => void;
    onPointerDown?: () => void;
    effectId: string;
}

const toHex = (v: number) => {
    return Math.max(0, Math.min(255, Math.round(v * 2.55))).toString(16).padStart(2, '0');
};

export const ColorPicker: React.FC<ColorPickerProps> = ({ r, g, b, onChange, onPointerDown, effectId }) => {
    const rRef = useRef(r);
    const gRef = useRef(g);
    const bRef = useRef(b);
    const colorWellRef = useRef<HTMLButtonElement>(null);

    const [isOpen, setIsOpen] = useState(false);

    // Convert 0-100 store values to 0-255 hex for the initialization/static state
    const currentHex = useMemo(() => `#${toHex(r)}${toHex(g)}${toHex(b)}`, [r, g, b]);

    // Refs are kept in sync with props for commitment on close
    useEffect(() => {
        rRef.current = r;
        gRef.current = g;
        bRef.current = b;
    }, [r, g, b]);

    // Fast-Track: Listen for drag events from engine
    useDragSync(effectId, null, useCallback((params) => {
        // Extract latest values from overrides, falling back to refs
        const rVal = params.find(p => p.index === 0)?.value ?? rRef.current;
        const gVal = params.find(p => p.index === 1)?.value ?? gRef.current;
        const bVal = params.find(p => p.index === 2)?.value ?? bRef.current;

        const hex = `#${toHex(rVal)}${toHex(gVal)}${toHex(bVal)}`;
        if (colorWellRef.current) colorWellRef.current.style.backgroundColor = hex;
    }, []));

    const handlePickerChange = (hex: string) => {
        // Update local visuals
        if (colorWellRef.current) colorWellRef.current.style.backgroundColor = hex;

        // Parse hex to 0-100 floats for the engine
        const rv = parseInt(hex.slice(1, 3), 16) / 2.55;
        const gv = parseInt(hex.slice(3, 5), 16) / 2.55;
        const bv = parseInt(hex.slice(5, 7), 16) / 2.55;

        rRef.current = rv;
        gRef.current = gv;
        bRef.current = bv;

        // Push to engine without re-rendering
        setDragOverride(effectId, [
            { index: 0, value: rv },
            { index: 1, value: gv },
            { index: 2, value: bv }
        ]);
    };

    return (
        <div className="flex items-center space-x-4 p-2 mb-1 bg-white/5 rounded-lg border border-white/10 group hover:border-white/20 transition-colors">
            {/* Visual Color Well / Trigger */}
            <div className="relative flex items-center gap-3">
                <button
                    ref={colorWellRef}
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        onPointerDown?.();
                        setIsOpen(!isOpen);
                    }}
                    onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter' || e.key === ' ') {
                            onPointerDown?.();
                            setIsOpen(!isOpen);
                        }
                    }}
                    // onClick={(e) => {
                    //     e.stopPropagation();
                    //     onPointerDown?.();
                    //     setIsOpen(!isOpen);
                    // }}
                    style={{ backgroundColor: currentHex }}
                    className="w-10 h-10 rounded-md border border-white/20 shadow-inner focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer active:scale-95 transition-transform"
                    title="Pick Color"
                />

                {/* Popover & Backdrop */}
                {isOpen && (
                    <>
                        {/* Invisible Backdrop: Catches 'outside' clicks */}
                        <div
                            className="fixed inset-0 z-[90] bg-transparent cursor-default"
                            onPointerDown={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                                clearDragOverride();
                                onChange(rRef.current, gRef.current, bRef.current);
                            }}
                        />

                        {/* The Actual Picker Popover */}
                        <div className="absolute top-full left-0 mt-3 z-[100] animate-in fade-in zoom-in-95 duration-150 origin-top-left">
                            <div className="p-3 bg-slate-800 border border-white/10 rounded-xl shadow-2xl relative">
                                <div onKeyDown={(e) => {
                                    // Stop arrow keys from triggering the playback scrubber or navigation
                                    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                                        e.stopPropagation();
                                    }
                                }}>
                                    <HexColorPicker color={currentHex} onChange={handlePickerChange} />
                                </div>
                                <div className="mt-3 flex items-center justify-end">
                                    <button
                                        onClick={() => {
                                            setIsOpen(false);
                                            clearDragOverride();
                                            onChange(rRef.current, gRef.current, bRef.current);
                                        }}
                                        className="px-2 py-1 text-[9px] font-bold tracking-widest bg-white/10 hover:bg-white/20 rounded uppercase text-white/80"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Label */}
                <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Color</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
