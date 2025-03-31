import { SelectEdgeType } from "@/lib/db/schema";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const VALUE_TYPES = [
    "string", "boolean", "integer", "float", "list<string>", "list<boolean>", 
    "list<integer>", "list<float>", "map", "duration", "date", "datetime", "point"
] as const;

export default function EdgeSelection({ edge, onUpdate }: { edge: SelectEdgeType, onUpdate: (prevId: string, newId: string) => void }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(edge?.name);
    const [editedSchema, setEditedSchema] = useState(edge?.schema || []);
    const queryClient = useQueryClient();

    useEffect(() => {
        setIsEditing(false);
        setEditedName(edge?.name);
        setEditedSchema(edge?.schema || []);
    }, [edge]);

    const saveName = async () => {
        try {
            const response = await fetch('/api/schema/edge?type=name', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: editedName,
                    old_name: edge?.name,
                    from: edge?.from,
                    to: edge?.to,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update edge type');
            }

            await response.json();
            toast.success('Edge type updated successfully');
            queryClient.invalidateQueries({ queryKey: ['edgeTypes'] })
            onUpdate(edge?.name, editedName)
            setIsEditing(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update edge type');
        }
    }

    const saveSchema = async () => {
        try {
            const response = await fetch('/api/schema/edge?type=full', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: editedName,
                    schema: editedSchema,
                    from: edge?.from,
                    to: edge?.to,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update edge type');
            }

            await response.json();
            toast.success('Node type updated successfully');
            queryClient.invalidateQueries({ queryKey: ['edgeTypes'] })
            setIsEditing(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update node type');
        }
    }

    const handleSave = async () => {
        if (editedName !== edge?.name) {
            await saveName();
        }
        await saveSchema();
    };

    const handleAddProperty = () => {
        setEditedSchema([...editedSchema, { key_name: "new_property", value_type: "string" }]);
    };

    return (
        <div className="flex flex-col bg-card p-0 rounded-lg border border-border text-primary w-64">
            {/* Header with edge name */}
            <div className="flex items-center justify-between mb-2 border-b p-2">
                <div className="flex-1">
                    {isEditing ? (
                        <Input
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="h-7 px-0 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none text-base font-semibold text-foreground shadow-none"
                        />
                    ) : (
                        <h3 className="text-base font-semibold text-foreground">{edge?.name}</h3>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    className="h-7 px-2"
                >
                    {isEditing ? "Save" : "Edit"}
                </Button>
            </div>
            
            {/* Connection info */}
            <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-xs text-muted-foreground">From: </span>
                <span className="text-xs font-medium">{edge?.from}</span>
            </div>
            <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-xs text-muted-foreground">To: </span>
                <span className="text-xs font-medium">{edge?.to}</span>
            </div>
            
            {/* Schema properties */}
            <div className="flex flex-col gap-1.5 px-2 pb-4">
                <div className="flex items-center justify-between">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Properties</div>
                    {isEditing && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleAddProperty}
                            className="h-6 px-2 text-xs"
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                        </Button>
                    )}
                </div>
                {editedSchema.length > 0 ? (
                    <div className="grid gap-1">
                        {editedSchema.map((property, index) => (
                            <div 
                                key={index}
                                className="flex items-center justify-between py-1.5 px-2 bg-muted hover:bg-muted/40 rounded-md text-sm"
                            >
                                {isEditing ? (
                                    <Input
                                        value={property.key_name}
                                        onChange={(e) => {
                                            const newSchema = [...editedSchema];
                                            newSchema[index] = { ...property, key_name: e.target.value };
                                            setEditedSchema(newSchema);
                                        }}
                                        className="h-6 px-0 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none text-sm font-medium w-[120px] shadow-none"
                                    />
                                ) : (
                                    <span className="font-medium">{property.key_name}</span>
                                )}
                                {isEditing ? (
                                    <Select
                                        value={property.value_type}
                                        onValueChange={(value) => {
                                            const newSchema = [...editedSchema];
                                            newSchema[index] = { ...property, value_type: value as any };
                                            setEditedSchema(newSchema);
                                        }}
                                    >
                                        <SelectTrigger className="h-6 w-[100px] text-xs bg-primary/10 border-0">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {VALUE_TYPES.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-xs font-medium text-primary">
                                        {property.value_type}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-xs text-muted-foreground italic py-1.5 px-2 bg-muted/30 rounded-md">
                        No schema properties
                    </div>
                )}
            </div>
        </div>
    );
}