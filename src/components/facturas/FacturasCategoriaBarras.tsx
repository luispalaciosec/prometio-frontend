import { formatMoney } from "@/lib/costo-interno"
import { cn } from "@/lib/utils"
import type { CategoriaFacturada } from "@/types/factura"

const TONOS = [
  "bg-primary",
  "bg-success",
  "bg-highlight",
  "bg-warning",
  "bg-primary/70",
  "bg-success/70",
  "bg-muted-foreground/50",
] as const

export function FacturasCategoriaBarras({ filas }: { filas: CategoriaFacturada[] }) {
  if (filas.length === 0) {
    return <p className="text-kicker text-muted-foreground">Sin líneas de facturación en este período.</p>
  }

  const max = Math.max(...filas.map((row) => row.monto), 1)

  return (
    <ul className="space-y-2.5">
      {filas.map((row, index) => {
        const pct = Math.round((row.monto / max) * 100)
        const tono = TONOS[index % TONOS.length]
        return (
          <li key={`${row.categoria}-${index}`}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="truncate text-ui" title={row.categoria}>
                {row.categoria}
              </span>
              <span className="shrink-0 text-kicker tabular-nums text-muted-foreground">
                {formatMoney(row.monto)}
                <span className="text-micro"> · {row.lineas} líneas</span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-[width]", tono)}
                style={{ width: `${pct}%` }}
                role="presentation"
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
