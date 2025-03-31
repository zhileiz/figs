"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { File, Workflow } from "lucide-react";
import { useState } from "react";

export default function Toggle({ onValueChange }: { onValueChange: (value: "source" | "nodes" | "edges") => void }) {
  const [value, setValue] = useState<"source" | "nodes" | "edges">("source");

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={value}
      onValueChange={(value) => {
        if (value) setValue(value as "source" | "nodes" | "edges");
        onValueChange(value as "source" | "nodes" | "edges");
      }}
    >
      <ToggleGroupItem className="flex-1 px-4 text-nowrap w-24 flex items-center justify-center" value="source">
        Source
      </ToggleGroupItem>
      <ToggleGroupItem className="flex-1 px-4 text-nowrap w-24 flex items-center justify-center" value="nodes">
        Nodes
      </ToggleGroupItem>
      <ToggleGroupItem className="flex-1 px-4 text-nowrap w-24 flex items-center justify-center" value="edges">
        Edges
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
