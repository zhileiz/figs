"use client";

import { cn } from "@/lib/utils";
export default function SystemPrompt(
    { isEditingSystemPrompt, setIsEditingSystemPrompt, systemPrompt, handleSystemPromptKeyDown }: 
    { isEditingSystemPrompt: boolean, 
        setIsEditingSystemPrompt: (value: boolean) => void, systemPrompt: string, 
        handleSystemPromptKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void }
) {

    return (
        <div className={cn("w-full shrink-0 grow-0 sticky top-0 px-4 flex",
            isEditingSystemPrompt ? "h-48 py-2 flex-col gap-2 bg-muted" : "h-12 items-center gap-2 bg-background border-b")}
            onClick={() => !isEditingSystemPrompt && setIsEditingSystemPrompt(true)}>
            <h3 className="text-md text-muted-foreground font-semibold grow-0 shrink-0">{isEditingSystemPrompt ? "System prompt (Save with ⏎)" : "System prompt:"}</h3>
            {isEditingSystemPrompt ? (
                <textarea
                    className="flex w-full bg-background text-md leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none [resize:none] border rounded-md grow p-2"
                    defaultValue={systemPrompt}
                    onKeyDown={handleSystemPromptKeyDown}
                    autoFocus
                    rows={2}
                />
            ) : (
                <span className="text-primary font-medium">
                    {systemPrompt.length > 100 ? systemPrompt.slice(0, 100) + `... (${(systemPrompt.length)} characters)` : systemPrompt}
                </span>
            )}
        </div>
    );
}
