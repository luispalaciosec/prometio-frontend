import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function PageHeader({
  title,
  description,
  action,
  leading,
}: {
  title: string
  description?: ReactNode
  action?: ReactNode
  leading?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="flex min-w-0 items-center gap-3">
        {leading}
        <div className="min-w-0 space-y-1">
          <div className="mb-0.5 h-1 w-11 rounded-full bg-linear-to-r from-primary to-highlight" aria-hidden />
          <h1 className="text-page break-words tracking-tight">{title}</h1>
          {description ? (
            typeof description === "string" ? (
              <p className="text-kicker">{description}</p>
            ) : (
              <div className={cn("flex flex-wrap items-center gap-2 text-kicker")}>
                {description}
              </div>
            )
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0 sm:pt-0.5">{action}</div> : null}
    </div>
  )
}
