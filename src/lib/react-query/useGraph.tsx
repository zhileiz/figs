import { useQuery } from "@tanstack/react-query";
import { SelectSource } from "../db/schema";

export interface DBNode {
    id: string
    label: string
    color: string
    properties: Record<string, any>
}

export interface DBEdge {
    edgeId: string
    from: string
    to: string
    type: string
    properties: Record<string, any>
}

export const useNodes = () => useQuery({
    queryKey: ['nodes'],
    queryFn: async () => {
        const res = await fetch('/api/memgraph/nodes')
        return res.json() as Promise<{ success: boolean, result: DBNode[] }>
    }
});

export const useEdges = () => useQuery({
    queryKey: ['edges'],
    queryFn: async () => {
        const res = await fetch('/api/memgraph/edges')
        return res.json() as Promise<{ success: boolean, result: DBEdge[] }>
    }
});

export const useNodeByType = (type: string) => useQuery({
    queryKey: ['nodes', type],
    queryFn: async () => {
        const res = await fetch(`/api/memgraph/nodes?nodeType=${type}`)
        return res.json() as Promise<{ success: boolean, result: DBNode[] }>
    }
});

export const useNodeByTypeAndSource = (type: string, source: SelectSource) => {
    return useQuery({
        queryKey: ['nodes', "source", source.file_url, type],
        queryFn: async () => {
            const res = await fetch(`/api/memgraph/nodes?nodeType=${type}&source=${source.file_url}`)
            return res.json() as Promise<{ success: boolean, result: DBNode[] }>
        },
    });
};


export const useEdgeByType = (type: string, from: string, to: string) => {
    return useQuery({
        queryKey: ['edges', type, from, to],
        queryFn: async () => {
            const response = await fetch(`/api/memgraph/edges?edgeType=${type}&from=${from}&to=${to}`);
            if (!response.ok) {
                throw new Error('Failed to fetch edges');
            }
            return response.json() as Promise<{ result: DBEdge[] }>;
        },
    });
};

export const useEdgeByTypeAndSource = (type: string, from: string, to: string, source: SelectSource) => {
    return useQuery({
        queryKey: ['edges', "source", source.file_url, type, from, to],
        queryFn: async () => {
            const response = await fetch(`/api/memgraph/edges?edgeType=${type}&from=${from}&to=${to}&source=${source.file_url}`);
            if (!response.ok) {
                throw new Error('Failed to fetch edges');
            }
            return response.json() as Promise<{ result: DBEdge[] }>;
        },
    });
};
