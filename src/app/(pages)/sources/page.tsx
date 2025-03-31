import PageTitle from "@/components/ui/page-title"
import UploadButton from "./upload-button"
import SourceGrid from "./source-grid"

export default function Page() {
  return (
    <div className="w-full h-screen flex flex-col">
      <div className="w-full h-14 flex items-center justify-between px-4 shrink-0 grow-0">
        <PageTitle pageName="sources" />
        <div className="flex items-center gap-2">
          <UploadButton />
        </div>
      </div>
      <SourceGrid />
    </div>
  )
}
