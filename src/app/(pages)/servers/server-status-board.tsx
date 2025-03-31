"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CopyInput } from "./copy-input";
import { NPXCommandTabs } from "./command-tab";

interface ServiceStatus {
    isRunning: boolean;
    lastChecked: Date;
}

interface OpenAIConfig {
    apiUrl: string;
    apiKey: string;
}

interface DatabaseConfig {
    url: string;
    username: string;
    password: string;
}


export default function ServerStatusBoard() {
    const [openAIStatus, setOpenAIStatus] = useState<ServiceStatus>({ isRunning: true, lastChecked: new Date() });
    const [dbStatus, setDbStatus] = useState<ServiceStatus>({ isRunning: true, lastChecked: new Date() });
    const [mcpStatus, setMcpStatus] = useState<ServiceStatus>({ isRunning: true, lastChecked: new Date() });

    const [openAIConfig, setOpenAIConfig] = useState<OpenAIConfig>({ apiUrl: 'localhost:3000/api/v1/openai', apiKey: 'sk-proj-1234567890' });
    const [dbConfig, setDbConfig] = useState<DatabaseConfig>({ url: 'localhost:3000/api/v1/db', username: 'root', password: 'password' });

    // TODO: Implement actual status checks and config fetching
    useEffect(() => {
        // Simulated status checks - replace with actual API calls
        const checkStatuses = async () => {
            // Add your actual status check logic here
        };

        const interval = setInterval(checkStatuses, 30000); // Check every 30 seconds
        checkStatuses();

        return () => clearInterval(interval);
    }, []);

    const StatusBadge = ({ isRunning }: { isRunning: boolean }) => (
        <Badge
            variant="outline"
            className={`${isRunning ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}
        >
            {isRunning ? "Running" : "Down"}
        </Badge>
    );

    return (
        <div className="grow border rounded-md mx-4 mb-4 bg-muted overflow-y-auto flex flex-col px-32 py-4">
            <div className="w-full mx-auto flex flex-col gap-4">
                <div className="flex flex-col bg-white rounded-md border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold">OpenAI Compatible API</h3>
                            <StatusBadge isRunning={openAIStatus.isRunning} />
                        </div>
                        <span className="text-sm text-gray-500">
                            Last checked: {openAIStatus.lastChecked.toLocaleTimeString()}
                        </span>
                    </div>
                    <div className="space-y-4">
                        <CopyInput
                            label="API URL"
                            value={openAIConfig.apiUrl || 'Not configured'}
                            type="text"
                        />
                        <CopyInput
                            label="API Key"
                            value={openAIConfig.apiKey || 'Not configured'}
                            type="password"
                        />
                    </div>
                </div>

                <div className="flex flex-col bg-white rounded-md border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold">Database Connection</h3>
                            <StatusBadge isRunning={dbStatus.isRunning} />
                        </div>
                        <span className="text-sm text-gray-500">
                            Last checked: {dbStatus.lastChecked.toLocaleTimeString()}
                        </span>
                    </div>
                    <div className="space-y-4">
                        <CopyInput
                            label="Database URL"
                            value={dbConfig.url || 'Not configured'}
                            type="text"
                        />
                        <CopyInput
                            label="Username"
                            value={dbConfig.username || 'Not configured'}
                            type="text"
                        />
                        <CopyInput
                            label="Password"
                            value={dbConfig.password || 'Not configured'}
                            type="password"
                        />
                    </div>
                </div>

                <div className="flex flex-col bg-white rounded-md border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold">MCP Server</h3>
                            <StatusBadge isRunning={mcpStatus.isRunning} />
                        </div>
                        <span className="text-sm text-gray-500">
                            Last checked: {mcpStatus.lastChecked.toLocaleTimeString()}
                        </span>
                    </div>
                    <div className="space-y-4">
                        <NPXCommandTabs />
                    </div>
                </div>
            </div>
        </div>
    );
}