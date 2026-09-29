import { Building2, Megaphone, Receipt } from "lucide-react"
import type { ReactNode } from "react"

import { DashboardKpiTrigger } from "@/components/dashboard/DashboardKpiTrigger"
import { KpiCard } from "@/components/kpi-card"
import { formatMoney } from "@/lib/costo-interno"
import type { FacturasResumen } from "@/types/factura"

export type FacturasResumenKpiTipo = "total" | "agencia" | "medios"

function envolver(
  clickable: boolean,
  ariaLabel: string,
  onClick: () => void,
  card: ReactNode,
) {
  if (!clickable) {
    return card
  }
  return (
    <DashboardKpiTrigger ariaLabel={ariaLabel} onOpen={() => onClick()}>
      {card}
    </DashboardKpiTrigger>
  )
}

export function FacturasResumenKpis({
  resumen,
  clickable = false,
  onKpiClick,
}: {
  resumen: FacturasResumen
  clickable?: boolean
  onKpiClick?: (tipo: FacturasResumenKpiTipo) => void
}) {
  function abrir(tipo: FacturasResumenKpiTipo, ariaLabel: string, card: ReactNode) {
    return envolver(clickable, ariaLabel, () => onKpiClick?.(tipo), card)
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {abrir(
        "total",
        "Ver facturación total en Facturas",
        <KpiCard
          title="Total facturado"
          value={formatMoney(resumen.total_facturado)}
          hint={`${resumen.cantidad_facturas} facturas · sin IVA · ${resumen.desde} → ${resumen.hasta}`}
          icon={Receipt}
          tone="bg-primary/10 text-primary"
        />,
      )}
      {abrir(
        "agencia",
        "Ver facturación agencia en Facturas",
        <KpiCard
          title="Facturación agencia"
          value={formatMoney(resumen.facturacion_agencia)}
          hint="Clientes fuera de la lista de medios"
          icon={Building2}
          tone="bg-success/10 text-success"
        />,
      )}
      {abrir(
        "medios",
        "Ver facturación medios en Facturas",
        <KpiCard
          title="Facturación medios"
          value={formatMoney(resumen.facturacion_medios)}
          hint={
            resumen.clientes_medios_configurados > 0
              ? `${resumen.clientes_medios_configurados} cliente(s) de medios`
              : "Sin clientes de medios"
          }
          icon={Megaphone}
          tone="bg-highlight/15 text-highlight"
        />,
      )}
    </div>
  )
}
