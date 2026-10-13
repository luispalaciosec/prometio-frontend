import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { CalendarX, Clock, Layers, Receipt, ReceiptText } from "lucide-react"

import { FacturasResumenKpis } from "@/components/facturas/FacturasResumenKpis"
import { EmptyState } from "@/components/empty-state"
import { KpiCard } from "@/components/kpi-card"
import { TilesSkeleton } from "@/components/skeleton"
import { boundsMesCalendario, getFacturasResumen } from "@/lib/api/factura"
import { formatPeriodo, mesActualEcuador } from "@/lib/contrato-recurrente"
import { formatMoney } from "@/lib/costo-interno"
import type { ProyeccionMes } from "@/types/contrato-recurrente"
import type { PendientePorFacturar } from "@/types/dashboard"
import type { FacturasResumen } from "@/types/factura"

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function DashboardFacturacionResumen({
  pendiente,
  mes,
  proyeccion,
}: {
  pendiente: PendientePorFacturar
  /** `YYYY-MM` */
  mes: string
  /** null = cargando. */
  proyeccion: ProyeccionMes[] | null
}) {
  const navigate = useNavigate()
  const [resumen, setResumen] = useState<FacturasResumen | null>(null)
  const [error, setError] = useState(false)

  const mesActual = mesActualEcuador()
  const esFuturo = mes > mesActual
  const nombreMes = capitalizar(formatPeriodo(`${mes}-01`, true))
  const fees = proyeccion?.find((row) => row.periodo.slice(0, 7) === mes) ?? null

  useEffect(() => {
    if (esFuturo) {
      return
    }
    let cancelled = false
    setResumen(null)
    setError(false)
    void getFacturasResumen(boundsMesCalendario(mes))
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
  }, [mes, esFuturo])

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

  const enlaceProyeccion = (
    <Link
      to="/contratos/proyeccion"
      className="text-ui-medium text-foreground underline-offset-4 hover:underline"
    >
      Ver proyección
    </Link>
  )

  if (esFuturo) {
    return (
      <section className="space-y-3">
        <div>
          <h2 className="text-section">Por facturar en {nombreMes}</h2>
          <p className="mt-1 text-kicker text-muted-foreground">
            Proyección sin IVA desde los contratos de fee recurrente. Las cotizaciones sueltas no
            tienen mes asignado: van en «Pendiente por facturar». {enlaceProyeccion}
          </p>
        </div>
        {proyeccion == null ? (
          <TilesSkeleton count={4} className="sm:grid-cols-2 2xl:grid-cols-4" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            <KpiCard
              title="Fees contratados"
              value={formatMoney(fees?.piso_contratado ?? 0)}
              hint="Piso de facturación del mes"
              icon={Layers}
              tone="bg-primary/10 text-primary"
            />
            <KpiCard
              title="Ya generado"
              value={formatMoney((fees?.por_facturar ?? 0) + (fees?.facturado ?? 0))}
              hint="Cotizaciones del mes ya creadas"
              icon={ReceiptText}
              tone="bg-success/10 text-success"
            />
            <KpiCard
              title="Vence en el mes"
              value={formatMoney(fees?.vence_en_el_mes ?? 0)}
              hint="Se cae el mes siguiente si no se renueva"
              icon={CalendarX}
              tone="bg-destructive/10 text-destructive"
            />
            {tarjetaPendiente}
          </div>
        )}
      </section>
    )
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-section">Facturación · {nombreMes}</h2>
        <p className="mt-1 text-kicker text-muted-foreground">
          {mes === mesActual ? "Mes en curso (Ecuador)" : "Mes completo"}, sin IVA — mismo criterio
          que Negocios → Facturas. «Pendiente por facturar» es el estado actual: cotizaciones
          aceptadas que todavía no tienen factura.
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
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {tarjetaPendiente}
          <EmptyState
            icon={Receipt}
            title="Sin resumen de facturación"
            body="No se pudo cargar el total del mes. Revisá Facturas o permisos de Contífico."
            className="sm:col-span-1 2xl:col-span-3"
          />
        </div>
      ) : (
        <TilesSkeleton count={4} className="sm:grid-cols-2 2xl:grid-cols-4" />
      )}
      {fees && fees.piso_contratado > 0 ? (
        <p className="text-kicker">
          Fees recurrentes del mes:{" "}
          <span className="text-ui-medium tabular-nums text-foreground">
            {formatMoney(fees.piso_contratado)}
          </span>{" "}
          contratado · <span className="tabular-nums">{formatMoney(fees.facturado)}</span> facturado ·{" "}
          <span className="tabular-nums">{formatMoney(fees.por_facturar)}</span> por facturar.{" "}
          {enlaceProyeccion}
        </p>
      ) : null}
    </section>
  )
}
