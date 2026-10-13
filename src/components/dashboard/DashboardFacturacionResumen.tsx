import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Clock, Receipt } from "lucide-react"

import { FacturasResumenKpis } from "@/components/facturas/FacturasResumenKpis"
import { EmptyState } from "@/components/empty-state"
import { KpiCard } from "@/components/kpi-card"
import { TilesSkeleton } from "@/components/skeleton"
import { getFacturasResumen, mesEnCursoEcuadorBounds } from "@/lib/api/factura"
import { formatMoney } from "@/lib/costo-interno"
import type { PendientePorFacturar } from "@/types/dashboard"
import type { FacturasResumen } from "@/types/factura"

export function DashboardFacturacionResumen({ pendiente }: { pendiente: PendientePorFacturar }) {
  const navigate = useNavigate()
  const [resumen, setResumen] = useState<FacturasResumen | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    const bounds = mesEnCursoEcuadorBounds()
    void getFacturasResumen(bounds)
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
  }, [])

  function irAFacturas() {
    navigate("/facturas#lista-facturas")
  }

  const tarjetaPendiente = (
    <KpiCard
      title="Pendiente por facturar"
      value={formatMoney(pendiente.monto)}
      hint={`${pendiente.cantidad} ${pendiente.cantidad === 1 ? "cotización" : "cotizaciones"} · estado actual`}
      icon={Clock}
      tone="bg-warning/15 text-warning"
    />
  )

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-section">Facturación</h2>
        <p className="mt-1 text-kicker text-muted-foreground">
          Mes en curso (Ecuador), sin IVA — mismo criterio que Negocios → Facturas. «Pendiente por
          facturar» es el estado actual: cotizaciones aceptadas que todavía no tienen factura.
        </p>
      </div>
      {resumen ? (
        <FacturasResumenKpis
          resumen={resumen}
          clickable
          onKpiClick={irAFacturas}
          extra={tarjetaPendiente}
        />
      ) : error ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {tarjetaPendiente}
          <EmptyState
            icon={Receipt}
            title="Sin resumen de facturación"
            body="No se pudo cargar el total del mes. Revisá Facturas o permisos de Contífico."
            className="sm:col-span-1 xl:col-span-3"
          />
        </div>
      ) : (
        <TilesSkeleton count={4} className="sm:grid-cols-2 xl:grid-cols-4" />
      )}
    </section>
  )
}
