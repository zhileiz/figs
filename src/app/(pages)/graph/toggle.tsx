"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { File, Workflow } from "lucide-react";
import { useState } from "react";

export default function Toggle({ onValueChange }: { onValueChange: (value: "graph" | "nodes" | "edges") => void }) {
  const [value, setValue] = useState<"graph" | "nodes" | "edges">("graph");

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={value}
      onValueChange={(value) => {
        if (value) setValue(value as "graph" | "nodes" | "edges");
        onValueChange(value as "graph" | "nodes" | "edges");
      }}
    >
      <ToggleGroupItem className="flex-1 px-4 text-nowrap w-32 flex items-center justify-center" value="graph">
        Graph View
      </ToggleGroupItem>
      <ToggleGroupItem className="flex-1 px-4 text-nowrap w-32 flex items-center justify-center" value="nodes">
        Node List
      </ToggleGroupItem>
      <ToggleGroupItem className="flex-1 px-4 text-nowrap w-32 flex items-center justify-center" value="edges">
        Edge List
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
