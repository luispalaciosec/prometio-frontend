import { formatMoney } from "@/lib/costo-interno"
import type { MetaVendedor } from "@/types/dashboard"

export function TvMetasLista({ filas }: { filas: MetaVendedor[] }) {
  if (filas.length === 0) {
    return <p className="text-kicker text-muted-foreground">Sin metas individuales en el período.</p>
  }

  return (
    <ul className="space-y-3">
      {filas.map((row) => {
        const pct = Math.min(100, Math.round(row.avance_pct))
        return (
          <li key={row.perfil_id}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="truncate text-ui">{row.nombre_completo}</span>
              <span className="shrink-0 text-kicker tabular-nums text-muted-foreground">
                {formatMoney(row.valor_cerrado)} / {formatMoney(row.monto_meta)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-success transition-[width]"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-0.5 text-micro tabular-nums text-muted-foreground">{pct}%</p>
          </li>
        )
      })}
    </ul>
  )
}
