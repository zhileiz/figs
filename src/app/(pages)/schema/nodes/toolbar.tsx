import { NodeToolbar, Position } from '@xyflow/react';
import { SelectNodeType } from '@/lib/db/schema';
import { TableIcon } from 'lucide-react';

function NodeDetailsToolbar({ node }: { node: SelectNodeType }) {
  if (!node) return null;

  return (
    <NodeToolbar className="nodrag nowheel" position={Position.Top} offset={10}>
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10 text-primary w-64">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b">
          <TableIcon className="w-5 h-5" />
          <h3 className="font-medium text-lg">{node.name}</h3>
        </div>
        <div className="space-y-2">
          {(node.schema || []).length > 0 ? (
            <div className="divide-y divide-gray-100">
              {(node.schema || []).map((field, index) => (
                <div key={index} className="py-1 flex items-center justify-between">
                  <span className="font-medium text-sm">{field.key_name}</span>
                  <span className="text-sm text-gray-500">{field.value_type}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No schema fields defined</p>
          )}
        </div>
      </div>
    </NodeToolbar>
  );
}

export default NodeDetailsToolbar;
