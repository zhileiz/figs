"use client"

import { SelectSource } from "@/lib/db/schema"
import { useQuery } from "@tanstack/react-query"
import SourceCard from "./source-card"
import { FileImage, FileSpreadsheet, FileText, Presentation, Database } from "lucide-react"
import { Separator } from "@/components/ui/separator"

type SourceType = {
    name: string;
    icon: React.ReactNode;
    description: string;
    mimeTypes: string[];
    extensions: string[];
}

const sourceTypes: SourceType[] = [
    {
        name: "Tables",
        icon: <FileSpreadsheet className="h-5 w-5" />,
        description: "Spreadsheets and tabular data files",
        mimeTypes: ["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
        extensions: [".csv", ".xls", ".xlsx"]
    },
    {
        name: "Documents",
        icon: <FileText className="h-5 w-5" />,
        description: "Text documents and PDFs",
        mimeTypes: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/markdown"],
        extensions: [".pdf", ".doc", ".docx", ".md", ".markdown"]
    },
    {
        name: "Images",
        icon: <FileImage className="h-5 w-5" />,
        description: "Image files and graphics",
        mimeTypes: ["image/png", "image/jpeg", "image/jpg"],
        extensions: [".png", ".jpg", ".jpeg"]
    },
    {
        name: "Presentations",
        icon: <Presentation className="h-5 w-5" />,
        description: "Slideshow presentations",
        mimeTypes: ["application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
        extensions: [".ppt", ".pptx"]
    },
    {
        name: "Database Files",
        icon: <Database className="h-5 w-5" />,
        description: "Database and data storage files",
        mimeTypes: ["application/x-sqlite3", "application/parquet"],
        extensions: [".sqlite", ".db", ".parquet"]
    }
]

function getSourceType(mimeType: string): SourceType | undefined {
    return sourceTypes.find(type =>
        type.mimeTypes.includes(mimeType) ||
        type.extensions.some(ext => mimeType.endsWith(ext))
    )
}

export default function SourceGrid() {
    const { data: sources, isLoading, error } = useQuery<SelectSource[]>({
        queryKey: ['sources'],
        queryFn: async () => {
            const response = await fetch('/api/sources')
            if (!response.ok) {
                throw new Error('Failed to fetch sources')
            }
            const data = await response.json()
            return data.sources as SelectSource[]
        }
    })

    if (isLoading) {
        return (
            <div className="grow overflow-y-auto rounded-md border bg-muted grid grid-cols-12 gap-4 p-4 mx-4 mb-4">
                <div className="col-span-12 flex items-center justify-center h-48">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
            </div>
        )
    }

    if (error || !sources) {
        return (
            <div className="grow overflow-y-auto rounded-md border bg-muted grid grid-cols-12 gap-4 p-4 mx-4 mb-4">
                <div className="col-span-12 flex items-center justify-center h-48 text-red-500">
                    Error fetching sources: {error?.message || "No Sources, Unknown error"}
                </div>
            </div>
        )
    }

    // Group sources by type
    const sourcesByType = new Map<string, SelectSource[]>()
    const otherSources: SelectSource[] = []

    sources.forEach(source => {
        const type = getSourceType(source.mime_type)
        if (type) {
            if (!sourcesByType.has(type.name)) {
                sourcesByType.set(type.name, [])
            }
            sourcesByType.get(type.name)?.push(source)
        } else {
            otherSources.push(source)
        }
    })

    return (
        <div className="grow overflow-y-auto rounded-md border bg-muted p-4 mx-4 mb-4">
            <div className="space-y-8">
                {sourceTypes.map(type => {
                    const typeSources = sourcesByType.get(type.name) || []
                    if (typeSources.length === 0) return null

                    return (
                        <div key={type.name} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-medium flex items-end gap-2">
                                        {type.name}
                                    </h2>
                                    <span className="text-sm text-gray-500 font-normal">
                                        ({typeSources.length})
                                    </span>
                                </div>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-12 gap-4 pt-2">
                                {typeSources.map((source) => (
                                    <SourceCard source={source} key={source.id} />
                                ))}
                            </div>
                        </div>
                    )
                })}
                {otherSources.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-medium flex items-end gap-2">
                                    Other sources
                                </h2>
                                <span className="text-sm text-gray-500 font-normal">
                                    ({otherSources.length})
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-12 gap-4">
                            {otherSources.map((source) => (
                                <SourceCard source={source} key={source.id} />
                            ))}
                        </div>
                    </div>
                )}
                {sources.length === 0 && (
                    <div className="col-span-12 flex items-center justify-center h-48 text-gray-500">
                        No sources found. Add your first source.
                    </div>
                )}
            </div>
        </div>
    )
}