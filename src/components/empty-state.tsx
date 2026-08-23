import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  body: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col items-center px-4 py-10 text-center", className)}>
      <span className="inline-flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-5" strokeWidth={1.75} aria-hidden />
      </span>
      <p className="mt-4 text-section">{title}</p>
      <p className="mt-1 max-w-[320px] text-kicker">{body}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  )
}
