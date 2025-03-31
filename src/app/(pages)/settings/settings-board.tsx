"use client";

import { ApikeySetting, LangsmithSetting, ResetSetting } from "./sections";

export default function SettingsBoard() {
    return (
        <div className="grow border rounded-md mx-4 mb-4 bg-muted overflow-y-auto flex flex-col px-32 py-4">
            <div className="w-full mx-auto flex flex-col gap-4">
                <ApikeySetting />

                <div className="flex flex-col bg-white rounded-md border p-4 space-y-3">
                    <h2 className="text-xl font-semibold">Observability</h2>
                    <p className="text-sm text-gray-500">
                        Configure observability settings to monitor your LLM operations.
                    </p>
                    <LangsmithSetting />
                </div>

                <div className="flex flex-col bg-red-50 rounded-md border border-red-200 p-4 space-y-3">
                    <h2 className="text-xl font-semibold text-red-600">Danger Zone</h2>
                    <p className="text-sm text-black">
                        These actions are destructive and cannot be undone. Please proceed with caution.
                    </p>
                    <ResetSetting />
                </div>
            </div>
        </div>
    );
}