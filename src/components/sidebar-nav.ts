import { cn } from "@/lib/utils"

export function sidebarNavClass(isActive: boolean, nested = false) {
  return cn(
    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-ui transition-colors duration-150",
    nested && "py-1.5 pl-8",
    isActive
      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
      : "text-sidebar-foreground/75 hover:bg-muted hover:text-sidebar-foreground",
  )
}
