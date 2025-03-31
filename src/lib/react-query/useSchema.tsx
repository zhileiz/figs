import { useQuery } from "@tanstack/react-query";
import { SelectEdgeType, SelectNodeType } from "@/lib/db/schema";

export const useNodeTypes = () => {
    return useQuery({
        queryKey: ['nodeTypes'],
        queryFn: async () => {
            const response = await fetch('/api/schema/node');
            if (!response.ok) {
                throw new Error('Failed to fetch node types');
            }
            return response.json() as Promise<SelectNodeType[]>;
        },
    });
}

export const useNodeType = (nodeType: string) => {
    return useQuery({
        queryKey: ['nodeType', nodeType],
        queryFn: async () => {
            const response = await fetch(`/api/schema/node?name=${nodeType}`);
            if (!response.ok) {
                throw new Error('Failed to fetch node types');
            }
            return response.json() as Promise<SelectNodeType>;
        },
    });
}

export const useEdgeTypes = (enabled: boolean) => {
    return useQuery({
        queryKey: ['edgeTypes'],
        queryFn: async () => {
            const response = await fetch('/api/schema/edge');
            if (!response.ok) {
                throw new Error('Failed to fetch edge types');
            }
            return response.json() as Promise<SelectEdgeType[]>;
        },
        enabled: enabled,
    });
}