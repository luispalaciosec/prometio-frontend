import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { KindMark } from "@/components/kind-mark"
import { cn } from "@/lib/utils"

export function KpiCard({
  title,
  value,
  hint,
  icon,
  tone,
  density = "default",
}: {
  title: string
  value: ReactNode
  hint?: string
  icon: LucideIcon
  tone: string
  /** TV / kiosko: más compacto para columnas estrechas. */
  density?: "default" | "tv"
}) {
  const tv = density === "tv"

  return (
    <div
      className={cn(
        "rounded-xl ring-1 ring-border transition-shadow duration-150 hover:shadow-raised",
        tv ? "p-4" : "p-5",
      )}
    >
      <div className={cn("flex items-start", tv ? "gap-3" : "gap-4")}>
        <KindMark icon={icon} tone={tone} size={tv ? "md" : "lg"} />
        <div className="min-w-0 flex-1">
          <p className={tv ? "text-micro" : "text-kicker"}>{title}</p>
          <p
            className={cn(
              "mt-1 tabular-nums leading-tight",
              tv
                ? "font-heading text-[clamp(1rem,1.65vw,1.375rem)] font-semibold tracking-tight"
                : "text-page",
            )}
          >
            {value}
          </p>
          {hint ? (
            <p className={cn("mt-1", tv ? "line-clamp-2 text-micro" : "text-kicker")}>{hint}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
