"use client"

import PageTitle from "@/components/ui/page-title"
import ServerStatusBoard from "./server-status-board"

export default function ServersPage() {

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="w-full h-14 flex items-center justify-between px-4 shrink-0 grow-0">
        <PageTitle pageName="servers" />
      </div>
      <ServerStatusBoard />
    </div>
  )
}
