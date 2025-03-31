import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { toast } from "sonner"

export default function ResetSetting() {
    const [isResetGraphOpen, setIsResetGraphOpen] = useState(false)
    const [isResetProjectOpen, setIsResetProjectOpen] = useState(false)
    const [confirmGraphText, setConfirmGraphText] = useState("")
    const [confirmProjectText, setConfirmProjectText] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleResetGraph = async () => {
        if (confirmGraphText !== "reset") return
        setIsLoading(true)
        try {
            const response = await fetch('/api/settings/reset/graph', {
                method: 'DELETE',
            })
            const data = await response.json()
            if (data.success) {
                toast.success(data.message)
                setIsResetGraphOpen(false)
                setConfirmGraphText("")
            } else {
                toast.error(data.message || 'Failed to reset graph')
            }
        } catch (error) {
            toast.error('Failed to reset graph')
        } finally {
            setIsLoading(false)
        }
    }

    const handleResetProject = async () => {
        if (confirmProjectText !== "reset project") return
        setIsLoading(true)
        try {
            const response = await fetch('/api/settings/reset/project', {
                method: 'DELETE',
            })
            const data = await response.json()
            if (data.success) {
                toast.success(data.message)
                setIsResetProjectOpen(false)
                setConfirmProjectText("")
            } else {
                toast.error(data.message || 'Failed to reset project')
            }
        } catch (error) {
            toast.error('Failed to reset project')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border border-red-200 rounded-md">
                <div>
                    <h3 className="font-medium">Reset Graph Data</h3>
                    <p className="text-sm text-gray-500">This will only reset nodes and edges, preserving schema and files.</p>
                </div>
                <Button 
                    variant="destructive" 
                    onClick={() => setIsResetGraphOpen(true)}
                    disabled={isLoading}
                >
                    Reset Graph
                </Button>
            </div>
            <div className="flex items-center justify-between p-4 border border-red-200 rounded-md">
                <div>
                    <h3 className="font-medium">Reset All Data</h3>
                    <p className="text-sm text-gray-500">This will delete all data including schema and files.</p>
                </div>
                <Button 
                    variant="destructive"
                    onClick={() => setIsResetProjectOpen(true)}
                    disabled={isLoading}
                >
                    Reset Everything
                </Button>
            </div>

            <Dialog open={isResetGraphOpen} onOpenChange={setIsResetGraphOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset Graph Data</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete all nodes and edges from the graph.
                            Type &ldquo;reset&rdquo; to confirm.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        placeholder="Type 'reset' to confirm"
                        value={confirmGraphText}
                        onChange={(e) => setConfirmGraphText(e.target.value)}
                    />
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsResetGraphOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleResetGraph}
                            disabled={confirmGraphText !== "reset" || isLoading}
                        >
                            Reset Graph
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isResetProjectOpen} onOpenChange={setIsResetProjectOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset Entire Project</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete all data, including schema and files.
                            Type &ldquo;reset project&rdquo; to confirm.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        placeholder="Type 'reset project' to confirm"
                        value={confirmProjectText}
                        onChange={(e) => setConfirmProjectText(e.target.value)}
                    />
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsResetProjectOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleResetProject}
                            disabled={confirmProjectText !== "reset project" || isLoading}
                        >
                            Reset Project
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}