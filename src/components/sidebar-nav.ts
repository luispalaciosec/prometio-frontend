import { cn } from "@/lib/utils"

export function sidebarNavClass(isActive: boolean, nested = false) {
  return cn(
    "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors duration-150",
    nested && "py-1",
    isActive
      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_2px_0_0_0_var(--highlight)]"
      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground",
  )
}
