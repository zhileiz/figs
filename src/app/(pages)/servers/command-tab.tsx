import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BoxIcon, HouseIcon, PanelsTopLeftIcon } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { CopyInput } from "./copy-input";
export function NPXCommandTabs() {
    return (
        <Tabs defaultValue="tab-1">
            <ScrollArea>
                <TabsList className="before:bg-border relative mb-3 h-auto w-full inline-flex justify-start gap-0.5 bg-transparent p-0 before:absolute before:inset-x-0 before:bottom-0 before:h-px">
                    <TabsTrigger
                        value="tab-1"
                        className="bg-muted overflow-hidden rounded-b-none border-x border-t py-2 data-[state=active]:z-10 data-[state=active]:shadow-none"
                    >
                        <HouseIcon className="-ms-0.5 me-1.5 opacity-60" size={16} aria-hidden="true" />
                        Claude
                    </TabsTrigger>
                    <TabsTrigger
                        value="tab-2"
                        className="bg-muted overflow-hidden rounded-b-none border-x border-t py-2 data-[state=active]:z-10 data-[state=active]:shadow-none"
                    >
                        <PanelsTopLeftIcon className="-ms-0.5 me-1.5 opacity-60" size={16} aria-hidden="true" />
                        Cursor
                    </TabsTrigger>
                    <TabsTrigger
                        value="tab-3"
                        className="bg-muted overflow-hidden rounded-b-none border-x border-t py-2 data-[state=active]:z-10 data-[state=active]:shadow-none"
                    >
                        <BoxIcon className="-ms-0.5 me-1.5 opacity-60" size={16} aria-hidden="true" />
                        Cherry Studio
                    </TabsTrigger>
                </TabsList>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
            <TabsContent value="tab-1">
                <CopyInput
                    label="Command"
                    value={`npx claude-mcp install @smithery-ai/cronwell-fig --provider smithery --config "{\"braveApiKey\":\"aebflndkwef\"}"`}
                    type="text"
                    hideLabel={true}
                />
            </TabsContent>
            <TabsContent value="tab-2">
                <CopyInput
                    label="Command"
                    value={`npx cursor-mcp install @smithery-ai/cronwell-fig --provider smithery --config "{\"braveApiKey\":\"aebflndkwef\"}"`}
                    type="text"
                    hideLabel={true}
                />           
            </TabsContent>
            <TabsContent value="tab-3">
                <CopyInput
                    label="Command"
                    value={`npx cherry-studio-mcp install @smithery-ai/cronwell-fig --provider smithery --config "{\"braveApiKey\":\"aebflndkwef\"}"`}
                    type="text"
                    hideLabel={true}
                />
            </TabsContent>
        </Tabs>
    );
}