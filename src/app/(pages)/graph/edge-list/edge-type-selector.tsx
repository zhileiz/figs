import { Badge } from "@/components/ui/badge";
import { SelectEdgeType } from "@/lib/db/schema";
import { useEdgeByType } from "@/lib/react-query/useGraph";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { useState } from "react";

const EdgeTypeButton = ({ edgeType, onSelect, isSelected }: { edgeType: SelectEdgeType, onSelect: (edgeType: SelectEdgeType) => void, isSelected: boolean }) => {
    const [count, setCount] = useState<number | undefined>(undefined);
    const { data: edges, isLoading: edgesLoading } = useEdgeByType(edgeType.name, edgeType.from, edgeType.to);
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
    { onSelect, edgeTypes, selectedEdgeType }:
    { onSelect: (edgeType: SelectEdgeType) => void, edgeTypes: SelectEdgeType[], selectedEdgeType: SelectEdgeType }
) {
    return (
        <div className="flex flex-col gap-4 p-4">
            {edgeTypes?.map((edgeType: SelectEdgeType) => (
                <EdgeTypeButton edgeType={edgeType} onSelect={onSelect} key={edgeType.name} isSelected={selectedEdgeType.name === edgeType.name}/>
            ))}
        </div>
    )
}