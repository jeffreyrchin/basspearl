import { useEffectStore } from "@/store/useEffectStore";
import { TransformGizmo } from "./TransformGizmo";
import React, { useRef } from "react";

interface TransformGizmoLayerProps {
    canvasRef: React.RefObject<HTMLCanvasElement>;
}

const TransformGizmoLayer = ({ canvasRef }: TransformGizmoLayerProps) => {
    const selectedIds = useEffectStore(s => s.selectedIds);

    const flushGlobalScroll = useRef(() => { });

    const setFlushGlobalScroll = (fn: () => void) => {
        flushGlobalScroll.current = fn;
    };

    return [...selectedIds].map(id => (
        <TransformGizmo
            key={id}
            effectId={id}
            canvasRef={canvasRef}
            flushGlobalScroll={flushGlobalScroll.current}
            setFlushGlobalScroll={setFlushGlobalScroll}
        />
    ));
};

export default TransformGizmoLayer;