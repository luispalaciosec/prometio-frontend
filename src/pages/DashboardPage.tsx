import { useEffect, useState } from "react"
import { toast } from "sonner"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { DashboardSkeleton } from "@/components/skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { BarChart3, CircleOff, FileText, CalendarClock } from "lucide-react"

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

  return (
    <>
      <PageHeader
        flagship
        title="Dashboard"
        description={
          perfil && esSoloLoPropio(perfil)
            ? "Tus indicadores."
            : "Indicadores del equipo."
        }
      />
      <form
        className="mb-6 flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          if (desde && hasta) {
            void reload({ desde, hasta })
            return
          }
          void reload()
        }}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="dash-desde">Desde</Label>
          <Input id="dash-desde" type="date" value={desde} onChange={(event) => setDesde(event.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
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
            <KpiCard title="Valor en juego" value={formatMoney(kpis.valor_total_en_juego)} />
            <KpiCard title="Conversión" value={tasa} hint={`${conversion?.ganadas ?? 0} ganadas · ${conversion?.perdidas ?? 0} perdidas`} />
            <KpiCard
              title="Pipeline abierto"
              value={String(
                kpis.pipeline_por_etapa
                  .filter((row) => row.etapa !== "cierre_ganado" && row.etapa !== "cierre_perdido")
                  .reduce((sum, row) => sum + row.cantidad, 0),
              )}
            />
          </div>
          <section className="space-y-3">
            <h2 className="text-section">Pipeline por etapa</h2>
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
                  <TableRow key={row.etapa}>
                    <TableCell>{row.nombre}</TableCell>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kpis.cotizaciones_por_estado.map((row) => (
                      <TableRow key={row.estado}>
                        <TableCell>{ESTADO_COTIZACION[row.estado] ?? row.estado}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.cantidad}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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

function KpiCard({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <Card className="rounded-xl ring-border transition-shadow duration-150 hover:shadow-raised">
      <CardHeader>
        <CardTitle className="text-kicker font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-heading text-[20px] font-semibold tracking-tight tabular-nums">{value}</p>
        {hint ? <p className="mt-1 text-kicker">{hint}</p> : null}
      </CardContent>
    </Card>
  )
}
