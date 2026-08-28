import { Star } from "lucide-react"

import { cn } from "@/lib/utils"

const NOTAS = [1, 2, 3, 4, 5] as const

export function CalificacionEstrellas({
  value,
  onChange,
}: {
  value: number | null
  onChange?: (value: number | null) => void
}) {
  const interactive = Boolean(onChange)

  if (!interactive && value == null) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <div className="flex items-center gap-1">
      {NOTAS.map((nota) => {
        const activa = value != null && nota <= value
        const star = (
          <Star
            className={cn(
              "size-3.5",
              activa ? "fill-foreground text-foreground" : "text-muted-foreground",
            )}
            strokeWidth={1.75}
            aria-hidden
          />
        )
        if (!interactive) {
          return <span key={nota}>{star}</span>
        }
        return (
          <button
            key={nota}
            type="button"
            className="rounded-md p-0.5 hover:bg-muted"
            aria-label={`${nota} de 5`}
            aria-pressed={activa}
            onClick={() => onChange?.(nota)}
          >
            {star}
          </button>
        )
      })}
      {value != null ? <span className="text-kicker tabular-nums">{value}</span> : null}
      {interactive ? (
        <button
          type="button"
          className="ml-1 text-kicker text-muted-foreground hover:text-foreground"
          onClick={() => onChange?.(null)}
        >
          Sin calificar
        </button>
      ) : null}
    </div>
  )
}
