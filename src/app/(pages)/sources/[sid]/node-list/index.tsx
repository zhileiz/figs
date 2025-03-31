import { useEffect, useState } from "react";
import { useNodeTypes } from "@/lib/react-query/useSchema";
import { SelectNodeType } from "@/lib/db/schema";
import NodeTypeSelector from "./node-type-selector";
import PropertyTable from "./property-table";
import { SelectSource } from "@/lib/db/schema";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

export default function NodeList({ source }: { source: SelectSource }) {
  const { data: nodeTypesData, isLoading: nodeTypesLoading, isError: nodeTypesError } = useNodeTypes()
  const [selectedNodeType, setSelectedNodeType] = useState<SelectNodeType | null>(null)
  const onSelect = (nodeType: SelectNodeType) => {
    setSelectedNodeType(nodeType)
  }
  useEffect(() => {
    if (nodeTypesData && nodeTypesData.length > 0) {
      setSelectedNodeType(nodeTypesData[0])
    }
  }, [nodeTypesData])
  if (nodeTypesLoading) return <div>Loading...</div>
  if (nodeTypesError || !nodeTypesData || !selectedNodeType) return <div>Error loading node types</div>
  return (
    <ResizablePanelGroup direction="horizontal" className="w-full h-[calc(100vh-72px)] border rounded-md">
      <ResizablePanel className="overflow-y-auto" defaultSize={20} minSize={15} maxSize={35}>
        <NodeTypeSelector onSelect={onSelect} nodeTypes={nodeTypesData || []} selectedNodeType={selectedNodeType} source={source}/>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel className="overflow-y-auto" defaultSize={80} minSize={65} maxSize={85}>
        {selectedNodeType && <PropertyTable selectedNodeType={selectedNodeType} source={source} />}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
