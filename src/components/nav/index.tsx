'use client'
import { cn } from "@/lib/utils"
import { useState } from "react"
import NavigationIconLink from "./nav-item"
import {
  Bot,
  Grape,
  FileUp,
  ServerCog,
  Shapes,
  Waypoints,
  Settings
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

export default function Nav() {
  const [isExpanded, setIsExpanded] = useState(false)

  const graphItems = [
    {
      label: "Graph",
      icon: <Waypoints className="w-5 h-5" />,
      href: `/graph`,
      exact: true,
    },
    {
      label: "Schema",
      icon: <Shapes className="w-5 h-5" />,
      href: `/schema`,
      exact: true,
    },
    {
      label: "Sources",
      icon: <FileUp className="w-5 h-5" />,
      href: `/sources`,
      exact: false,
    },
  ]

  const secondaryItems = [
    {
      label: "Playground",
      icon: <Bot className="w-5 h-5" />,
      href: `/chat`,
      exact: false,
    },
    {
      label: "Servers",
      icon: <ServerCog className="w-5 h-5" />,
      href: `/servers`,
      exact: false,
    },
  ]

  const tailItems = [
    {
      label: "Settings",
      icon: <Settings className="w-5 h-5" />,
      href: `/settings`,
      exact: false,
    },  
  ]

  return (
    <nav
      data-state={isExpanded ? 'expanded' : 'collapsed'}
      className={cn(
        'group py-2 z-10 h-full w-14 data-[state=expanded]:w-[13rem]',
        'border-r bg-white dark:bg-black border-default data-[state=expanded]:shadow-xl',
        'transition-width duration-150',
        'hide-scrollbar flex flex-col justify-start overflow-y-auto overflow-x-hidden gap-2'
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <Link href="/">
        <button className="relative mt-2 mb-2 ml-4 h-6 w-[13rem] flex flex-row items-center justify-start gap-2 select-none">
          <Grape className="w-6 h-6 text-brand-900" />
          {isExpanded && <h2 className="text-md font-bold text-brand-900">FIG Studio</h2>}
        </button>
      </Link>
      <Separator className="mb-1" />
      <ul className="flex flex-col gap-y-1 justify-start px-2">
        {graphItems.map((item, index) => (
          <NavigationIconLink
            key={index}
            isExpanded={isExpanded}
            label={item.label}
            icon={item.icon}
            href={item.href}
            exact={item.exact}
          />
        ))}
      </ul>
      <Separator className="mb-1" />
      <ul className="flex flex-col gap-y-1 justify-start px-2 mb-2">
        {secondaryItems.map((item, index) => (
          <NavigationIconLink
            key={index}
            isExpanded={isExpanded}
            label={item.label}
            icon={item.icon}
            href={item.href}
            exact={item.exact}
          />
        ))}
      </ul>
      <div className="grow"></div>
      <ul className="flex flex-col gap-y-1 justify-start px-2 mb-2">
      {tailItems.map((item, index) => (
        <NavigationIconLink
          key={index}
          isExpanded={isExpanded}
          label={item.label}
          icon={item.icon}
          href={item.href}
          exact={item.exact}
        />
      ))}
      </ul>
    </nav>
  )
}
