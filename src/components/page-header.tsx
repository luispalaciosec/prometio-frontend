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
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        {leading}
        <div className="space-y-1">
          <h1 className="text-page">{title}</h1>
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
      {action}
    </div>
  )
}
