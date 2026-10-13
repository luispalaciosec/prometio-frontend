import { Flag, ShieldCheck, TrendingUp } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { KpiCard } from "@/components/kpi-card"
import { TilesSkeleton } from "@/components/skeleton"
import { mesActualEcuador } from "@/lib/contrato-recurrente"
import { formatMoney } from "@/lib/costo-interno"
import { feesPorGenerar, pipelinePonderado } from "@/lib/dashboard-comercial"
import { formatDateOnly } from "@/lib/datetime-local"
import type { ProyeccionMes } from "@/types/contrato-recurrente"
import type { MetasComerciales, PendientePorFacturar } from "@/types/dashboard"
import type { EtapaPipeline } from "@/types/etapa-pipeline"
import type { Oportunidad } from "@/types/oportunidad"

const TRAMOS = [
  { key: "cerrado", label: "Cerrado", color: "var(--success)" },
  { key: "porFacturar", label: "Por facturar", color: "var(--warning)" },
  { key: "fees", label: "Fees por generar", color: "var(--primary)" },
  { key: "pipeline", label: "Pipeline ponderado", color: "color-mix(in oklab, var(--primary) 35%, transparent)" },
] as const

type TramoKey = (typeof TRAMOS)[number]["key"]

export function DashboardForecast({
  metas,
  pendiente,
  oportunidades,
  etapas,
  proyeccion,
  soloLoPropio,
}: {
  metas: MetasComerciales
  pendiente: PendientePorFacturar
  oportunidades: Oportunidad[] | null
  etapas: EtapaPipeline[] | null
  proyeccion: ProyeccionMes[] | null
  /** Vendedor: su meta y lo cerrado en el CRM. Equipo: meta de agencia y lo facturado. */
  soloLoPropio: boolean
}) {
  const meta = metas.meta_total
  if (meta == null || !metas.fecha_fin) {
    return null
  }

  const cargando = oportunidades == null || etapas == null || proyeccion == null
  const montos: Record<TramoKey, number> = {
    cerrado: metas.valor_cerrado_total,
    porFacturar: pendiente.monto,
    fees: proyeccion ? feesPorGenerar(proyeccion, mesActualEcuador(), metas.fecha_fin.slice(0, 7)) : 0,
    pipeline: oportunidades && etapas ? pipelinePonderado(oportunidades, etapas) : 0,
  }
  const comprometido = montos.cerrado + montos.porFacturar + montos.fees
  const forecast = comprometido + montos.pipeline
  const escala = Math.max(meta, forecast) || 1
  const brecha = meta - forecast
  const avance = meta > 0 ? (forecast / meta) * 100 : null

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-section">Forecast contra la meta</h2>
        <p className="mt-1 text-kicker text-muted-foreground">
          Hasta el {formatDateOnly(metas.fecha_fin)}. {soloLoPropio ? "Lo cerrado en el CRM" : "Lo facturado (Contífico)"}{" "}
          + lo aceptado sin factura + los fees de contratos que faltan generar + el pipeline abierto
          por su probabilidad. El pipeline no tiene fecha estimada de cierre: cuenta entero en el
          período.
        </p>
      </div>
      {cargando ? (
        <TilesSkeleton count={3} className="sm:grid-cols-3" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard
              title="Forecast"
              value={formatMoney(forecast)}
              hint={avance != null ? `${avance.toFixed(0)}% de la meta de ${formatMoney(meta)}` : undefined}
              icon={TrendingUp}
              tone="bg-primary/15 text-primary"
            />
            <KpiCard
              title="Comprometido"
              value={formatMoney(comprometido)}
              hint="Cerrado + por facturar + fees, sin pipeline"
              icon={ShieldCheck}
              tone="bg-success/15 text-success"
            />
            <KpiCard
              title={brecha > 0 ? "Falta para la meta" : "Sobre la meta"}
              value={formatMoney(Math.abs(brecha))}
              hint={brecha > 0 ? "Aun cerrando el pipeline ponderado" : "Con el pipeline ponderado"}
              icon={Flag}
              tone={brecha > 0 ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"}
            />
          </div>
          {forecast === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="Sin nada proyectado"
              body="Todavía no hay facturado, fees ni pipeline abierto para este período."
            />
          ) : (
            <div className="space-y-2 surface-card p-4 sm:p-5">
              <div className="relative h-4 overflow-hidden rounded-full bg-muted">
                <div className="flex h-full">
                  {TRAMOS.map((tramo) => (
                    <div
                      key={tramo.key}
                      className="h-full"
                      style={{
                        width: `${(montos[tramo.key] / escala) * 100}%`,
                        background: tramo.color,
                      }}
                    />
                  ))}
                </div>
                <div
                  aria-hidden
                  className="absolute inset-y-0 w-0.5 bg-foreground"
                  style={{ left: `calc(${Math.min(100, (meta / escala) * 100)}% - 1px)` }}
                />
              </div>
              <ul className="flex flex-wrap gap-x-4 gap-y-1">
                {TRAMOS.map((tramo) => (
                  <li key={tramo.key} className="flex items-center gap-1.5 text-kicker">
                    <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: tramo.color }} />
                    {tramo.label}
                    <span className="tabular-nums text-foreground">{formatMoney(montos[tramo.key])}</span>
                  </li>
                ))}
                <li className="flex items-center gap-1.5 text-kicker">
                  <span aria-hidden className="h-3 w-0.5 shrink-0 bg-foreground" />
                  Meta
                  <span className="tabular-nums text-foreground">{formatMoney(meta)}</span>
                </li>
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  )
}
