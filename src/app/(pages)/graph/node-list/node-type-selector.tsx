import { Badge } from "@/components/ui/badge";
import { SelectNodeType } from "@/lib/db/schema";
import { useNodeByType } from "@/lib/react-query/useGraph";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { useState } from "react";

const NodeTypeButton = ({ nodeType, onSelect, isSelected }: { nodeType: SelectNodeType, onSelect: (nodeType: any) => void, isSelected: boolean }) => {
    const [count, setCount] = useState<number | undefined>(undefined);
    const { data: nodes, isLoading: nodesLoading } = useNodeByType(nodeType.name);
    useEffect(() => {
        setCount(nodes?.result?.length);
    }, [nodes]);
    return (
        <div 
            className={cn("h-10 border rounded-md flex justify-between items-center px-4"
                , isSelected ? "bg-brand-100 text-brand-900 border-brand-500" 
                             : "bg-muted text-muted-foreground border-border")} 
            key={nodeType.name} 
            onClick={() => onSelect(nodeType)}>
            <div className="text-sm font-medium">{nodeType.name}</div>
            <Badge variant="outline" className="text-xs">{count}</Badge>
        </div>
    )
}


export default function NodeTypeSelector(
    { onSelect, nodeTypes, selectedNodeType }:
    { onSelect: (nodeType: any) => void, nodeTypes: SelectNodeType[], selectedNodeType: SelectNodeType }
) {
    return (
        <div className="flex flex-col gap-4 p-4">
            {nodeTypes?.map((nodeType: any) => (
                <NodeTypeButton nodeType={nodeType} onSelect={onSelect} key={nodeType.name} isSelected={selectedNodeType.name === nodeType.name}/>
            ))}
        </div>
    )
}