import { Flame } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { leadScoreTierLabel, leadScoreVariant } from "@/lib/lead-score"
import { cn } from "@/lib/utils"

export function LeadScoreBadge({
  score,
  className,
  showIcon = true,
}: {
  score: number
  className?: string
  showIcon?: boolean
}) {
  const variant = leadScoreVariant(score)
  return (
    <Badge
      variant={variant}
      className={cn("tabular-nums", className)}
      title={leadScoreTierLabel(score)}
    >
      {showIcon && score >= 70 ? (
        <Flame className="size-3" strokeWidth={1.75} aria-hidden />
      ) : null}
      {score}
    </Badge>
  )
}
