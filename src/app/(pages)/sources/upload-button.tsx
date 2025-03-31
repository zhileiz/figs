"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { FileImage, FileSpreadsheet, FileText, Presentation, Database, Link2 } from "lucide-react"

export default function UploadButton() {
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const queryClient = useQueryClient()

    const handleFileSelect = (acceptTypes: string) => {
        if (fileInputRef.current) {
            fileInputRef.current.accept = acceptTypes
            fileInputRef.current.click()
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setIsUploading(true)

            // Create form data
            const formData = new FormData()
            formData.append('file', file)

            // Send to API
            const response = await fetch('/api/s3/upload', {
                method: 'POST',
                body: formData,
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.message || 'Failed to upload file')
            }

            // Success
            toast.success("File uploaded successfully", {
                description: `File "${file.name}" has been uploaded.`,
            })

            // Refresh the page data to show the new source
            router.refresh()
        } catch (error) {
            console.error('Upload error:', error)
            toast.error("Upload failed", {
                description: error instanceof Error ? error.message : "An unexpected error occurred",
            })
        } finally {
            setIsUploading(false)
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
            // Invalidate the sources query
            queryClient.invalidateQueries({ queryKey: ['sources'] })
        }
    }

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                aria-label="Upload file"
            />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        className="max-sm:p-0"
                        disabled={isUploading}
                        aria-label={isUploading ? "Uploading..." : "Add new source"}
                    >
                        {isUploading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 opacity-60" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="max-sm:sr-only">Uploading...</span>
                            </span>
                        ) : (
                            <>
                                <Plus className="opacity-60 sm:-ms-1" size={16} aria-hidden="true" />
                                <span className="max-sm:sr-only">Add Source</span>
                            </>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>File Upload</DropdownMenuLabel>

                    <TooltipProvider delayDuration={100}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DropdownMenuItem onClick={() => handleFileSelect(".csv,.xls,.xlsx")}>
                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                    <span>Tables</span>
                                </DropdownMenuItem>
                            </TooltipTrigger>
                            <TooltipContent
                                side="bottom"
                                sideOffset={5}
                                className="bg-background/80 text-foreground/80 text-xs border-border/50 backdrop-blur-sm"
                            >
                                Accepts: CSV, XLS, XLSX
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DropdownMenuItem onClick={() => handleFileSelect(".pdf,.doc,.docx,.md,.markdown")}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    <span>Documents</span>
                                </DropdownMenuItem>
                            </TooltipTrigger>
                            <TooltipContent
                                side="bottom"
                                sideOffset={5}
                                className="bg-background/80 text-foreground/80 text-xs border-border/50 backdrop-blur-sm"
                            >
                                Accepts: PDF, DOC, DOCX, Markdown
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DropdownMenuItem onClick={() => handleFileSelect(".png,.jpg,.jpeg")} disabled>
                                    <FileImage className="mr-2 h-4 w-4" />
                                    <span>Images</span>
                                </DropdownMenuItem>
                            </TooltipTrigger>
                            <TooltipContent
                                side="bottom"
                                sideOffset={5}
                                className="bg-background/80 text-foreground/80 text-xs border-border/50 backdrop-blur-sm"
                            >
                                Accepts: PNG, JPG/JPEG
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DropdownMenuItem onClick={() => handleFileSelect(".ppt,.pptx")} disabled>
                                    <Presentation className="mr-2 h-4 w-4" />
                                    <span>Presentations</span>
                                </DropdownMenuItem>
                            </TooltipTrigger>
                            <TooltipContent
                                side="bottom"
                                sideOffset={5}
                                className="bg-background/80 text-foreground/80 text-xs border-border/50 backdrop-blur-sm"
                            >
                                Accepts: PPT, PPTX
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DropdownMenuItem onClick={() => handleFileSelect(".sqlite,.db,.parquet")} disabled>
                                    <Database className="mr-2 h-4 w-4" />
                                    <span>Database Files</span>
                                </DropdownMenuItem>
                            </TooltipTrigger>
                            <TooltipContent
                                side="bottom"
                                sideOffset={5}
                                className="bg-background/80 text-foreground/80 text-xs border-border/50 backdrop-blur-sm"
                            >
                                Accepts: SQLite, Parquet
                            </TooltipContent>
                        </Tooltip>

                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Live Data</DropdownMenuLabel>
                        <DropdownMenuItem disabled>
                            <Database className="mr-2 h-4 w-4" />
                            <span>SQL Connection</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>
                            <Link2 className="mr-2 h-4 w-4" />
                            <span>JSON API</span>
                        </DropdownMenuItem>
                    </TooltipProvider>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
}