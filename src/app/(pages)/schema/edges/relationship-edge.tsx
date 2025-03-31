import React from 'react';
import {
  BaseEdge,
  Edge,
  EdgeLabelRenderer,
  getStraightPath,
  type EdgeProps,
} from '@xyflow/react';
import { SelectEdgeType } from '@/lib/db/schema';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';

export default function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
}: EdgeProps<Edge<SelectEdgeType>>) {
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX: sourceX,
    sourceY: sourceY,
    targetX: targetX,
    targetY: targetY,
  });

  const onEdgeClick = () => {
    console.log("EDGE CLICKED", id)
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ stroke: 'black', strokeWidth: 3 }} />
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

