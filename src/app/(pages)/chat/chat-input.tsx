"use client";

export default function ChatInput({ handleSubmit, input, handleInputChange }: { handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void, input: string, handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void }) {
    return (
        <div className="h-36 w-full bg-muted shrink-0 grow-0 sticky bottom-0 flex flex-col px-4 pt-2 pb-4 gap-2.5">
            <h3 className="text-md text-muted-foreground font-semibold grow-0 shrink-0">User prompt (Send with ⏎)</h3>
            <form onSubmit={handleSubmit} className="grow">
                <textarea
                    className="h-full w-full bg-background text-md leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none [resize:none] rounded-md border p-2"
                    placeholder="Ask me anything..."
                    aria-label="Enter your prompt"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            e.currentTarget.form?.requestSubmit();
                        }
                    }}
                    value={input}
                    onChange={handleInputChange}
                />
            </form>
        </div>
    );
}
