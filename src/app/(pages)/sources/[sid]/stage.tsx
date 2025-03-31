'use client'

import { useQuery } from "@tanstack/react-query"
import { SelectSource } from "@/lib/db/schema"
import PageTitle from "@/components/ui/page-title"
import { ReactFlowProvider } from '@xyflow/react'
import Toggle from "./toggle"
import { useState } from "react"
import SourceView from "./source-view"
import NodeList from "./node-list"
import EdgeList from "./edge-list"

export default function Stage({ sid }: { sid: string }) {

    const [view, setView] = useState<"source" | "nodes" | "edges">("source")

    const { data: source, isLoading, error } = useQuery<SelectSource>({
        queryKey: ['sources', `sid-${sid}`],
        queryFn: async () => {
            const response = await fetch(`/api/sources`, {
                method: 'POST',
                body: JSON.stringify({ sid })
            })
            const data = await response.json()
            return data.source[0]
        }
    })

    if (isLoading) {
        return (
            <div className="w-full h-screen flex flex-col">
                <div className="w-full h-14 flex items-center justify-between px-4 shrink-0 grow-0">
                    <PageTitle pageName="sources" attachments={[{ name: "loading...", href: `/sources/${sid}` }]} />
                </div>
                <div className="grow overflow-y-auto rounded-md border bg-muted grid grid-cols-12 gap-4 p-4 mx-4 mb-4">
                    Loading...
                </div>
            </div>
        )
    }

    if (error || !source) {
        return (
            <div className="w-full h-screen flex flex-col">
                Error fetching source details: {error?.message || "Unknown error"}
            </div>
        )
    }

    return (
        <ReactFlowProvider>
            <div className="w-full h-full flex flex-col">
                <div className="w-full h-16 flex items-center justify-between px-4 shrink-0 grow-0 gap-4">
                    <PageTitle pageName="sources" attachments={[{ name: source.file_name, href: `/sources/${sid}` }]} />
                    <Toggle onValueChange={(value) => {
                        setView(value)
                    }} />
                </div>
                {view === "source" &&
                    <div className="p-4 pt-0 grow">
                        <SourceView source={source} />
                    </div>}
                {view === "nodes" &&
                    <div className="mb-4 p-4 pt-0 text-primary grow overflow-hidden h-[calc(100vh-7rem)]">
                        <NodeList source={source} />
                    </div>}
                {view === "edges" &&
                    <div className="mb-4 p-4 pt-0 text-primary grow overflow-hidden h-[calc(100vh-7rem)]">
                        <EdgeList source={source} />
                    </div>}
            </div>
        </ReactFlowProvider>
    )
}
