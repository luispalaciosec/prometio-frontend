import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { CalendarCheck } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { ListSkeleton } from "@/components/skeleton"
import { Badge } from "@/components/ui/badge"
import { listRenovaciones } from "@/lib/api/contrato-recurrente"
import { textoDiasParaVencer } from "@/lib/contrato-recurrente"
import { formatMoney } from "@/lib/costo-interno"
import type { ContratoRenovacion } from "@/types/contrato-recurrente"

const MAX_FILAS = 5

export function DashboardRenovaciones() {
  const [rows, setRows] = useState<ContratoRenovacion[] | null>(null)

  useEffect(() => {
    let cancelled = false
    void listRenovaciones()
      .then((data) => {
        if (!cancelled) {
          setRows(data)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRows([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const enRiesgo = rows?.reduce((sum, row) => sum + row.monto_mensual_total, 0) ?? 0

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-section">Renovaciones próximas</h2>
          <p className="mt-1 text-kicker text-muted-foreground">
            {rows && rows.length > 0
              ? `${formatMoney(enRiesgo)} al mes en juego, sin IVA.`
              : "Contratos que vencen dentro del aviso configurado."}
          </p>
        </div>
        <Link to="/contratos/renovaciones" className="text-ui-medium underline-offset-4 hover:underline">
          Ver todas
        </Link>
      </div>
      {rows == null ? (
        <ListSkeleton rows={3} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="Nada por renovar"
          body="Ningún contrato vence pronto ni quedó vencido sin renovar."
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl ring-1 ring-border">
          {rows.slice(0, MAX_FILAS).map((row) => (
            <li key={row.contrato_id}>
              <Link
                to={`/contratos/${row.contrato_id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-ui-medium">{row.nombre}</p>
                  <p className="truncate text-kicker text-muted-foreground">{row.empresa_nombre ?? "—"}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-ui tabular-nums">{formatMoney(row.monto_mensual_total)}</span>
                  <Badge variant={row.dias_para_vencer < 0 ? "destructive" : "warning"}>
                    {textoDiasParaVencer(row.dias_para_vencer)}
                  </Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {rows && rows.length > MAX_FILAS ? (
        <p className="text-kicker">Y {rows.length - MAX_FILAS} más en Renovaciones.</p>
      ) : null}
    </section>
  )
}
