import { SelectSource } from "@/lib/db/schema"
import SourcePanel from "./source-panel";
import ChatPanel from "./chat-panel";

export default function SourceView({ source }: { source: SelectSource }) {
    return (
        <div className="w-full h-full flex items-center justify-center gap-4">
            {/* <ParserButton source={source} /> */}
            <SourcePanel source={source} />
            <ChatPanel source={source} />
        </div>
    );
}