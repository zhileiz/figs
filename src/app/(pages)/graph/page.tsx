"use client"

import PageTitle from "@/components/ui/page-title"
import GraphView from "./graph-view"
import Toggle from "./toggle"
import { useState } from "react"
import NodeList from "./node-list"
import EdgeList from "./edge-list"
import { useMeasure } from "@uidotdev/usehooks"

export default function Page() {
  const [view, setView] = useState<"graph" | "nodes" | "edges">("graph");
  const [ref, { width, height }] = useMeasure();

  const handleToggle = (value: "graph" | "nodes" | "edges") => {
    setView(value);
  };

  return (
    <div className="h-full flex flex-col px-4 w-screen">
      <div className="w-full h-14 flex justify-between shrink-0 grow-0 items-center">
        <PageTitle pageName="graph" />
        <Toggle onValueChange={handleToggle} />
      </div>
      <div className="mb-4 pt-0 text-primary grow rounded-md border overflow-hidden w-full h-[calc(100vh-7rem)]" ref={ref}>
        {view === "graph" 
          ? <GraphView width={width} height={height} /> 
          : view === "nodes" ? <NodeList /> : <EdgeList />}
      </div>
    </div>
  )
}
