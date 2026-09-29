import { TriangleAlert } from "lucide-react"

import { FacturasCategoriaBarras } from "@/components/facturas/FacturasCategoriaBarras"
import {
  FacturasResumenKpis,
  type FacturasResumenKpiTipo,
} from "@/components/facturas/FacturasResumenKpis"
import type { FacturasResumen } from "@/types/factura"

export function FacturasResumenPanel({
  resumen,
  avisoMediosSinConfig,
  onKpiClick,
}: {
  resumen: FacturasResumen
  avisoMediosSinConfig: boolean
  onKpiClick?: (tipo: FacturasResumenKpiTipo) => void
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

      <FacturasResumenKpis resumen={resumen} clickable={Boolean(onKpiClick)} onKpiClick={onKpiClick} />

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
