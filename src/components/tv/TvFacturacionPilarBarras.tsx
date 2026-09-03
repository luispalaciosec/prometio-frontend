import { formatMoney } from "@/lib/costo-interno"
import { cn } from "@/lib/utils"
import {
  PILAR_FINANCIERO_LABELS,
  PILAR_FINANCIERO_ORDEN,
  type FacturacionPorPilar,
} from "@/types/tv-financiero"

const FILL_TONO: Record<keyof FacturacionPorPilar, string> = {
  marca: "bg-primary",
  crecimiento: "bg-success",
  transformacion: "bg-highlight",
  transversal: "bg-warning",
  sin_clasificar: "bg-muted-foreground/60",
}

export function TvFacturacionPilarBarras({ pilares }: { pilares: FacturacionPorPilar }) {
  const filas = PILAR_FINANCIERO_ORDEN.map((key) => ({
    key,
    label: PILAR_FINANCIERO_LABELS[key],
    monto: pilares[key] ?? 0,
  })).filter((row) => row.monto > 0)

  if (filas.length === 0) {
    return <p className="text-kicker text-muted-foreground">Sin facturación este mes.</p>
  }

  const max = Math.max(...filas.map((row) => row.monto), 1)

  return (
    <ul className="space-y-2.5">
      {filas.map((row) => {
        const pct = Math.round((row.monto / max) * 100)
        return (
          <li key={row.key}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="truncate text-ui">{row.label}</span>
              <span className="shrink-0 text-kicker tabular-nums text-muted-foreground">
                {formatMoney(row.monto)}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-[width]", FILL_TONO[row.key])}
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
