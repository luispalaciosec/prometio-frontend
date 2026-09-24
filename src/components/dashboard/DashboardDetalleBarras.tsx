import { formatMoney } from "@/lib/costo-interno"
import { cn } from "@/lib/utils"
import type { DashboardDetalleGrupo } from "@/types/dashboard-detalle"

export function DashboardDetalleBarras({
  titulo,
  filas,
}: {
  titulo: string
  filas: DashboardDetalleGrupo[]
}) {
  if (filas.length === 0) {
    return null
  }

  const max = Math.max(...filas.map((row) => row.valor), 1)

  return (
    <div className="space-y-2">
      <h3 className="text-ui-medium">{titulo}</h3>
      <ul className="space-y-2">
        {filas.map((row) => {
          const pct = Math.round((row.valor / max) * 100)
          return (
            <li key={row.nombre}>
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="truncate text-kicker">{row.nombre}</span>
                <span className="shrink-0 text-micro tabular-nums text-muted-foreground">
                  {row.cantidad} · {formatMoney(row.valor)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full bg-primary transition-[width]")}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
