import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { CotizacionesTorta, PipelineBarras } from "@/components/dashboard/DashboardCharts"
import { DashboardDetalleModal } from "@/components/dashboard/DashboardDetalleModal"
import { DashboardKpiTrigger } from "@/components/dashboard/DashboardKpiTrigger"
import { DashboardMetas } from "@/components/dashboard/DashboardMetas"
import { EmptyState } from "@/components/empty-state"
import { KpiCard } from "@/components/kpi-card"
import { PageHeader } from "@/components/page-header"
import { DashboardSkeleton } from "@/components/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getDashboardKpis } from "@/lib/api/dashboard"
import { formatMoney } from "@/lib/costo-interno"
import { esSoloLoPropio } from "@/lib/pipeline-acceso"
import { useAuthStore } from "@/store/auth-store"
import type { DashboardKPIs } from "@/types/dashboard"
import type { DashboardDetalleRequest } from "@/types/dashboard-detalle"
import { cn } from "@/lib/utils"
import { BarChart3, CalendarClock, CircleDollarSign, CircleOff, Columns3, FileText, Percent } from "lucide-react"

const ESTADO_COTIZACION: Record<string, string> = {
  borrador: "Borrador",
  preparacion: "Preparación",
  enviada: "Enviada",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  vencida: "Vencida",
}

