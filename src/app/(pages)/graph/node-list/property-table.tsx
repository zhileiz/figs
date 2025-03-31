import { SelectNodeType } from "@/lib/db/schema";
import { useNodeByType } from "@/lib/react-query/useGraph";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useNodeType } from "@/lib/react-query/useSchema";
import { Pencil, Trash2 } from "lucide-react";

export default function PropertyTable({ selectedNodeType }: { selectedNodeType: SelectNodeType }) {
    const { data: nodes, isLoading: nodesLoading } = useNodeByType(selectedNodeType.name);
    const { data: nodeType, isLoading: nodeTypeLoading } = useNodeType(selectedNodeType.name);
    const [editingCell, setEditingCell] = useState<{ nodeId: string, propertyKey: string } | null>(null);
    const [editedValue, setEditedValue] = useState<string>("");
    const queryClient = useQueryClient();

    if (nodesLoading || nodeTypeLoading) return <div>Loading...</div>;
    if (!nodes?.result?.length) return <div className="p-4 text-muted-foreground">No nodes found</div>;

    const handleEditStart = (nodeId: string, propertyKey: string, currentValue: string) => {
        setEditingCell({ nodeId, propertyKey });
        setEditedValue(currentValue);
    };

    const handleEditComplete = async (nodeId: string, propertyKey: string) => {
        try {
            const response = await fetch('/api/memgraph/nodes', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nodeId,
                    properties: {
                        [propertyKey]: editedValue
                    }
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update node');
            }

            await response.json();
            toast.success("Change saved successfully");
            queryClient.invalidateQueries({ queryKey: ['nodes', selectedNodeType.name] });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save changes");
        } finally {
            setEditingCell(null);
            setEditedValue("");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, nodeId: string, propertyKey: string) => {
        if (e.key === 'Enter') {
            handleEditComplete(nodeId, propertyKey);
        } else if (e.key === 'Escape') {
            setEditingCell(null);
            setEditedValue("");
        }
    };

    const handleDeleteNode = async (nodeId: string) => {
        try {
            const response = await fetch('/api/memgraph/nodes', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nodeId }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete node');
            }

            await response.json();
            toast.success("Node deleted successfully");
            queryClient.invalidateQueries({ queryKey: ['nodes', selectedNodeType.name] });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete node");
        }
    };

    return (
        <div className="flex flex-col gap-4 h-full relative">
            <Table>
                <TableHeader className="sticky top-0 bg-muted z-10">
                    <TableRow>
                        {nodeType?.schema?.map(key => (
                            <TableHead key={key.key_name} className="font-bold text-primary">{key.key_name.charAt(0).toUpperCase() + key.key_name.slice(1)}</TableHead>
                        ))}
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {nodes.result.map((node) => (
                        <TableRow key={node.id}>
                            {nodeType?.schema?.map(key => (
                                <TableCell key={key.key_name} className="relative group">
                                    {editingCell?.nodeId === node.id && editingCell?.propertyKey === key.key_name ? (
                                        <Input
                                            value={editedValue}
                                            onChange={(e) => setEditedValue(e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, node.id, key.key_name)}
                                            onBlur={() => handleEditComplete(node.id, key.key_name)}
                                            className="h-8"
                                            autoFocus
                                        />
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <span>{node.properties[key.key_name] ?? ''}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 opacity-0 group-hover:opacity-100 absolute right-2"
                                                onClick={() => handleEditStart(node.id, key.key_name, node.properties[key.key_name] ?? '')}
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
                                    onClick={() => handleDeleteNode(node.id)}
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