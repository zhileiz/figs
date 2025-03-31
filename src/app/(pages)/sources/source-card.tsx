import { SelectSource } from "@/lib/db/schema";
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { FileImage, FileSpreadsheet, FileText, Presentation, Database, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useQuery } from "@tanstack/react-query"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B'
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}

function getFileIcon(mimeType: string) {
    if (mimeType.startsWith('image/')) {
        return <FileImage className="grow-0 shrink-0 h-4 w-4" />
    } else if (mimeType === 'text/csv' || mimeType === 'application/vnd.ms-excel' || mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        return <FileSpreadsheet className="grow-0 shrink-0 h-4 w-4" />
    } else if (mimeType === 'application/vnd.ms-powerpoint' || mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
        return <Presentation className="grow-0 shrink-0 h-4 w-4" />
    } else if (mimeType === 'application/x-sqlite3' || mimeType === 'application/parquet') {
        return <Database className="grow-0 shrink-0 h-4 w-4" />
    } else {
        return <FileText className="grow-0 shrink-0 h-4 w-4" />
    }
}

export default function SourceCard({source} : {source : SelectSource}) {
    const queryClient = useQueryClient()

    const { data: stats } = useQuery({
        queryKey: ['source-stats', source.id],
        queryFn: async () => {
            const response = await fetch('/api/memgraph/stats', {
                method: 'POST',
                body: JSON.stringify({ source_path: source.file_url })
            })
            if (!response.ok) {
                throw new Error('Failed to fetch source stats')
            }
            const data = await response.json()
            return data.result
        }
    })

    const handleDelete = async () => {
        try {
            const response = await fetch('/api/sources', {
                method: 'DELETE',
                body: JSON.stringify({ id: source.id })
            })
            if (!response.ok) {
                throw new Error('Failed to delete source')
            }
            toast.success("Source deleted successfully")
            queryClient.invalidateQueries({ queryKey: ['sources'] })
        } catch (error) {
            toast.error("Failed to delete source")
            console.error('Error deleting source:', error)
        }
    }

    return (
        <div className="col-span-3 h-48 bg-white rounded-md border hover:shadow-md transition-shadow">
            <div className="w-full h-full flex flex-col p-4">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        {getFileIcon(source.mime_type)}
                        <Link href={`/sources/${source.id}`} className="font-medium truncate hover:underline">
                            {source.file_name}
                        </Link>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="text-xs text-gray-500 truncate">{source.mime_type}</div>
                <div className="text-xs text-gray-500">{new Date(source.created_at).toLocaleString()}</div>
                <div className="mt-auto flex items-center justify-between">
                    <div className="text-xs text-gray-500">{formatFileSize(source.file_size)}</div>
                    {stats && (
                        <div className="flex items-center gap-4">
                            {stats.nodeCount === 0 && stats.edgeCount === 0 ? (
                               <Badge variant="outline" className="text-xs text-gray-500">unindexed</Badge> 
                            ) : (
                                <>
                                    { stats.nodeCount > 0 && <div className="text-sm text-gray-500">
                                        <span className="font-medium text-brand-800">{stats.nodeCount}</span> nodes
                                    </div> }
                                    { stats.edgeCount > 0 && <div className="text-sm text-gray-500">
                                        <span className="font-medium text-brand-800">{stats.edgeCount}</span> edges
                                    </div> }
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}