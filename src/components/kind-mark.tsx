import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const SIZE = {
  sm: { well: "size-7 rounded-md", icon: "size-3.5" },
  md: { well: "size-8 rounded-lg", icon: "size-4" },
  lg: { well: "size-11 rounded-xl", icon: "size-5" },
} as const

export function KindMark({
  icon: Icon,
  tone,
  size = "sm",
  label,
}: {
  icon: LucideIcon
  tone: string
  size?: keyof typeof SIZE
  label?: string
}) {
  const slot = SIZE[size]
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span
        className={cn("inline-flex shrink-0 items-center justify-center", slot.well, tone)}
      >
        <Icon className={slot.icon} strokeWidth={1.75} aria-hidden />
      </span>
      {label ? <span className="truncate text-ui-medium">{label}</span> : null}
    </span>
  )
}
