import { useEffectStore } from "@/store/useEffectStore";
import { TransformGizmo } from "./TransformGizmo";
import React from "react";

interface TransformGizmoLayerProps {
    canvasRef: React.RefObject<HTMLCanvasElement>;
}

const TransformGizmoLayer = ({ canvasRef }: TransformGizmoLayerProps) => {
    const selectedIds = useEffectStore(s => s.selectedIds);

    const selectedHandles = new Set(
        [...selectedIds].map(id => useEffectStore.getState().findGroupHandle(id))
    );

    return [...selectedHandles].map(id => (
        <TransformGizmo key={id} effectId={id} canvasRef={canvasRef} />
    ));
};

export default TransformGizmoLayer;