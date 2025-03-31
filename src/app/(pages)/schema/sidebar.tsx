'use client';

import { useChat, Message } from '@ai-sdk/react';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';

// A unique ID for this specific chat interface
const CHAT_ID = 'schema-assistant-chat';
// Key for localStorage
const STORAGE_KEY = `chat-history-${CHAT_ID}`;

export default function Sidebar() {
    const queryClient = useQueryClient();
    const [initialMessages, setInitialMessages] = useState<Message[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load chat history from localStorage on component mount
    useEffect(() => {
        try {
            const savedMessages = localStorage.getItem(STORAGE_KEY);
            if (savedMessages) {
                setInitialMessages(JSON.parse(savedMessages));
            }
        } catch (error) {
            console.error('Failed to load chat history:', error);
        }
        setIsLoaded(true);
    }, []);

    const { messages, input, handleInputChange, handleSubmit, setMessages } = useChat({
        api: '/api/agent/schema',
        maxSteps: 5, // Enable multi-step tool calls
        id: CHAT_ID, // Set a unique ID for this chat
        initialMessages: initialMessages, // Load initial messages from state
    });

    // Save messages to localStorage whenever they change
    useEffect(() => {
        if (isLoaded && messages.length > 0) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
            } catch (error) {
                console.error('Failed to save chat history:', error);
            }
        }
    }, [messages, isLoaded]);

    // Function to clear chat history
    const clearChatHistory = () => {
        localStorage.removeItem(STORAGE_KEY);
        setMessages([]);
        setInitialMessages([]);
    };

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
                    // Tool call is being made
                    if (invocation.toolName === 'createNodeSchema') {
                        const schemaArgs = invocation.args as any;
                        return (
                            <div key={index} className="bg-gray-50 p-3 rounded-lg mb-3 border border-gray-200">
                                <div className="text-sm text-gray-600 mb-1">Creating schema for node type:</div>
                                <div className="font-medium mb-2">{schemaArgs.name}</div>
                                {schemaArgs.schema && schemaArgs.schema.length > 0 && (
                                    <div className="mt-2">
                                        <div className="text-sm text-gray-600 mb-1">Fields:</div>
                                        <ul className="list-disc pl-5">
                                            {schemaArgs.schema.map((field: any, i: number) => (
                                                <li key={i} className="text-sm">
                                                    <span className="font-medium">{field.key_name}</span>: {field.value_type}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        );
                    } else if (invocation.toolName === 'renameNodeSchema') {
                        const schemaArgs = invocation.args as any;
                        return (
                            <div key={index} className="bg-gray-50 p-3 rounded-lg mb-3 border border-gray-200">
                                <div className="text-sm text-gray-600 mb-1">Renaming node type:</div>
                                <div className="font-medium mb-2">
                                    <span className="line-through mr-2">{schemaArgs.name}</span>
                                    <span className="text-blue-600">→</span>
                                    <span className="ml-2">{schemaArgs.new_name}</span>
                                </div>
                            </div>
                        );
                    } else if (invocation.toolName === 'updateNodeSchema') {
                        const schemaArgs = invocation.args as any;
                        return (
                            <div key={index} className="bg-gray-50 p-3 rounded-lg mb-3 border border-gray-200">
                                <div className="text-sm text-gray-600 mb-1">Updating schema for node type:</div>
                                <div className="font-medium mb-2">{schemaArgs.name}</div>
                                {schemaArgs.schema && schemaArgs.schema.length > 0 && (
                                    <div className="mt-2">
                                        <div className="text-sm text-gray-600 mb-1">Updated fields:</div>
                                        <ul className="list-disc pl-5">
                                            {schemaArgs.schema.map((field: any, i: number) => (
                                                <li key={i} className="text-sm">
                                                    <span className="font-medium">{field.key_name}</span>: {field.value_type}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        );
                    } else if (invocation.toolName === 'deleteNodeSchema') {
                        const schemaArgs = invocation.args as any;
                        return (
                            <div key={index} className="bg-gray-50 p-3 rounded-lg mb-3 border border-gray-200">
                                <div className="text-sm text-gray-600 mb-1">Deleting node type:</div>
                                <div className="font-medium mb-2 text-red-600">{schemaArgs.name}</div>
                            </div>
                        );
                    } else {
                        return (
                            <div key={index} className="text-gray-600 text-sm italic bg-gray-50 p-2 rounded mb-2">
                                Using {invocation.toolName}...
                            </div>
                        );
                    }
                } else if (invocation.state === 'result') {
                    // Tool call has completed with result
                    if (invocation.toolName === 'createNodeSchema' && invocation.result) {
                        const result = invocation.result as any;
                        if (result.success) {
                            queryClient.invalidateQueries({ queryKey: ['nodeTypes'] });
                            return (
                                <div key={index} className="bg-green-50 p-3 rounded-lg mb-3 border border-green-200">
                                    <div className="text-green-700 font-medium mb-1">✓ Schema Created Successfully</div>
                                    <div className="text-sm">{result.message}</div>
                                    {result.schema && (
                                        <div className="mt-2 p-2 bg-white rounded border border-green-100">
                                            <pre className="text-xs overflow-auto">
                                                {JSON.stringify(result.schema, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            );
                        } else {
                            // Handle error case
                            return (
                                <div key={index} className="bg-red-50 p-3 rounded-lg mb-3 border border-red-200">
                                    <div className="text-red-700 font-medium mb-1">⚠️ Schema Creation Failed</div>
                                    <div className="text-sm">{result.error || "An unknown error occurred"}</div>
                                    {result.schema && (
                                        <div className="mt-2 p-2 bg-white rounded border border-red-100">
                                            <pre className="text-xs overflow-auto">
                                                {JSON.stringify(result.schema, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            );
                        }
                    } else if (invocation.toolName === 'renameNodeSchema' && invocation.result) {
                        const result = invocation.result as any;
                        if (result.success) {
                            queryClient.invalidateQueries({ queryKey: ['nodeTypes'] });
                            return (
                                <div key={index} className="bg-green-50 p-3 rounded-lg mb-3 border border-green-200">
                                    <div className="text-green-700 font-medium mb-1">✓ Schema Renamed Successfully</div>
                                    <div className="text-sm">{result.message}</div>
                                </div>
                            );
                        } else {
                            return (
                                <div key={index} className="bg-red-50 p-3 rounded-lg mb-3 border border-red-200">
                                    <div className="text-red-700 font-medium mb-1">⚠️ Schema Rename Failed</div>
                                    <div className="text-sm">{result.error || "An unknown error occurred"}</div>
                                </div>
                            );
                        }
                    } else if (invocation.toolName === 'updateNodeSchema' && invocation.result) {
                        const result = invocation.result as any;
                        if (result.success) {
                            queryClient.invalidateQueries({ queryKey: ['nodeTypes'] });
                            return (
                                <div key={index} className="bg-green-50 p-3 rounded-lg mb-3 border border-green-200">
                                    <div className="text-green-700 font-medium mb-1">✓ Schema Updated Successfully</div>
                                    <div className="text-sm">{result.message}</div>
                                    {result.schema && (
                                        <div className="mt-2 p-2 bg-white rounded border border-green-100">
                                            <pre className="text-xs overflow-auto">
                                                {JSON.stringify(result.schema, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            );
                        } else {
                            return (
                                <div key={index} className="bg-red-50 p-3 rounded-lg mb-3 border border-red-200">
                                    <div className="text-red-700 font-medium mb-1">⚠️ Schema Update Failed</div>
                                    <div className="text-sm">{result.error || "An unknown error occurred"}</div>
                                    {result.schema && (
                                        <div className="mt-2 p-2 bg-white rounded border border-red-100">
                                            <pre className="text-xs overflow-auto">
                                                {JSON.stringify(result.schema, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            );
                        }
                    } else if (invocation.toolName === 'deleteNodeSchema' && invocation.result) {
                        const result = invocation.result as any;
                        if (result.success) {
                            queryClient.invalidateQueries({ queryKey: ['nodeTypes'] });
                            return (
                                <div key={index} className="bg-green-50 p-3 rounded-lg mb-3 border border-green-200">
                                    <div className="text-green-700 font-medium mb-1">✓ Schema Deleted Successfully</div>
                                    <div className="text-sm">{result.message}</div>
                                </div>
                            );
                        } else {
                            return (
                                <div key={index} className="bg-red-50 p-3 rounded-lg mb-3 border border-red-200">
                                    <div className="text-red-700 font-medium mb-1">⚠️ Schema Deletion Failed</div>
                                    <div className="text-sm">{result.error || "An unknown error occurred"}</div>
                                </div>
                            );
                        }
                    } else if (invocation.toolName === 'createEdgeSchema' && invocation.result) {
                        const result = invocation.result as any;
                        if (result.success) {
                            queryClient.invalidateQueries({ queryKey: ['edgeTypes'] });
                        }
                    } else if (invocation.toolName === 'deleteEdgeSchema' && invocation.result) {
                        const result = invocation.result as any;
                        if (result.success) {
                            queryClient.invalidateQueries({ queryKey: ['edgeTypes'] });
                        }
                    } else if (invocation.toolName === 'renameEdgeSchema' && invocation.result) {
                        const result = invocation.result as any;
                        if (result.success) {
                            queryClient.invalidateQueries({ queryKey: ['edgeTypes'] });
                        }
                    } else {
                        return (
                            <div key={index} className="text-gray-600 text-sm italic mb-2">
                                Got results from {invocation.toolName}
                            </div>
                        );
                    }
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
        <div className="h-screen w-full bg-white flex flex-col">
            <div className="flex justify-between items-center border-b border-gray-200 p-4">
                <h2 className="text-xl font-bold text-black">Schema Editor</h2>
                {messages.length > 0 && (
                    <button 
                        onClick={clearChatHistory}
                        className="text-sm text-gray-600 hover:text-red-600 px-2 py-1 rounded border border-gray-300 hover:border-red-300"
                    >
                        Clear History
                    </button>
                )}
            </div>
            
            {/* Messages container with scrolling */}
            <div className="flex-1 overflow-auto p-4">
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

            {/* Input form fixed at bottom */}
            <form onSubmit={handleSubmit} className="mt-auto p-4 border-t border-gray-200">
                <input
                    className="w-full p-2 border border-gray-300 rounded shadow-sm"
                    value={input}
                    placeholder="Ask about schemas and data modeling..."
                    onChange={handleInputChange}
                />
            </form>
        </div>
    );
}