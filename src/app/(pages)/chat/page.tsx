"use client"

import PageTitle from "@/components/ui/page-title"
import ChatBoard from "./chat-board"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function Page() {
  const [resetPosted, setResetPosted] = useState(false)

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="w-full h-14 flex items-center justify-between px-4 shrink-0 grow-0">
        <PageTitle pageName="chat" />
        <Button variant="outline" onClick={() => setResetPosted(true)}>Reset</Button>
      </div>
      <ChatBoard resetPosted={resetPosted} setResetPosted={setResetPosted}/>
    </div>
  )
}
