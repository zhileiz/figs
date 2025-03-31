"use client"

import {
  Pullout,
  PulloutMain,
  PulloutTrigger,
  PulloutDrawer,
  PulloutHandle
} from "@/components/ui/pullout"
import { Bot, PanelRightClose } from "lucide-react"
import PageTitle from "@/components/ui/page-title"
import Sidebar from "./sidebar"
import Main from "./main"
import { ReactFlowProvider } from '@xyflow/react'

export default function Page() {
  return (
    <ReactFlowProvider>
      <Pullout
        direction="right"
        defaultOpen={false}
        minWidth={350}
        maxWidth={500}
        defaultWidth={450}
      >
        <PulloutMain className="w-full h-full flex flex-col">
          <div className="w-full h-14 flex items-center justify-between px-4 shrink-0 grow-0">
            <PageTitle pageName="schema" />
            <PulloutTrigger asChild>
              {({ isOpen }) => isOpen ? (
                <button className="h-min p-1 flex items-center gap-2 text-md font-medium">
                  <PanelRightClose className="w-5 h-5" /> Close Assistant
                </button>
              ) : (
                <button className="h-min p-1 flex items-center gap-2 text-md font-medium">
                  <Bot className="w-5 h-5" /> Schema Assistant
                </button>
              )}
            </PulloutTrigger>
          </div>
          <div className="p-4 pt-0 text-white grow">
            <div className="w-full h-full rounded-md border overflow-hidden">
              <Main />
            </div>
          </div>
        </PulloutMain>

        <PulloutDrawer className="border-l">
          <PulloutHandle />
          <Sidebar />
        </PulloutDrawer>
      </Pullout>
    </ReactFlowProvider>
  )
}
