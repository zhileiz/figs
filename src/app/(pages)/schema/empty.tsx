import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Empty({ onCreate }: { onCreate: () => void }) {
    const queryClient = useQueryClient()

    const createNewNodeType = async () => {
        await fetch('/api/schema/node', {
            method: 'POST',
            body: JSON.stringify({
                name: "NewType",
                color: "#2563EB",
                schema: [],
            }),
        }).then((res) => res.json()).then((data) => {
            console.log("NODE POSITION UPDATED", data)
        })
    }

    const onClick = async () => {
        await createNewNodeType()
        queryClient.invalidateQueries({ queryKey: ['nodeTypes'] })
        onCreate()
    }

    return <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-gray-500 p-6">No schema defined yet. Chat with the Schema Assistant or create a node type.</p>
        <Button variant="outline" className="text-primary text-sm" onClick={onClick}>
            <Plus className="w-5 h-5" /> Create New Node Type
        </Button>
    </div>
}