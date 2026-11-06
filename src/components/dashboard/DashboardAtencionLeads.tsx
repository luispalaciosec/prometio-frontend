import { useEffect, useState } from "react"
import { AlarmClock, Hourglass, Percent, Timer } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { KpiCard } from "@/components/kpi-card"
import { TableSkeleton } from "@/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getResumenSla } from "@/lib/api/atencion-lead"
import { formatMinutos } from "@/lib/atencion-lead"
import { formatDateOnly } from "@/lib/datetime-local"
import { rangoDatetimeEcuador } from "@/lib/rango-datetime-ecuador"
import type { ResumenSla, ResumenVendedorSla } from "@/types/atencion-lead"

function vencidos(cantidad: number): string {
  return cantidad === 1 ? "1 vencido" : `${cantidad} vencidos`
}

function porcentaje(fila: ResumenVendedorSla): string {
  return fila.pct_a_tiempo == null ? "—" : `${fila.pct_a_tiempo.toFixed(0)}%`
}

function mediana(fila: ResumenVendedorSla): string {
  return fila.minutos_mediana_primer_contacto == null ? "—" : formatMinutos(fila.minutos_mediana_primer_contacto)
}

/** Mejor cumplimiento primero; quien todavía no atendió ninguno va al final. */
function ordenarVendedores(filas: ResumenVendedorSla[]): ResumenVendedorSla[] {
  return [...filas].sort((a, b) => {
    const pct = (b.pct_a_tiempo ?? -1) - (a.pct_a_tiempo ?? -1)
    if (pct !== 0) {
      return pct
    }
    return (a.minutos_mediana_primer_contacto ?? Infinity) - (b.minutos_mediana_primer_contacto ?? Infinity)
  })
}

export function DashboardAtencionLeads({
  rango,
  mostrarEquipo,
}: {
  /** Fechas aplicadas en el filtro del Dashboard. Sin rango, los últimos 30 días. */
  rango: { desde: string; hasta: string } | null
  mostrarEquipo: boolean
}) {
  const [resumen, setResumen] = useState<ResumenSla | null>(null)
  const [error, setError] = useState(false)
  const desde = rango?.desde
  const hasta = rango?.hasta

  useEffect(() => {
    let cancelled = false
    setResumen(null)
    setError(false)
    void getResumenSla(desde && hasta ? rangoDatetimeEcuador(desde, hasta) : undefined)
      .then((data) => {
        if (!cancelled) {
          setResumen(data)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [desde, hasta])

  const periodo =
    desde && hasta ? `Del ${formatDateOnly(desde)} al ${formatDateOnly(hasta)}` : "Últimos 30 días"

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-section">Respuesta a leads</h2>
        <p className="mt-1 text-kicker text-muted-foreground">
          {periodo}.
          {resumen ? ` Meta: ${formatMinutos(resumen.sla_minutos)} hábiles, ${resumen.horario}.` : null}
        </p>
      </div>
      {error ? (
        <EmptyState
          icon={AlarmClock}
          title="Sin datos de respuesta"
          body="No se pudo cargar el cumplimiento. Probá recargar la página."
        />
      ) : resumen == null ? (
        <TableSkeleton rows={3} />
      ) : resumen.total.recibidos === 0 ? (
        <EmptyState
          icon={AlarmClock}
          title="Sin leads en el período"
          body="Cuando entren leads por el formulario web, acá se mide cuánto tardan en recibir el primer contacto."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard
              title="Atendidos a tiempo"
              value={porcentaje(resumen.total)}
              hint={`${resumen.total.atendidos_a_tiempo} de ${resumen.total.atendidos} atendidos`}
              icon={Percent}
              tone="bg-success/15 text-success"
            />
            <KpiCard
              title="Mediana del primer contacto"
              value={mediana(resumen.total)}
              hint="En tiempo hábil"
              icon={Timer}
              tone="bg-primary/15 text-primary"
            />
            <KpiCard
              title="Pendientes"
              value={resumen.total.pendientes}
              hint={`${vencidos(resumen.total.pendientes_vencidos)} · ${resumen.total.recibidos} recibidos`}
              icon={Hourglass}
              tone="bg-warning/15 text-warning"
            />
          </div>
          {mostrarEquipo && resumen.por_vendedor.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendedor</TableHead>
                  <TableHead className="text-right">A tiempo</TableHead>
                  <TableHead className="text-right">Mediana</TableHead>
                  <TableHead className="text-right">Recibidos</TableHead>
                  <TableHead className="text-right">Atendidos</TableHead>
                  <TableHead className="text-right">Pendientes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordenarVendedores(resumen.por_vendedor).map((fila, index) => (
                  <TableRow key={fila.responsable_id ?? index}>
                    <TableCell className="text-ui-medium">{fila.responsable_nombre || "Sin nombre"}</TableCell>
                    <TableCell className="text-right tabular-nums">{porcentaje(fila)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{mediana(fila)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{fila.recibidos}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{fila.atendidos}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {fila.pendientes}
                      {fila.pendientes_vencidos > 0 ? ` (${vencidos(fila.pendientes_vencidos)})` : ""}
                    </TableCell>
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
