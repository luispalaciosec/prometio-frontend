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
    <div className={cn("flex flex-col items-center px-4 py-8 text-center", className)}>
      <Icon className="size-5 text-muted-foreground" strokeWidth={1.75} aria-hidden />
      <p className="mt-3 text-ui-medium">{title}</p>
      <p className="mt-1 max-w-[280px] text-kicker">{body}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  )
}
