import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Receipt } from "lucide-react"

import { FacturasResumenKpis } from "@/components/facturas/FacturasResumenKpis"
import { EmptyState } from "@/components/empty-state"
import { TilesSkeleton } from "@/components/skeleton"
import { getFacturasResumen, mesEnCursoEcuadorBounds } from "@/lib/api/factura"
import type { FacturasResumen } from "@/types/factura"

export function DashboardFacturacionResumen() {
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

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-section">Facturación</h2>
        <p className="mt-1 text-kicker text-muted-foreground">
          Mes en curso (Ecuador), sin IVA — mismo criterio que Negocios → Facturas.
        </p>
      </div>
      {resumen ? (
        <FacturasResumenKpis resumen={resumen} clickable onKpiClick={irAFacturas} />
      ) : error ? (
        <EmptyState
          icon={Receipt}
          title="Sin resumen de facturación"
          body="No se pudo cargar el total del mes. Revisá Facturas o permisos de Contífico."
        />
      ) : (
        <TilesSkeleton count={3} className="sm:grid-cols-3" />
      )}
    </section>
  )
}
