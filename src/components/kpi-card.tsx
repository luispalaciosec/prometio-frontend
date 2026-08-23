import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { KindMark } from "@/components/kind-mark"

export function KpiCard({
  title,
  value,
  hint,
  icon,
  tone,
}: {
  title: string
  value: ReactNode
  hint?: string
  icon: LucideIcon
  tone: string
}) {
  return (
    <div className="rounded-xl p-5 ring-1 ring-border transition-shadow duration-150 hover:shadow-raised">
      <div className="flex items-start gap-4">
        <KindMark icon={icon} tone={tone} size="lg" />
        <div className="min-w-0">
          <p className="text-kicker">{title}</p>
          <p className="mt-1 text-page tabular-nums">{value}</p>
          {hint ? <p className="mt-1 text-kicker">{hint}</p> : null}
        </div>
      </div>
    </div>
  )
}
