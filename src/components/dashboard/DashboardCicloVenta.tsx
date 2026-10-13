import { CalendarRange, Gem, Ticket } from "lucide-react"

import { KpiCard } from "@/components/kpi-card"
import { TilesSkeleton } from "@/components/skeleton"
import { hoyEcuador, sumarMeses } from "@/lib/contrato-recurrente"
import { formatMoney } from "@/lib/costo-interno"
import { cicloVenta, ganadasEnRango } from "@/lib/dashboard-comercial"
import type { Oportunidad } from "@/types/oportunidad"

export function DashboardCicloVenta({ oportunidades }: { oportunidades: Oportunidad[] | null }) {
  const hoy = hoyEcuador()
  const desde = `${sumarMeses(hoy.slice(0, 7), -11)}-01`
  const datos = oportunidades ? cicloVenta(ganadasEnRango(oportunidades, desde, hoy)) : null

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
          <KpiCard
            title="Ticket promedio"
            value={datos.ticketPromedio != null ? formatMoney(datos.ticketPromedio) : "—"}
            icon={Ticket}
            tone="bg-primary/15 text-primary"
          />
          <KpiCard
            title="Ciclo promedio"
            value={datos.cicloPromedioDias != null ? `${Math.round(datos.cicloPromedioDias)} días` : "—"}
            icon={CalendarRange}
            tone="bg-highlight/15 text-highlight"
          />
          <KpiCard
            title="Mayor deal"
            value={datos.mayorDeal != null ? formatMoney(datos.mayorDeal) : "—"}
            icon={Gem}
            tone="bg-success/15 text-success"
          />
        </div>
      )}
    </section>
  )
}
