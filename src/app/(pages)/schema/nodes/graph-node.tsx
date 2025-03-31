import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react'
import type { SelectNodeType } from '@/lib/db/schema';
import { useEffect, Fragment } from 'react';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { useQueryClient } from '@tanstack/react-query';

function CenterHandle({ type, position, nodeId, name }: { type: 'target' | 'source', position: Position, nodeId: string, name: string }) {
    const id = `${nodeId}-${type}-${name}`;

    return (
        <Handle type={type}
            position={position}
            id={id}
            style={{
                backgroundColor: type === 'target' ? 'green' : 'red',
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10000, opacity: 0
            }}
        />
    )
}

function NodeHandle({ type, position, nodeId, name, angle, radius }: { type: 'target' | 'source', position: Position, nodeId: string, name: string, angle: number, radius?: number }) {
    const id = `${nodeId}-${type}-${name}`;

    // Calculate position on the circumference (radius = 120px)
    const iradius = radius || 55;
    const xOffset = Math.cos(angle * 2 * Math.PI) * iradius;
    const yOffset = Math.sin(angle * 2 * Math.PI) * iradius;

    let closestPoint: Position;
    if (angle <= 0.125 || angle > 0.875) {
        closestPoint = Position.Right;
    } else if (angle > 0.125 && angle <= 0.375) {
        closestPoint = Position.Bottom;
    } else if (angle > 0.375 && angle <= 0.625) {
        closestPoint = Position.Left;
    } else { // angle > 0.625 && angle <= 0.875
        closestPoint = Position.Top;
    }

    return (
        <Handle type={type}
            position={closestPoint}
            id={id}
            style={{
                backgroundColor: type === 'target' ? 'green' : 'red',
                width: '2px',
                height: '2px',
                position: 'absolute',
                top: '50%', left: '50%',
                transform: `translate(calc(-50% + ${xOffset}px), calc(-50% + ${yOffset}px))`,
                zIndex: 10000, opacity: 0
            }}
        />
    )
}

export type GraphNodeData = SelectNodeType & {
    color: string,
    sources: {
        name: string,
        position: Position,
    }[]
    targets: {
        name: string,
        position: Position,
    }[]
    loops: {
        name: string,
        srcPosition: Position,
        targetPosition: Position,
    }[]
}

export default function GraphNode({ data, selected, id }: NodeProps<Node<GraphNodeData>>) {
    const queryClient = useQueryClient();
    const updateNodeInternals = useUpdateNodeInternals();
    useEffect(() => {
        updateNodeInternals(id)
    }, [data])
    const handleCount = data.sources.length + data.targets.length + data.loops.length * 2
    const gap = 1.0 / handleCount
    const handleDeleteNode = async () => {
        await fetch(`/api/schema/node?name=${data.name}`, {
            method: 'DELETE',
        }).then((res) => res.json()).then((data) => {
            queryClient.invalidateQueries({ queryKey: ['nodeTypes'] })
        })
    }
    return (
        <ContextMenu>
            <ContextMenuTrigger>
            {/* {selected && <NodeDetailsToolbar node={data} />} */}
            <div
                className={`flex items-center justify-center rounded-full ${selected ? 'ring-2 ring-blue-500' : ''} text-white w-[120px] h-[120px] transition-all duration-200 hover:opacity-90 cursor-pointer`}
                style={{ backgroundColor: data.color || '#2563EB' }}
            >
                <span className="font-semibold text-center px-2 text-lg">{data.name}</span>
                {data.sources.map((source, idx) => (
                    <NodeHandle key={idx} type="source" position={source.position} nodeId={id} name={source.name} angle={gap * idx} radius={2} />
                ))}
                {data.targets.map((target, idx) => (
                    <NodeHandle key={idx} type="target" position={target.position} nodeId={id} name={target.name} angle={gap * (data.sources.length + idx)} radius={2} />
                ))}
                {data.loops.map((loop, idx) => {
                    const offset = data.sources.length + data.targets.length
                    return (
                        <Fragment key={`loop-${idx}-${loop.name}`}>
                            <NodeHandle type="source" position={loop.srcPosition} nodeId={id} name={loop.name} angle={gap * (offset + idx * 2)} />
                            <NodeHandle type="target" position={loop.targetPosition} nodeId={id} name={loop.name} angle={gap * (offset + idx * 2 + 1)} />
                        </Fragment>
                    )
                })}
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onClick={handleDeleteNode}>
                    <p>Delete</p>
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}