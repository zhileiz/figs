import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SelectNodeType, SelectSource } from "@/lib/db/schema";
import { useNodeByTypeAndSource } from "@/lib/react-query/useGraph";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const NodeTypeButton = (
    { nodeType, onSelect, isSelected, source }: 
    { 
        nodeType: SelectNodeType, 
        onSelect: (nodeType: any) => void, 
        isSelected: boolean,
        source: SelectSource
    }
) => {
    const [count, setCount] = useState<number | undefined>(undefined);
    const { data: nodes, isLoading: nodesLoading } = useNodeByTypeAndSource(nodeType.name, source);
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
    { onSelect, nodeTypes, selectedNodeType, source }:
    { onSelect: (nodeType: any) => void, 
        nodeTypes: SelectNodeType[], 
        selectedNodeType: SelectNodeType,
        source: SelectSource }
) {
    const queryClient = useQueryClient()
    const onResetNodes = async () => {
        const res = await fetch(`/api/memgraph/nodes?source=${source.file_url}`, {
            method: 'DELETE'
        })
        if (res.ok) {
            const data = await res.json()
            if (data.success) {
                toast.success(data.message)
                queryClient.invalidateQueries({ queryKey: ['nodes', "source", source.file_url] })
            } else {
                toast.error(data.message)
            }
        } 
    }
    return (
        <div className="flex flex-col gap-4 p-4 h-full">
            {nodeTypes?.map((nodeType: any) => (
                <NodeTypeButton nodeType={nodeType} onSelect={onSelect} key={nodeType.name} isSelected={selectedNodeType.name === nodeType.name} source={source}/>
            ))}
            <div className="grow"></div>
            <Button variant="outline" onClick={onResetNodes}>Reset Nodes</Button>
        </div>
    )
}