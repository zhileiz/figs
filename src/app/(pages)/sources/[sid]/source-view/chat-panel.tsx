import { Button } from "@/components/ui/button"
import { RefreshCcw } from "lucide-react"
import { useChat, Message } from '@ai-sdk/react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { SelectSource } from "@/lib/db/schema"
import { useQueryClient } from "@tanstack/react-query";

const CHAT_ID = 'ingestion-helper-chat';

export default function ChatPanel({ source }: { source: SelectSource }) {
    const queryClient = useQueryClient();
    const { messages, input, handleInputChange, handleSubmit, setMessages } = useChat({
        api: '/api/agent/sources',
        maxSteps: 5, // Enable multi-step tool calls
        id: CHAT_ID, // Set a unique ID for this chat
        initialMessages: [], // Load initial messages from state
        body: {
            file_name: source.file_name,
            file_url: source.file_url,
        },
    });

    const getMessageContent = (message: Message) => {
        if (message.role === 'user') {
            return <div className="bg-blue-50 p-4 rounded-lg mb-4">{message.content}</div>;
        }

        // Check if message.parts exists, otherwise return content as fallback
        if (!message.parts || message.parts.length === 0) {
            return (
                <div className="mb-2 prose prose-sm">
                    <ReactMarkdown
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                            pre: ({ children }) => <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm mb-4 mt-2 border border-gray-200">{children}</pre>,
                            code: ({ className, children, ...props }) => {
                                return !className ? (
                                    <code className="bg-gray-50 px-1 py-0.5 rounded text-sm font-mono">{children}</code>
                                ) : (
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                );
                            }
                        }}
                    >
                        {String(message.content)}
                    </ReactMarkdown>
                </div>
            );
        }

        return message.parts.map((part, index) => {
            if ('text' in part) {
                return (
                    <div key={index} className="mb-2 prose prose-sm">
                        <ReactMarkdown
                            rehypePlugins={[rehypeHighlight]}
                            components={{
                                pre: ({ children }) => <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm mb-4 mt-2 border border-gray-200">{children}</pre>,
                                code: ({ className, children, ...props }) => {
                                    return !className ? (
                                        <code className="bg-gray-50 px-1 py-0.5 rounded text-sm font-mono">{children}</code>
                                    ) : (
                                        <code className={className} {...props}>
                                            {children}
                                        </code>
                                    );
                                }
                            }}
                        >
                            {String(part.text)}
                        </ReactMarkdown>
                    </div>
                );
            }
            if ('content' in part) {
                return (
                    <div key={index} className="mb-2 prose prose-sm">
                        <ReactMarkdown
                            rehypePlugins={[rehypeHighlight]}
                            components={{
                                pre: ({ children }) => <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm mb-4 mt-2 border border-gray-200">{children}</pre>,
                                code: ({ className, children, ...props }) => {
                                    return !className ? (
                                        <code className="bg-gray-50 px-1 py-0.5 rounded text-sm font-mono">{children}</code>
                                    ) : (
                                        <code className={className} {...props}>
                                            {children}
                                        </code>
                                    );
                                }
                            }}
                        >
                            {String(part.content)}
                        </ReactMarkdown>
                    </div>
                );
            }
            if ('toolInvocation' in part) {
                const invocation = part.toolInvocation;
                if (invocation.state === 'call') {
                    return null
                } else if (invocation.state === 'result') {
                    if (invocation.toolName === 'createNodeInKGForCSV') {
                        queryClient.invalidateQueries({ queryKey: ['source-nodes', source.id] });
                    }
                    return (
                        <div key={index} className="text-gray-600 text-sm italic mb-2">
                            Got results from {invocation.toolName}
                        </div>
                    );
                }
            }
            if ('reasoning' in part) {
                return (
                    <div key={index} className="text-gray-600 text-sm italic p-2 bg-gray-50 rounded mb-2">
                        <div className="font-medium mb-1">Thinking:</div>
                        {part.reasoning}
                    </div>
                );
            }
            return null;
        });
    };

    return (
        <div className="h-full bg-white rounded-md border w-96 flex flex-col max-h-[calc(100vh-80px)] overflow-hidden">
            {/* Chat Header */}
            <div className="h-12 flex items-center justify-between px-4 shrink-0 grow-0 gap-4 border-b">
                <h2 className="text-lg font-semibold text-primary">Ingestion Helper</h2>
                <Button variant="ghost" className="p-1 w-min h-min" onClick={() => setMessages([])}>
                    <RefreshCcw className="w-5 h-5" />
                    <span>Reset</span>
                </Button>
            </div>
            {/* Chat History */}
            <div className="p-4 grow overflow-y-auto bg-muted">
                {messages.length === 0 ? (
                    <div className="text-gray-500 text-center py-8">
                        No messages yet. Start a conversation!
                    </div>
                ) : (
                    messages.map((m: Message) => (
                        <div key={m.id} className="mb-4">
                            <div className="font-semibold mb-1">
                                {m.role === 'user' ? 'You' : 'Assistant'}:
                            </div>
                            <div>
                                {getMessageContent(m)}
                            </div>
                        </div>
                    ))
                )}
            </div>
            {/* Chat Input */}
            <form onSubmit={handleSubmit} className="mt-auto p-4 border-t border-gray-200">
                <input
                    className="w-full p-2 border border-gray-300 rounded shadow-sm"
                    value={input}
                    placeholder="Chat about ingesting data..."
                    onChange={handleInputChange}
                />
            </form>
        </div>
    )
}