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

export default function ConnectorNode({ data }: NodeProps) {
  const color = data.color as string || '#2563EB'

  const width = 25
  const height = 25

  const strokeWidth = 1

  const innerWidth = width - 2 * strokeWidth;
  const innerHeight = height - 2 * strokeWidth;

  return (
    <div className='relative overflow-hidden text-center'>
      <div className='flex flex-col items-center justify-center absolute top-0 left-0 w-full h-full text-center'>
        <div className='text-[5px] text-white font-medium'>{String(data.name) ?? ''}</div>
      </div>
      <svg width={width} height={height} className='shape-svg'>
        {/* this offsets the shape by the strokeWidth so that we have enough space for the stroke */}
        <g transform={`translate(${strokeWidth}, ${strokeWidth})`}>
          <Circle
            width={innerWidth}
            height={innerHeight}
            fill={color}
            strokeWidth={strokeWidth}
            stroke={color}
          />
        </g>
      </svg>
      <Handle 
        position={Position.Bottom} 
        id="tgt" 
        type="target" 
        className='pipe-handle-type invisible'
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      />
      <Handle 
        position={Position.Top} 
        id="src" 
        type="source" 
        className='pipe-handle-type invisible'
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      />
    </div>
  );
};

