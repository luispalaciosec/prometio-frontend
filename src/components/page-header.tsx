import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function PageHeader({
  title,
  description,
  action,
  leading,
  flagship = false,
}: {
  title: string
  description?: ReactNode
  action?: ReactNode
  leading?: ReactNode
  flagship?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4",
        flagship ? "mb-6" : "mb-10",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {leading}
        <div className="space-y-1">
          <h1 className={flagship ? "text-page" : "font-heading text-2xl tracking-tight"}>
            {title}
          </h1>
          {description ? (
            typeof description === "string" ? (
              <p className={flagship ? "text-kicker" : "text-sm text-muted-foreground"}>
                {description}
              </p>
            ) : (
              <div
                className={cn(
                  "flex flex-wrap items-center gap-2",
                  flagship ? "text-kicker" : "text-sm text-muted-foreground",
                )}
              >
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
