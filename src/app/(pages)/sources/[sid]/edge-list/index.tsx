import { useEffect, useState } from "react";
import { useEdgeTypes } from "@/lib/react-query/useSchema";
import { SelectEdgeType } from "@/lib/db/schema";
import EdgeTypeSelector from "./edge-type-selector";
import PropertyTable from "./property-table";
import { SelectSource } from "@/lib/db/schema";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

export default function EdgeList({ source }: { source: SelectSource }) {
  const { data: edgeTypesData, isLoading: edgeTypesLoading, isError: edgeTypesError } = useEdgeTypes(true)
  const [selectedEdgeType, setSelectedEdgeType] = useState<SelectEdgeType | null>(null)
  const onSelect = (edgeType: SelectEdgeType) => {
    setSelectedEdgeType(edgeType)
  }

  useEffect(() => {
    if (edgeTypesData && edgeTypesData.length > 0) {
      setSelectedEdgeType(edgeTypesData[0])
    }
  }, [edgeTypesData])

  if (edgeTypesLoading) return <div>Loading...</div>
  if (edgeTypesError || !edgeTypesData || !selectedEdgeType) return <div>Error loading edge types</div>

  return (
    <ResizablePanelGroup direction="horizontal" className="w-full h-[calc(100vh-72px)] border rounded-md">
      <ResizablePanel className="overflow-y-auto" defaultSize={20} minSize={15} maxSize={35}>
        <EdgeTypeSelector onSelect={onSelect} edgeTypes={edgeTypesData || []} selectedEdgeType={selectedEdgeType} source={source}/>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel className="overflow-y-auto" defaultSize={80} minSize={65} maxSize={85}>
        {selectedEdgeType && <PropertyTable selectedEdgeType={selectedEdgeType} source={source}/>}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
