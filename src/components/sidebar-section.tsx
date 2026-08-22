import { useEffect, useState, type ReactNode } from "react"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

export function SidebarSection({
  title,
  active,
  children,
}: {
  title: string
  active: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(active)

  useEffect(() => {
    if (active) {
      setOpen(true)
    }
  }, [active])

  return (
    <div className="mt-3 first:mt-0">
      <button
        type="button"
        aria-expanded={open}
        className="flex w-full items-center gap-1 rounded-md px-2 py-1 text-[0.65rem] font-medium tracking-wider text-sidebar-foreground/45 uppercase hover:text-sidebar-foreground/70"
        onClick={() => setOpen((prev) => !prev)}
      >
        {title}
        <ChevronRight
          className={cn("ml-auto size-3.5 transition-transform duration-150", open && "rotate-90")}
        />
      </button>
      {open ? <div className="mt-0.5 flex flex-col gap-0.5">{children}</div> : null}
    </div>
  )
}
