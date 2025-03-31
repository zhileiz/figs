import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { HomeIcon } from "lucide-react";
import { Fragment } from "react";
type FileName = string
type PageName = "graph" | "schema" | "sources" | FileName

type NavItem = {
    name: PageName
    href: string
}

export default function PageTitle({ pageName, attachments }: { pageName: PageName, attachments?: NavItem[] }) {
    const depthRecord: Record<PageName, NavItem[]> = {
        "graph": [
            { name: "graph", href: "/graph" },
        ],
        "schema": [
            { name: "schema", href: "/schema" },
        ],
        "chat": [
            { name: "chat", href: "/chat" },
        ],
        "servers": [
            { name: "servers", href: "/servers" },
        ],
        "sources":  attachments ? [
            { name: "sources", href: "/sources" },
            ...attachments
        ] : [
            { name: "sources", href: "/sources" },
        ],
        "settings": [
            { name: "settings", href: "/settings" },
        ],
    }
    return (
        <Breadcrumb>
            <BreadcrumbList className="bg-background rounded-md border px-3 py-2 shadow-xs">
                <BreadcrumbItem>
                    <BreadcrumbLink href="/">
                        <HomeIcon size={16} aria-hidden="true" />
                        <span className="sr-only">Home</span>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                {depthRecord[pageName].map((item, index, array) => (
                    <Fragment key={`${item.name}-${index}`}>
                        <BreadcrumbSeparator />
                        {index === array.length - 1 ? (
                            <BreadcrumbItem>
                                <BreadcrumbPage className="font-semibold">{item.name.charAt(0).toUpperCase() + item.name.slice(1)}</BreadcrumbPage>
                            </BreadcrumbItem>
                        ) : (
                            <BreadcrumbItem>
                                <BreadcrumbLink href={item.href}>{item.name.charAt(0).toUpperCase() + item.name.slice(1)}</BreadcrumbLink>
                            </BreadcrumbItem>
                        )}
                    </Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
