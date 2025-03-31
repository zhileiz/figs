import { SelectEdgeType, SelectSource } from "@/lib/db/schema";
import { useEdgeByTypeAndSource } from "@/lib/react-query/useGraph";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const useEdgeType = (name: string) => {
    return useQuery({
        queryKey: ['edgeType', name],
        queryFn: async () => {
            const response = await fetch(`/api/schema/edge?name=${name}`);
            if (!response.ok) {
                throw new Error('Failed to fetch edge type');
            }
            return response.json() as Promise<SelectEdgeType>;
        },
    });
};

export default function PropertyTable({ selectedEdgeType, source }: { selectedEdgeType: SelectEdgeType, source: SelectSource }) {
    const { data: edges, isLoading: edgesLoading } = useEdgeByTypeAndSource(selectedEdgeType.name, selectedEdgeType.from, selectedEdgeType.to, source);
    const { data: edgeType, isLoading: edgeTypeLoading } = useEdgeType(selectedEdgeType.name);
    const [editingCell, setEditingCell] = useState<{ edgeId: string, propertyKey: string } | null>(null);
    const [editedValue, setEditedValue] = useState<string>("");
    const queryClient = useQueryClient();

    if (edgesLoading || edgeTypeLoading) return <div>Loading...</div>;
    if (!edges?.result?.length) return <div className="p-4 text-muted-foreground">No edges found</div>;

    const handleEditStart = (edgeId: string, propertyKey: string, currentValue: string) => {
        setEditingCell({ edgeId, propertyKey });
        setEditedValue(currentValue);
    };

    const handleEditComplete = async (edgeId: string, propertyKey: string) => {
        try {
            const response = await fetch('/api/memgraph/edges', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    edgeId,
                    properties: {
                        [propertyKey]: editedValue
                    }
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update edge');
            }

            await response.json();
            toast.success("Change saved successfully");
            queryClient.invalidateQueries({ queryKey: ['edges', selectedEdgeType.name] });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save changes");
        } finally {
            setEditingCell(null);
            setEditedValue("");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, edgeId: string, propertyKey: string) => {
        if (e.key === 'Enter') {
            handleEditComplete(edgeId, propertyKey);
        } else if (e.key === 'Escape') {
            setEditingCell(null);
            setEditedValue("");
        }
    };

    const handleDeleteEdge = async (edgeId: string) => {
        try {
            const response = await fetch('/api/memgraph/edges', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ edgeId }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete edge');
            }

            await response.json();
            toast.success("Edge deleted successfully");
            queryClient.invalidateQueries({ queryKey: ['edges', selectedEdgeType.name] });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete edge");
        }
    };

    return (
        <div className="flex flex-col gap-4 h-full relative">
            <Table>
                <TableHeader className="sticky top-0 bg-muted z-10">
                    <TableRow>
                        <TableHead className="font-bold text-primary">From</TableHead>
                        <TableHead className="font-bold text-primary">To</TableHead>
                        {edgeType?.schema?.map((key: { key_name: string }) => (
                            <TableHead key={key.key_name} className="font-bold text-primary">{key.key_name.charAt(0).toUpperCase() + key.key_name.slice(1)}</TableHead>
                        ))}
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {edges.result.map((edge) => (
                        <TableRow key={edge.edgeId}>
                            <TableCell>{edge.from}</TableCell>
                            <TableCell>{edge.to}</TableCell>
                            {edgeType?.schema?.map((key: { key_name: string }) => (
                                <TableCell key={key.key_name} className="relative group">
                                    {editingCell?.edgeId === edge.edgeId && editingCell?.propertyKey === key.key_name ? (
                                        <Input
                                            value={editedValue}
                                            onChange={(e) => setEditedValue(e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, edge.edgeId, key.key_name)}
                                            onBlur={() => handleEditComplete(edge.edgeId, key.key_name)}
                                            className="h-8"
                                            autoFocus
                                        />
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <span>{edge.properties[key.key_name] ?? ''}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 opacity-0 group-hover:opacity-100 absolute right-2"
                                                onClick={() => handleEditStart(edge.edgeId, key.key_name, edge.properties[key.key_name] ?? '')}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </TableCell>
                            ))}
                            <TableCell>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleDeleteEdge(edge.edgeId)}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
} 