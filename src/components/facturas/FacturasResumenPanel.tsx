import { Building2, Megaphone, Receipt, TriangleAlert } from "lucide-react"

import { FacturasCategoriaBarras } from "@/components/facturas/FacturasCategoriaBarras"
import { KpiCard } from "@/components/kpi-card"
import { formatMoney } from "@/lib/costo-interno"
import type { FacturasResumen } from "@/types/factura"

export function FacturasResumenPanel({
  resumen,
  avisoMediosSinConfig,
}: {
  resumen: FacturasResumen
  avisoMediosSinConfig: boolean
}) {
  return (
    <div className="mb-6 space-y-4">
      {avisoMediosSinConfig ? (
        <div
          className="flex gap-3 rounded-xl border border-warning/35 bg-warning/5 px-4 py-3"
          role="status"
        >
          <TriangleAlert className="size-5 shrink-0 text-warning" strokeWidth={1.75} aria-hidden />
          <div>
            <p className="text-ui-medium">Sin clientes de medios configurados</p>
            <p className="mt-1 text-kicker text-muted-foreground">
              Todo el monto del período se contabiliza como agencia. Configurá al menos un RUC en clientes de
              medios para separar facturación de medios.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          title="Total facturado"
          value={formatMoney(resumen.total_facturado)}
          hint={`${resumen.cantidad_facturas} facturas · sin IVA · ${resumen.desde} → ${resumen.hasta}`}
          icon={Receipt}
          tone="bg-primary/10 text-primary"
        />
        <KpiCard
          title="Facturación agencia"
          value={formatMoney(resumen.facturacion_agencia)}
          hint="Clientes fuera de la lista de medios"
          icon={Building2}
          tone="bg-success/10 text-success"
        />
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
        />
      </div>

      <div className="surface-card p-5">
        <h2 className="text-section">Por categoría (Contífico)</h2>
        <p className="mt-1 text-kicker text-muted-foreground">
          Descripción de línea en Contífico, sin IVA. Ordenado de mayor a menor monto.
        </p>
        <div className="mt-4">
          <FacturasCategoriaBarras filas={resumen.por_categoria} />
        </div>
      </div>
    </div>
  )
}
