import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { CotizacionesTorta, PipelineBarras } from "@/components/dashboard/DashboardCharts"
import { DashboardDetalleModal } from "@/components/dashboard/DashboardDetalleModal"
import { DashboardKpiTrigger } from "@/components/dashboard/DashboardKpiTrigger"
import { DashboardCicloVenta } from "@/components/dashboard/DashboardCicloVenta"
import { DashboardCotizacionesSeguimiento } from "@/components/dashboard/DashboardCotizacionesSeguimiento"
import { DashboardFacturacionHistorial } from "@/components/dashboard/DashboardFacturacionHistorial"
import { DashboardFacturacionResumen } from "@/components/dashboard/DashboardFacturacionResumen"
import { DashboardForecast } from "@/components/dashboard/DashboardForecast"
import { DashboardRankingVendedores } from "@/components/dashboard/DashboardRankingVendedores"
import { DashboardRenovaciones } from "@/components/dashboard/DashboardRenovaciones"
import { useDashboardDatos } from "@/hooks/use-dashboard-datos"
import { DashboardMetas } from "@/components/dashboard/DashboardMetas"
import { EmptyState } from "@/components/empty-state"
import { KpiCard } from "@/components/kpi-card"
import { PageHeader } from "@/components/page-header"
import { DashboardSkeleton } from "@/components/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { formatDateOnly } from "@/lib/datetime-local"
import { rangoDatetimeEcuador } from "@/lib/rango-datetime-ecuador"
import { formatPeriodo, mesActualEcuador, sumarMeses } from "@/lib/contrato-recurrente"
import { esSoloLoPropio, puedeVerEquipo } from "@/lib/pipeline-acceso"
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
  por_facturar: "Por facturar",
  facturado: "Facturada",
  rechazada: "Rechazada",
  vencida: "Vencida",
}

const MES_ACTUAL = mesActualEcuador()

/** 12 meses atrás → 12 adelante, en orden cronológico. */
const OPCIONES_MES = Array.from({ length: 25 }, (_, index) => sumarMeses(MES_ACTUAL, index - 12))

function etiquetaMes(mes: string): string {
  const texto = formatPeriodo(`${mes}-01`, true).replace(" de ", " ")
  const capitalizado = texto.charAt(0).toUpperCase() + texto.slice(1)
  if (mes === MES_ACTUAL) {
    return `${capitalizado} · en curso`
  }
  return mes > MES_ACTUAL ? `${capitalizado} · proyección` : capitalizado
}

export function DashboardPage() {
  const perfil = useAuthStore((state) => state.perfil)
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [mesFacturacion, setMesFacturacion] = useState(mesActualEcuador)
  const datos = useDashboardDatos()
  const [rangoActividades, setRangoActividades] = useState<{ desde: string; hasta: string } | null>(
    null,
  )
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
        rango?.desde && rango.hasta ? rangoDatetimeEcuador(rango.desde, rango.hasta) : {},
      )
      setKpis(data)
      setRangoActividades(rango?.desde && rango.hasta ? rango : null)
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
          if ((desde && !hasta) || (!desde && hasta)) {
            toast.error("Elegí fecha desde y hasta.")
            return
          }
          if (desde && hasta) {
            if (desde > hasta) {
              toast.error("«Desde» no puede ser posterior a «Hasta».")
              return
            }
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
        <div className="filter-field">
          <Label htmlFor="dash-mes-facturacion">Mes de facturación</Label>
          <Select value={mesFacturacion} onValueChange={setMesFacturacion}>
            <SelectTrigger id="dash-mes-facturacion" className="sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPCIONES_MES.map((mes) => (
                <SelectItem key={mes} value={mes}>
                  {etiquetaMes(mes)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-kicker max-w-xl">
          El rango aplica solo a <span className="text-ui-medium">Actividades por vendedor</span>{" "}
          (programada o reportada en esas fechas, hora Ecuador). El mes cambia solo{" "}
          <span className="text-ui-medium">Facturación</span>: un mes futuro muestra lo que hay
          contratado por facturar. KPIs, pipeline, cotizaciones y metas siguen siendo el estado
          actual del CRM.
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
          {kpis.metas ? (
            <DashboardForecast
              metas={kpis.metas}
              pendiente={kpis.pendiente_por_facturar}
              oportunidades={datos.oportunidades}
              etapas={datos.etapas}
              proyeccion={datos.proyeccion}
              soloLoPropio={perfil ? esSoloLoPropio(perfil) : true}
            />
          ) : null}
          <DashboardFacturacionResumen
            pendiente={kpis.pendiente_por_facturar}
            mes={mesFacturacion}
            proyeccion={datos.proyeccion}
          />
          <DashboardFacturacionHistorial proyeccion={datos.proyeccion} />
          <div className="grid gap-8 lg:grid-cols-2">
            <DashboardRenovaciones />
            <DashboardCotizacionesSeguimiento oportunidades={datos.todasOportunidades} />
          </div>
          {perfil && puedeVerEquipo(perfil) ? (
            <DashboardRankingVendedores
              perfil={perfil}
              oportunidades={datos.oportunidades}
              etapas={datos.etapas}
              metasPorVendedor={kpis.metas?.por_vendedor ?? []}
            />
          ) : null}
          <DashboardCicloVenta oportunidades={datos.oportunidades} />
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
            <div>
              <h2 className="text-section">Actividades por vendedor</h2>
              {rangoActividades ? (
                <p className="mt-1 text-kicker text-muted-foreground">
                  Filtrado: {formatDateOnly(rangoActividades.desde)} –{" "}
                  {formatDateOnly(rangoActividades.hasta)}
                </p>
              ) : (
                <p className="mt-1 text-kicker text-muted-foreground">
                  Sin filtro de fechas — todas las actividades con fecha programada o reportada.
                </p>
              )}
            </div>
            {kpis.actividades_por_vendedor.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="Sin actividades en el rango"
                body={
                  rangoActividades
                    ? "Ninguna actividad tiene programada_para o reportada_en en esas fechas."
                    : "Cuando haya actividades registradas, el conteo por vendedor aparece acá."
                }
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