export function DashboardPage() {
  const perfil = useAuthStore((state) => state.perfil)
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [cargando, setCargando] = useState(true)
  const [detalleReq, setDetalleReq] = useState<DashboardDetalleRequest | null>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  function abrirDetalle(req: Omit<DashboardDetalleRequest, "previewValor" | "previewTitulo"> & {
    previewValor: string
    previewTitulo?: string
  }, source: HTMLElement) {
    returnFocusRef.current = source
    setDetalleReq(req)
  }

  async function reload(rango?: { desde: string; hasta: string }) {
    setCargando(true)
    try {
      const data = await getDashboardKpis(
        rango?.desde && rango.hasta
          ? { desde: `${rango.desde}T00:00:00`, hasta: `${rango.hasta}T23:59:59` }
          : {},
      )
      setKpis(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar los indicadores.")
      setKpis(null)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  const conversion = kpis?.conversion
  const tasa =
    conversion?.tasa_conversion_pct == null
      ? "—"
      : `${conversion.tasa_conversion_pct.toFixed(1)}%`
  const pipelineAbierto =
    kpis?.pipeline_por_etapa
      .filter((row) => row.etapa !== "cierre_ganado" && row.etapa !== "cierre_perdido")
      .reduce((sum, row) => sum + row.cantidad, 0) ?? 0

  return (
    <>
      <DashboardDetalleModal
        request={detalleReq}
        onClose={() => setDetalleReq(null)}
        returnFocusRef={returnFocusRef}
      />
      <PageHeader
        title="Dashboard"
        description={
          perfil && esSoloLoPropio(perfil)
            ? "Tus indicadores."
            : "Indicadores del equipo."
        }
      />
      <form
        className="filter-bar"
        onSubmit={(event) => {
          event.preventDefault()
          if (desde && hasta) {
            void reload({ desde, hasta })
            return
          }
          void reload()
        }}
      >
        <div className="filter-field">
          <Label htmlFor="dash-desde">Desde</Label>
          <Input id="dash-desde" type="date" value={desde} onChange={(event) => setDesde(event.target.value)} />
        </div>
        <div className="filter-field">
          <Label htmlFor="dash-hasta">Hasta</Label>
          <Input id="dash-hasta" type="date" value={hasta} onChange={(event) => setHasta(event.target.value)} />
        </div>
        <Button type="submit" variant="outline" disabled={cargando}>
          Aplicar
        </Button>
        <p className="text-kicker">
          El rango solo filtra actividades por vendedor. El resto es el estado actual.
        </p>
      </form>
      {cargando && !kpis ? (
        <DashboardSkeleton />
      ) : kpis == null ? (
        <EmptyState
          icon={BarChart3}
          title="Sin indicadores"
          body="No hay datos de pipeline para armar el dashboard todavía."
        />
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <DashboardKpiTrigger
              ariaLabel="Ver detalle del valor en juego"
              onOpen={(source) =>
                abrirDetalle(
                  {
                    tarjeta: "valor_en_juego",
                    previewValor: formatMoney(kpis.valor_total_en_juego),
                    previewTitulo: "Valor en juego",
                  },
                  source,
                )
              }
            >
              <KpiCard
                title="Valor en juego"
                value={formatMoney(kpis.valor_total_en_juego)}
                icon={CircleDollarSign}
                tone="bg-primary/15 text-primary"
              />
            </DashboardKpiTrigger>
            <DashboardKpiTrigger
              ariaLabel="Ver detalle de conversión"
              onOpen={(source) =>
                abrirDetalle(
                  {
                    tarjeta: "conversion",
                    previewValor: tasa,
                    previewTitulo: "Conversión",
                  },
                  source,
                )
              }
            >
              <KpiCard
                title="Conversión"
                value={tasa}
                hint={`${conversion?.ganadas ?? 0} ganadas · ${conversion?.perdidas ?? 0} perdidas`}
                icon={Percent}
                tone="bg-success/15 text-success"
              />
            </DashboardKpiTrigger>
            <DashboardKpiTrigger
              ariaLabel="Ver detalle del pipeline abierto"
              onOpen={(source) =>
                abrirDetalle(
                  {
                    tarjeta: "pipeline_abierto",
                    previewValor: String(pipelineAbierto),
                    previewTitulo: "Pipeline abierto",
                  },
                  source,
                )
              }
            >
              <KpiCard
                title="Pipeline abierto"
                value={String(pipelineAbierto)}
                icon={Columns3}
                tone="bg-highlight/15 text-highlight"
              />
            </DashboardKpiTrigger>
          </div>
          {kpis.metas ? (
            <DashboardMetas
              metas={kpis.metas}
              puedeConfigurar={perfil?.equipo === "administrativo"}
              onAbrirDetalleMeta={(source, previewValor, previewTitulo) =>
                abrirDetalle({ tarjeta: "meta", previewValor, previewTitulo }, source)
              }
            />
          ) : null}
          <section className="space-y-3">
            <h2 className="text-section">Pipeline por etapa</h2>
            <PipelineBarras rows={kpis.pipeline_por_etapa} />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Etapa</TableHead>
                  <TableHead className="text-right">Oportunidades</TableHead>
                  <TableHead className="text-right">Valor en juego</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kpis.pipeline_por_etapa.map((row) => (
                  <TableRow
                    key={row.etapa}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                    tabIndex={0}
                    role="button"
                    aria-label={`Ver detalle de ${row.nombre}`}
                    onClick={(event) =>
                      abrirDetalle(
                        {
                          tarjeta: "pipeline_etapa",
                          etapa: row.etapa,
                          previewValor: formatMoney(row.valor_en_juego),
                          previewTitulo: row.nombre,
                        },
                        event.currentTarget,
                      )
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        abrirDetalle(
                          {
                            tarjeta: "pipeline_etapa",
                            etapa: row.etapa,
                            previewValor: formatMoney(row.valor_en_juego),
                            previewTitulo: row.nombre,
                          },
                          event.currentTarget,
                        )
                      }
                    }}
                  >
                    <TableCell className="text-ui-medium">{row.nombre}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.cantidad}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(row.valor_en_juego)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
          <div className="grid gap-8 lg:grid-cols-2">
            <section className="space-y-3">
              <h2 className="text-section">Cotizaciones por estado</h2>
              {kpis.cotizaciones_por_estado.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="Sin cotizaciones"
                  body="Cuando existan cotizaciones, el desglose por estado aparece acá."
                />
              ) : (
                <CotizacionesTorta
                  rows={kpis.cotizaciones_por_estado}
                  etiquetas={ESTADO_COTIZACION}
                />
              )}
            </section>
            <section className="space-y-3">
              <h2 className="text-section">Causas de pérdida</h2>
              {kpis.causas_perdida.length === 0 ? (
                <EmptyState
                  icon={CircleOff}
                  title="Sin pérdidas con causa"
                  body="Los cierres perdidos con causa registrada se agrupan acá."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Causa</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kpis.causas_perdida.map((row) => (
                      <TableRow key={row.causa_perdida_id}>
                        <TableCell>{row.nombre}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.cantidad}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </section>
          </div>
          <section className="space-y-3">
            <h2 className="text-section">Actividades por vendedor</h2>
            {kpis.actividades_por_vendedor.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="Sin actividades en el rango"
                body="El filtro de fechas solo aplica a este bloque. El resto es el estado actual."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendedor</TableHead>
                    <TableHead className="text-right">Actividades</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kpis.actividades_por_vendedor.map((row) => (
                    <TableRow key={row.responsable_id}>
                      <TableCell>{row.nombre_completo}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.cantidad}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>
        </div>
      )}
    </>
  )
}

