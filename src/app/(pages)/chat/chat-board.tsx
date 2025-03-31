"use client";

import { useEffect, useState } from "react";
import SystemPrompt from "./system-prompt";
import ChatInput from "./chat-input";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';

const CHAT_ID = 'playground-chat';

export default function ChatBoard({ resetPosted, setResetPosted }: { resetPosted: boolean, setResetPosted: (value: boolean) => void }) {
    const [isEditingSystemPrompt, setIsEditingSystemPrompt] = useState(false);
    const [systemPrompt, setSystemPrompt] = useState(`You are a helpful assistant that can answer questions about the knowledge graph.
  You can use the tools provided to help you answer questions.`);

    const { messages, input, handleInputChange, handleSubmit, setMessages } = useChat({
        api: '/api/agent/chat',
        maxSteps: 20, // Enable multi-step tool calls
        id: CHAT_ID, // Set a unique ID for this chat
        initialMessages: [], // Load initial messages from state
        body: {
            systemPrompt: systemPrompt,
        },
    });

    useEffect(() => {
        if (resetPosted) {
            setMessages([]);
            setResetPosted(false);
        }
    }, [resetPosted]);

    useEffect(() => {
        setMessages([]);
        setResetPosted(true);
    }, [systemPrompt]);

    const handleSubmit2 = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log('submit');
        handleSubmit();
    };

    const handleSystemPromptKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            setSystemPrompt(e.currentTarget.value);
            setIsEditingSystemPrompt(false);
        }
    };

    return (
        <div className="grow border rounded-md mx-4 mb-4 bg-muted overflow-y-auto flex flex-col">
            <SystemPrompt
                isEditingSystemPrompt={isEditingSystemPrompt}
                setIsEditingSystemPrompt={setIsEditingSystemPrompt}
                systemPrompt={systemPrompt}
                handleSystemPromptKeyDown={handleSystemPromptKeyDown}
            />
            {/* Chat messages */}
            <div className="grow flex flex-col gap-4 px-4 py-2">
                {messages.map((message, index) => (
                    <div key={index} className={`min-w-[80%] max-w-ful w-min ${message.role === 'user' ? 'self-end bg-brand-50 border-brand-500' : 'self-start bg-white'} rounded-lg p-4 border`}>
                        <div className={`font-semibold mb-2 ${message.role === 'user' ? 'text-blue-700' : 'text-gray-700'}`}>
                            {message.role === 'user' ? 'You' : 'Assistant'}
                        </div>
                        <div className="prose prose-sm max-w-none">
                            {message.parts && message.parts.length > 0 ? (
                                message.parts.map((part, partIndex) => {
                                    if ('text' in part || 'content' in part) {
                                        const content = 'text' in part ? part.text : part.content;
                                        return (
                                            <ReactMarkdown
                                                key={partIndex}
                                                rehypePlugins={[rehypeHighlight]}
                                                components={{
                                                    pre: ({ children }) => (
                                                        <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm mb-4 mt-2 border border-gray-200">
                                                            {children}
                                                        </pre>
                                                    ),
                                                    code: ({ className, children, ...props }) => (
                                                        !className ? (
                                                            <code className="bg-gray-50 px-1 py-0.5 rounded text-sm font-mono">
                                                                {children}
                                                            </code>
                                                        ) : (
                                                            <code className={className} {...props}>
                                                                {children}
                                                            </code>
                                                        )
                                                    )
                                                }}
                                            >
                                                {String(content)}
                                            </ReactMarkdown>
                                        );
                                    }
                                    if ('toolInvocation' in part) {
                                        const invocation = part.toolInvocation;
                                        if (invocation.state === 'result' && invocation.toolName === 'runCypherQuery') {
                                            return (
                                                <div key={partIndex} className=" rounded-lg border p-2 px-4">
                                                    <div className="text-green-700 font-medium">
                                                        How I figured it out:
                                                    </div>
                                                    <div className="">
                                                        <pre className="text-xs overflow-auto m-0 bg-white text-muted-foreground max-w-[600px] whitespace-pre-wrap break-all">
                                                            {invocation.args.query}
                                                        </pre>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    }
                                    if ('reasoning' in part) {
                                        return (
                                            <div key={partIndex} className="text-gray-600 text-sm italic p-2 bg-gray-50 rounded mb-2">
                                                <div className="font-medium mb-1">Thinking:</div>
                                                {part.reasoning}
                                            </div>
                                        );
                                    }
                                    return null;
                                })
                            ) : (
                                <ReactMarkdown
                                    rehypePlugins={[rehypeHighlight]}
                                    components={{
                                        pre: ({ children }) => (
                                            <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm mb-4 mt-2 border border-gray-200">
                                                {children}
                                            </pre>
                                        ),
                                        code: ({ className, children, ...props }) => (
                                            !className ? (
                                                <code className="bg-gray-50 px-1 py-0.5 rounded text-sm font-mono">
                                                    {children}
                                                </code>
                                            ) : (
                                                <code className={className} {...props}>
                                                    {children}
                                                </code>
                                            )
                                        )
                                    }}
                                >
                                    {String(message.content)}
                                </ReactMarkdown>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <ChatInput handleSubmit={handleSubmit2} input={input} handleInputChange={handleInputChange} />
        </div>
    )
}