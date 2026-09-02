import { formatMoney } from "@/lib/costo-interno"
import { tonoEtapa } from "@/lib/etapa-tono"
import { cn } from "@/lib/utils"
import type { EtapaPipelineCodigo } from "@/types/etapa-pipeline"
import type { PipelinePorEtapa } from "@/types/dashboard"

const FILL_TONO = {
  temprana: "bg-primary",
  media: "bg-warning",
  ganado: "bg-success",
  perdido: "bg-destructive",
} as const

export function TvPipelineBarras({ etapas }: { etapas: PipelinePorEtapa[] }) {
  const abiertas = etapas
    .filter((row) => row.etapa !== "cierre_ganado" && row.etapa !== "cierre_perdido")
    .sort((a, b) => b.valor_en_juego - a.valor_en_juego)
    .slice(0, 5)

  if (abiertas.length === 0) {
    return <p className="text-kicker text-muted-foreground">Sin pipeline abierto.</p>
  }

  const max = Math.max(...abiertas.map((row) => row.valor_en_juego), 1)

  return (
    <ul className="space-y-3">
      {abiertas.map((row) => {
        const pct = Math.round((row.valor_en_juego / max) * 100)
        const tono = FILL_TONO[tonoEtapa(row.etapa as EtapaPipelineCodigo)]
        return (
          <li key={row.etapa}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="truncate text-ui">{row.nombre}</span>
              <span className="shrink-0 text-kicker tabular-nums text-muted-foreground">
                {formatMoney(row.valor_en_juego)} · {row.cantidad}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full rounded-full transition-[width]", tono)} style={{ width: `${pct}%` }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
