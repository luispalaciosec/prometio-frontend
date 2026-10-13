import { useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { CalendarRange, Gem, Ticket, Trophy } from "lucide-react"

import { DashboardKpiTrigger } from "@/components/dashboard/DashboardKpiTrigger"
import { EmptyState } from "@/components/empty-state"
import { KpiCard } from "@/components/kpi-card"
import { TilesSkeleton } from "@/components/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { etiquetaContacto, etiquetaEmpresa } from "@/lib/api/oportunidad"
import { hoyEcuador, sumarMeses } from "@/lib/contrato-recurrente"
import { formatMoney } from "@/lib/costo-interno"
import { cicloVenta, diasHasta, ganadasEnRango, valorEfectivo } from "@/lib/dashboard-comercial"
import { formatDateOnly } from "@/lib/datetime-local"
import type { Oportunidad } from "@/types/oportunidad"

function diasCiclo(oportunidad: Oportunidad): number | null {
  if (!oportunidad.fecha_cierre) {
    return null
  }
  const dias = diasHasta(oportunidad.fecha_cierre.slice(0, 10), oportunidad.created_at.slice(0, 10))
  return dias >= 1 ? dias : null
}

export function DashboardCicloVenta({ oportunidades }: { oportunidades: Oportunidad[] | null }) {
  const [abierto, setAbierto] = useState(false)
  const hoy = hoyEcuador()
  const desde = `${sumarMeses(hoy.slice(0, 7), -11)}-01`
  const ganadas = oportunidades
    ? ganadasEnRango(oportunidades, desde, hoy).sort((a, b) => valorEfectivo(b) - valorEfectivo(a))
    : null
  const datos = ganadas ? cicloVenta(ganadas) : null

  function tarjeta(ariaLabel: string, card: ReactNode) {
    return (
      <DashboardKpiTrigger ariaLabel={ariaLabel} onOpen={() => setAbierto(true)}>
        {card}
      </DashboardKpiTrigger>
    )
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-section">Ciclo de venta</h2>
        <p className="mt-1 text-kicker text-muted-foreground">
          Oportunidades ganadas en los últimos 12 meses
          {datos ? ` (${datos.ganadas})` : ""}. El ciclo va de la creación al cierre. Sin IVA.
        </p>
      </div>
      {datos == null ? (
        <TilesSkeleton count={3} className="sm:grid-cols-3" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {tarjeta(
            "Ver ventas ganadas",
            <KpiCard
              title="Ticket promedio"
              value={datos.ticketPromedio != null ? formatMoney(datos.ticketPromedio) : "—"}
              icon={Ticket}
              tone="bg-primary/15 text-primary"
            />,
          )}
          {tarjeta(
            "Ver ventas ganadas con su ciclo",
            <KpiCard
              title="Ciclo promedio"
              value={datos.cicloPromedioDias != null ? `${Math.round(datos.cicloPromedioDias)} días` : "—"}
              hint="No cuenta lo dado de alta ya ganado"
              icon={CalendarRange}
              tone="bg-highlight/15 text-highlight"
            />,
          )}
          {tarjeta(
            "Ver ventas ganadas",
            <KpiCard
              title="Mayor deal"
              value={datos.mayorDeal != null ? formatMoney(datos.mayorDeal) : "—"}
              icon={Gem}
              tone="bg-success/15 text-success"
            />,
          )}
        </div>
      )}
      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-page">Ventas ganadas · últimos 12 meses</DialogTitle>
            <DialogDescription>
              {datos ? `${datos.ganadas} oportunidades, de mayor a menor valor. Sin IVA.` : null}
            </DialogDescription>
          </DialogHeader>
          {ganadas == null || ganadas.length === 0 ? (
            <EmptyState icon={Trophy} title="Sin ventas ganadas" body="Nada pasó a cierre ganado en los últimos 12 meses." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Oportunidad</TableHead>
                  <TableHead>Cierre</TableHead>
                  <TableHead className="text-right">Ciclo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ganadas.map((row) => {
                  const dias = diasCiclo(row)
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-normal">
                        <Link to={`/pipeline/${row.id}`} onClick={() => setAbierto(false)} className="block hover:underline">
                          <p className="text-ui-medium">{row.nombre ?? etiquetaContacto(row.contacto_id)}</p>
                          <p className="text-kicker text-muted-foreground">{etiquetaEmpresa(row.empresa_id)}</p>
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDateOnly(row.fecha_cierre ?? null)}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {dias != null ? `${dias} días` : "Alta directa"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatMoney(valorEfectivo(row))}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
