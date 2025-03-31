import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type LangsmithResponse = {
    success: boolean;
    error?: string;
}

export default function LangsmithSetting() {
    const queryClient = useQueryClient();
    const [langsmithKey, setLangsmithKey] = useState('');
    const [showKey, setShowKey] = useState(false);

    // Fetch existing API key
    const { isLoading: isFetching } = useQuery({
        queryKey: ['settings', 'observability', 'langsmith'],
        queryFn: async () => {
            const response = await fetch('/api/settings/observability');
            if (!response.ok) {
                throw new Error('Failed to fetch Langsmith API key');
            }
            const data = await response.json();
            if (data[0]?.content) {
                setLangsmithKey(data[0].content);
            }
            return data;
        }
    });

    // Save API key mutation
    const { mutate: saveLangsmithKey, isPending: isSaving } = useMutation<LangsmithResponse, Error, void>({
        mutationFn: async () => {
            const response = await fetch('/api/settings/observability', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: langsmithKey }),
            });
            if (!response.ok) {
                throw new Error('Failed to save Langsmith API key');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings', 'observability', 'langsmith'] });
            toast.success('Langsmith API key saved successfully');
        },
        onError: (error) => {
            toast.error(`Failed to save Langsmith API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    const toggleKeyVisibility = () => {
        setShowKey(!showKey);
    };

    const handleSave = () => {
        if (!langsmithKey.trim()) {
            toast.error('Please enter a valid API key');
            return;
        }
        saveLangsmithKey();
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Langsmith API Key</label>
                <div className="flex items-center gap-2">
                    <Input
                        type={showKey ? "text" : "password"}
                        value={langsmithKey}
                        onChange={(e) => setLangsmithKey(e.target.value)}
                        placeholder="Enter Langsmith API key"
                        disabled={isFetching || isSaving}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleKeyVisibility}
                        disabled={isFetching || isSaving}
                    >
                        {showKey ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isFetching || isSaving}
                    >
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            'Save'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}