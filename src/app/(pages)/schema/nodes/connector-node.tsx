import { Handle, Position, type NodeProps } from '@xyflow/react';
import {  SVGAttributes } from 'react';

type ShapeProps = {
  width: number;
  height: number;
} & SVGAttributes<SVGElement>;

export function Circle({ width, height, ...svgAttributes }: ShapeProps) {
  return (
    <ellipse
      cx={width / 2}
      cy={height / 2}
      rx={width / 2}
      ry={height / 2}
      {...svgAttributes}
    />
  );
}

export default function ConnectorNode({ }: NodeProps) {

  const width = 7
  const height = 7

  const strokeWidth = 1

  const innerWidth = width - 2 * strokeWidth;
  const innerHeight = height - 2 * strokeWidth;

  return (
    <>
      <svg width={width} height={height} className='shape-svg'>
        {/* this offsets the shape by the strokeWidth so that we have enough space for the stroke */}
        <g transform={`translate(${strokeWidth}, ${strokeWidth})`}>
          <Circle
            width={innerWidth}
            height={innerHeight}
            fill='blue'
            strokeWidth={strokeWidth}
            stroke='blue'
          />
        </g>
      </svg>
      <Handle position={Position.Bottom} id="tgt" type="target" className='pipe-handle-type' />
    </>
  );
};

