import React from 'react';
import { BaseEdge, BezierEdge, EdgeLabelRenderer, useReactFlow, type EdgeProps } from '@xyflow/react';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';

export default function CircularSelfConnectingEdge(props: EdgeProps) {
    const { getNode } = useReactFlow();
    const { sourceX, sourceY, targetX, targetY, markerEnd, style, id, source, target } = props;

    const sourceNode = getNode(source);
    const bound = sourceNode?.position;
    if (!bound) return null;
    const parentCenter = {
        x: bound?.x + 60,
        y: bound?.y + 60,
    };


    if (source !== target) {
        return <BezierEdge {...props} />;
    }

    const getAngleFromPosition = (x: number, y: number, center: { x: number; y: number }): number => {
        return Math.atan2(y - center.y, x - center.x);
    };

    // TODO: use parent center to redefine node center, so that the edge arc center is always outside of the parent node, not inside.
    const nodeCenter = {
        x: (sourceX + targetX) / 2,
        y: (sourceY + targetY) / 2,
    };

    const sourceAngle = getAngleFromPosition(sourceX, sourceY, nodeCenter);
    const targetAngle = getAngleFromPosition(targetX, targetY, nodeCenter);

    const radius = Math.max(
        Math.sqrt(Math.pow(sourceX - nodeCenter.x, 2) + Math.pow(sourceY - nodeCenter.y, 2)),
        Math.sqrt(Math.pow(targetX - nodeCenter.x, 2) + Math.pow(targetY - nodeCenter.y, 2))
    );

    const arcRadius = radius * 1.5;
    let arcSweep = 1;
    const angleDiff = ((targetAngle - sourceAngle + 2 * Math.PI) % (2 * Math.PI));
    if (angleDiff > Math.PI) {
        arcSweep = 0;
    }

    const edgePath = `
    M ${sourceX} ${sourceY}
    A ${arcRadius} ${arcRadius} 0 1 ${arcSweep} ${targetX} ${targetY}
  `;

    // Calculate label position
    const Mx = (sourceX + targetX) / 2;
    const My = (sourceY + targetY) / 2;
    const Vx = targetX - sourceX;
    const Vy = targetY - sourceY;
    const D = Math.sqrt(Vx * Vx + Vy * Vy);
    const h = Math.sqrt(arcRadius * arcRadius - (D / 2) * (D / 2));
    const Ux = -Vy / D;
    const Uy = Vx / D;
    const C1x = Mx + h * Ux;
    const C1y = My + h * Uy;
    const C2x = Mx - h * Ux;
    const C2y = My - h * Uy;

    const alpha1 = Math.atan2(sourceY - C1y, sourceX - C1x);
    const beta1 = Math.atan2(targetY - C1y, targetX - C1x);
    const alpha2 = Math.atan2(sourceY - C2y, sourceX - C2x);
    const beta2 = Math.atan2(targetY - C2y, targetX - C2x);

    let Cx, Cy, alpha, beta, delta;
    if (arcSweep === 1) {
        if ((beta1 - alpha1 + 2 * Math.PI) % (2 * Math.PI) > Math.PI) {
            Cx = C1x;
            Cy = C1y;
            alpha = alpha1;
            beta = beta1;
            delta = (beta1 - alpha1 + 2 * Math.PI) % (2 * Math.PI);
        } else {
            Cx = C2x;
            Cy = C2y;
            alpha = alpha2;
            beta = beta2;
            delta = (beta2 - alpha2 + 2 * Math.PI) % (2 * Math.PI);
        }
    } else {
        if ((alpha1 - beta1 + 2 * Math.PI) % (2 * Math.PI) > Math.PI) {
            Cx = C1x;
            Cy = C1y;
            alpha = alpha1;
            beta = beta1;
            delta = (alpha1 - beta1 + 2 * Math.PI) % (2 * Math.PI);
        } else {
            Cx = C2x;
            Cy = C2y;
            alpha = alpha2;
            beta = beta2;
            delta = (alpha2 - beta2 + 2 * Math.PI) % (2 * Math.PI);
        }
    }

    const phi_mid =
        arcSweep === 1
            ? (alpha - 0.5 * delta + 2 * Math.PI) % (2 * Math.PI)
            : (alpha + 0.5 * delta) % (2 * Math.PI);
    const labelX = Cx + arcRadius * Math.cos(phi_mid);
    const labelY = Cy + arcRadius * Math.sin(phi_mid);

    const onEdgeClick = () => {
        console.log("EDGE CLICKED", id);
    };

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ stroke: 'black', strokeWidth: 3, ...style }} />
            <EdgeLabelRenderer>
                <ContextMenu>
                    <ContextMenuTrigger>
                        <div className="origin-center absolute nodrag nopan" style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, }}>
                            <button className="text-primary cursor-pointer p-2 hover:text-red-500 font-medium text-xl bg-white rounded-full border border-primary" onClick={onEdgeClick}>
                                {id}
                        </button>
                        </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                        <ContextMenuItem>
                            <p>Edit</p>
                        </ContextMenuItem>
                    </ContextMenuContent>
                </ContextMenu>
            </EdgeLabelRenderer>
        </>
    );
}