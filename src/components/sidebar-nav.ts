import { cn } from "@/lib/utils"

export function sidebarNavClass(isActive: boolean, nested = false) {
  return cn(
    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-ui transition-colors duration-150",
    nested && "py-1.5 pl-8",
    isActive
      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-sm ring-1 ring-inset ring-sidebar-primary/20"
      : "text-sidebar-foreground/75 hover:bg-sidebar-accent/55 hover:text-sidebar-accent-foreground",
  )
}
