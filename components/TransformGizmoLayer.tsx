import { useEffectStore } from "@/store/useEffectStore";
import { TransformGizmo } from "./TransformGizmo";
import React from "react";

interface TransformGizmoLayerProps {
    canvasRef: React.RefObject<HTMLCanvasElement>;
}

const TransformGizmoLayer = ({ canvasRef }: TransformGizmoLayerProps) => {
    const selectedIds = useEffectStore(s => s.selectedIds);

    return [...selectedIds].map(id => (
        <TransformGizmo key={id} effectId={id} canvasRef={canvasRef} />
    ));
};

export default TransformGizmoLayer;