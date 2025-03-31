import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EyeIcon, EyeOffIcon, TrashIcon, PlusIcon, SaveIcon, XIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface APIKeyEntry {
    provider: string;
    key: string;
}

export default function ApikeySetting() {
    const queryClient = useQueryClient();
    const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
    const [unsavedRows, setUnsavedRows] = useState<APIKeyEntry[]>([]);
    const providers = ['openai', 'claude', 'grok', 'gemma', 'groq'];

    // Fetch API keys
    const { data: apiKeys = [] } = useQuery<APIKeyEntry[]>({
        queryKey: ['api-keys'],
        queryFn: async () => {
            const response = await fetch('/api/settings/llm/api-keys');
            if (!response.ok) {
                throw new Error('Failed to fetch API keys');
            }
            const data = await response.json();
            return data.map((item: { name: string; content: string }) => ({
                provider: item.name,
                key: item.content
            }));
        }
    });

    // Get available providers (excluding ones that already have keys)
    const availableProviders = useMemo(() => {
        const usedProviders = new Set(apiKeys?.map(key => key.provider) || []);
        return providers.filter(provider => !usedProviders.has(provider));
    }, [apiKeys]);

    // Add new API key mutation
    const addKeyMutation = useMutation({
        mutationFn: async (keyData: APIKeyEntry) => {
            const response = await fetch('/api/settings/llm/api-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: keyData.provider,
                    content: keyData.key
                })
            });
            if (!response.ok) {
                throw new Error('Failed to save API key');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['api-keys'] });
            toast.success('API key saved successfully');
        },
        onError: (error) => {
            toast.error('Failed to save API key: ' + error.message);
        }
    });

    // Update existing API key mutation
    const updateKeyMutation = useMutation({
        mutationFn: async (keyData: APIKeyEntry) => {
            const response = await fetch('/api/settings/llm/api-keys', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: keyData.provider,
                    content: keyData.key
                })
            });
            if (!response.ok) {
                throw new Error('Failed to update API key');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['api-keys'] });
            toast.success('API key updated successfully');
        },
        onError: (error) => {
            toast.error('Failed to update API key: ' + error.message);
        }
    });

    // Delete API key mutation
    const deleteKeyMutation = useMutation({
        mutationFn: async (provider: string) => {
            const response = await fetch(`/api/settings/llm/api-keys?name=${encodeURIComponent(provider)}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Failed to delete API key');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['api-keys'] });
            toast.success('API key deleted successfully');
        },
        onError: (error) => {
            toast.error('Failed to delete API key: ' + error.message);
        }
    });

    const addNewRow = () => {
        if (availableProviders.length === 0) {
            toast.error('All providers already have API keys configured');
            return;
        }
        setUnsavedRows([...unsavedRows, {
            provider: availableProviders[0],
            key: ''
        }]);
    };

    const updateUnsavedRow = (index: number, field: keyof APIKeyEntry, value: string) => {
        setUnsavedRows(rows => 
            rows.map((row, i) => 
                i === index ? { ...row, [field]: value } : row
            )
        );
    };

    const removeUnsavedRow = (index: number) => {
        setUnsavedRows(rows => rows.filter((_, i) => i !== index));
    };

    const saveRow = async (entry: APIKeyEntry) => {
        await addKeyMutation.mutateAsync(entry);
        setUnsavedRows(rows => rows.filter(row => row !== entry));
    };

    const updateSavedKey = (provider: string, key: string) => {
        updateKeyMutation.mutate({
            provider,
            key
        });
    };

    const deleteKey = (provider: string) => {
        deleteKeyMutation.mutate(provider);
    };

    const toggleKeyVisibility = (key: string) => {
        setShowKeys(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    return (
        <div className="flex flex-col bg-white rounded-md border p-4 space-y-3">
            <h2 className="text-xl font-semibold">API Keys</h2>
            <p className="text-sm text-gray-500">
                Manage your API keys for different language model providers.
            </p>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Provider</TableHead>
                        <TableHead>API Key</TableHead>
                        <TableHead className="w-[150px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {unsavedRows.map((entry, index) => (
                        <TableRow key={`unsaved-${index}`}>
                            <TableCell>
                                <Select
                                    value={entry.provider}
                                    onValueChange={(value) => updateUnsavedRow(index, 'provider', value)}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select provider" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableProviders
                                            .concat(entry.provider)
                                            .filter((provider, index, self) => self.indexOf(provider) === index)
                                            .map((provider) => (
                                                <SelectItem key={provider} value={provider}>
                                                    {provider.charAt(0).toUpperCase() + provider.slice(1)}
                                                </SelectItem>
                                            ))
                                        }
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type={showKeys[`unsaved-${index}`] ? "text" : "password"}
                                        value={entry.key}
                                        onChange={(e) => updateUnsavedRow(index, 'key', e.target.value)}
                                        placeholder="Enter API key"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => toggleKeyVisibility(`unsaved-${index}`)}
                                    >
                                        {showKeys[`unsaved-${index}`] ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => saveRow(entry)}
                                        disabled={!entry.key || !entry.provider}
                                    >
                                        <SaveIcon className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeUnsavedRow(index)}
                                    >
                                        <XIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {apiKeys.map((entry) => (
                        <TableRow key={entry.provider}>
                            <TableCell>
                                <span className="capitalize">{entry.provider}</span>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type={showKeys[entry.provider] ? "text" : "password"}
                                        value={entry.key}
                                        onChange={(e) => updateSavedKey(entry.provider, e.target.value)}
                                        placeholder="Enter API key"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => toggleKeyVisibility(entry.provider)}
                                    >
                                        {showKeys[entry.provider] ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteKey(entry.provider)}
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <Button
                variant="outline"
                onClick={addNewRow}
                disabled={availableProviders.length === 0}
                className="w-full"
            >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add New API Key
            </Button>
        </div>
    )
}