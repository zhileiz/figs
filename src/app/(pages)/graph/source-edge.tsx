import React from 'react';
import {
  BaseEdge,
  Edge,
  getStraightPath,
  type EdgeProps,
} from '@xyflow/react';
import { SelectEdgeType } from '@/lib/db/schema';

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
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ stroke: 'gray', strokeWidth: 0.5 }} />
    </>
  );
}

