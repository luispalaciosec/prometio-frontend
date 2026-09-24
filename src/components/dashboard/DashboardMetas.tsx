import { Link } from "react-router-dom"
import { CircleDollarSign, Percent, Target } from "lucide-react"

import { DashboardKpiTrigger } from "@/components/dashboard/DashboardKpiTrigger"
import { EmptyState } from "@/components/empty-state"
import { KpiCard } from "@/components/kpi-card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatMoney } from "@/lib/costo-interno"
import { formatDateOnly } from "@/lib/datetime-local"
import { etiquetaPeriodo } from "@/lib/meta-comercial"
import type { MetasComerciales } from "@/types/dashboard"

function avanceLabel(pct: number | null | undefined): string {
  if (pct == null) {
    return "—"
  }
  return `${pct.toFixed(1)}%`
}

export function DashboardMetas({
  metas,
  puedeConfigurar,
  onAbrirDetalleMeta,
}: {
  metas: MetasComerciales
  puedeConfigurar: boolean
  onAbrirDetalleMeta: (source: HTMLButtonElement, previewValor: string, previewTitulo: string) => void
}) {
  const hayTotal = metas.meta_total != null
  const hayVendedores = metas.por_vendedor.length > 0
  const periodo =
    metas.periodo_tipo && metas.fecha_inicio && metas.fecha_fin
      ? `${etiquetaPeriodo(metas.periodo_tipo)} · ${formatDateOnly(metas.fecha_inicio)} – ${formatDateOnly(metas.fecha_fin)}`
      : null

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-section">Meta comercial</h2>
        {periodo ? <p className="mt-1 text-kicker">{periodo}. El rango del dashboard no cambia este período.</p> : null}
      </div>
      {!hayTotal && !hayVendedores ? (
        <EmptyState
          icon={Target}
          title="Sin meta vigente"
          body={
            puedeConfigurar
              ? "No hay una meta que cubra hoy. Cargá la de la agencia o la de cada vendedor."
              : "Cuando te asignen una meta para este período, el avance aparece acá."
          }
          action={
            puedeConfigurar ? (
              <Button asChild variant="ghost" size="sm">
                <Link to="/configuracion/meta-comercial">Cargar meta</Link>
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          {hayTotal ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <DashboardKpiTrigger
                ariaLabel="Ver detalle de la meta comercial"
                onOpen={(source) =>
                  onAbrirDetalleMeta(source, formatMoney(metas.meta_total ?? 0), "Meta comercial")
                }
              >
                <KpiCard
                  title="Meta"
                  value={formatMoney(metas.meta_total ?? 0)}
                  icon={Target}
                  tone="bg-primary/15 text-primary"
                />
              </DashboardKpiTrigger>
              <DashboardKpiTrigger
                ariaLabel="Ver detalle del monto cerrado"
                onOpen={(source) =>
                  onAbrirDetalleMeta(source, formatMoney(metas.valor_cerrado_total), "Cerrado hacia la meta")
                }
              >
                <KpiCard
                  title="Cerrado"
                  value={formatMoney(metas.valor_cerrado_total)}
                  icon={CircleDollarSign}
                  tone="bg-success/15 text-success"
                />
              </DashboardKpiTrigger>
              <DashboardKpiTrigger
                ariaLabel="Ver detalle del avance comercial"
                onOpen={(source) =>
                  onAbrirDetalleMeta(source, avanceLabel(metas.avance_total_pct), "Avance de la meta")
                }
              >
                <KpiCard
                  title="Avance"
                  value={avanceLabel(metas.avance_total_pct)}
                  icon={Percent}
                  tone="bg-highlight/15 text-highlight"
                />
              </DashboardKpiTrigger>
            </div>
          ) : null}
          {hayVendedores ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendedor</TableHead>
                  <TableHead className="text-right">Meta</TableHead>
                  <TableHead className="text-right">Cerrado</TableHead>
                  <TableHead className="text-right">Avance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metas.por_vendedor.map((row) => (
                  <TableRow key={row.perfil_id}>
                    <TableCell className="text-ui-medium">{row.nombre_completo}</TableCell>
                    <TableCell className="text-right tabular-nums text-ui">{formatMoney(row.monto_meta)}</TableCell>
                    <TableCell className="text-right tabular-nums text-ui">{formatMoney(row.valor_cerrado)}</TableCell>
                    <TableCell className="text-right tabular-nums text-ui">{avanceLabel(row.avance_pct)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </>
      )}
    </section>
  )
}
