import { SelectSource } from "@/lib/db/schema"
import CsvSource from "./source-display/csv-source";

export default function SourceView({ source }: { source: SelectSource }) {
    return (
        <div className="grow h-full bg-muted rounded-md border relative overflow-hidden">
            <div className="absolute inset-0 overflow-auto">
                {source.mime_type.includes('csv') && <CsvSource source={source} />}
            </div>
        </div>
    );
}