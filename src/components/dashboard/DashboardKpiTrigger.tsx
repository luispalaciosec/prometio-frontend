import type { ReactNode, Ref } from "react"

import { cn } from "@/lib/utils"

export function DashboardKpiTrigger({
  children,
  ariaLabel,
  onOpen,
  triggerRef,
  className,
}: {
  children: ReactNode
  ariaLabel: string
  onOpen: (source: HTMLButtonElement) => void
  triggerRef?: Ref<HTMLButtonElement>
  className?: string
}) {
  return (
    <button
      ref={triggerRef}
      type="button"
      aria-label={ariaLabel}
      className={cn(
        "group w-full cursor-pointer rounded-xl text-left transition-[box-shadow,transform] duration-200",
        "hover:shadow-modal hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "active:translate-y-0",
        className,
      )}
      onClick={(event) => onOpen(event.currentTarget)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onOpen(event.currentTarget)
        }
      }}
    >
      {children}
    </button>
  )
}
