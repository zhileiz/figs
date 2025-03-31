import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SelectEdgeType, SelectSource } from "@/lib/db/schema";
import { useEdgeByTypeAndSource } from "@/lib/react-query/useGraph";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
const EdgeTypeButton = (
    { edgeType, onSelect, isSelected, source }:
        {
            edgeType: SelectEdgeType,
            onSelect: (edgeType: SelectEdgeType) => void,
            isSelected: boolean,
            source: SelectSource
        }
) => {
    const [count, setCount] = useState<number | undefined>(undefined);
    const { data: edges, isLoading: edgesLoading } = useEdgeByTypeAndSource(edgeType.name, edgeType.from, edgeType.to, source);
    useEffect(() => {
        setCount(edges?.result?.length);
    }, [edges]);
    return (
        <div
            className={cn("h-10 border rounded-md flex justify-between items-center px-4"
                , isSelected ? "bg-brand-100 text-brand-900 border-brand-500"
                    : "bg-muted text-muted-foreground border-border")}
            key={edgeType.name}
            onClick={() => onSelect(edgeType)}>
            <div className="text-sm font-medium">{edgeType.name}</div>
            <Badge variant="outline" className="text-xs">{count}</Badge>
        </div>
    )
}

export default function EdgeTypeSelector(
    { onSelect, edgeTypes, selectedEdgeType, source }:
        {
            onSelect: (edgeType: SelectEdgeType) => void,
            edgeTypes: SelectEdgeType[], 
            selectedEdgeType: SelectEdgeType,
            source: SelectSource
        }
) {
    const queryClient = useQueryClient()
    const onResetEdges = async () => {
        const res = await fetch(`/api/memgraph/edges?source=${source.file_url}`, {
            method: 'DELETE'
        })
        if (res.ok) {
            const data = await res.json()
            if (data.success) {
                toast.success(data.message)
                queryClient.invalidateQueries({ queryKey: ['edges', "source", source.file_url] })
            } else {
                toast.error(data.message)
            }
        }
    }
    return (
        <div className="flex flex-col gap-4 p-4 h-full">
            {edgeTypes?.map((edgeType: SelectEdgeType) => (
                <EdgeTypeButton edgeType={edgeType} onSelect={onSelect} key={edgeType.name} isSelected={selectedEdgeType.name === edgeType.name} source={source} />
            ))}
            <div className="grow"></div>
            <Button variant="outline" onClick={() => onResetEdges()}>Reset Edges</Button>
        </div>
    )
}