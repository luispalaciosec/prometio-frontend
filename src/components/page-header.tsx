import type { ReactNode } from "react"

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
    <div className="mb-10 flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        {leading}
        <div className="space-y-1">
          <h1 className="font-heading text-2xl tracking-tight">{title}</h1>
          {description ? (
            typeof description === "string" ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : (
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
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
