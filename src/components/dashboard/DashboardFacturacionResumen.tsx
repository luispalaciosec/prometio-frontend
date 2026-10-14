import { useEffect, useState, type ReactNode } from "react"
import { Link, useNavigate } from "react-router-dom"
import { CalendarX, Clock, Layers, Receipt, ReceiptText, Repeat } from "lucide-react"

import { DashboardKpiTrigger } from "@/components/dashboard/DashboardKpiTrigger"
import { FacturasResumenKpis } from "@/components/facturas/FacturasResumenKpis"
import { EmptyState } from "@/components/empty-state"
import { KpiCard } from "@/components/kpi-card"
import { TilesSkeleton } from "@/components/skeleton"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { boundsMesCalendario, getFacturasResumen } from "@/lib/api/factura"
import { formatPeriodo, mesActualEcuador, sumarMeses } from "@/lib/contrato-recurrente"
import { formatMoney } from "@/lib/costo-interno"
import type { ProyeccionMes } from "@/types/contrato-recurrente"
import type { PendientePorFacturar } from "@/types/dashboard"
import type { FacturasResumen } from "@/types/factura"

const MES_ACTUAL = mesActualEcuador()

/** 12 meses atrás → 12 adelante, en orden cronológico (misma ventana que la proyección cargada). */
const OPCIONES_MES = Array.from({ length: 25 }, (_, index) => sumarMeses(MES_ACTUAL, index - 12))

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function nombreMes(mes: string): string {
  return capitalizar(formatPeriodo(`${mes}-01`, true).replace(" de ", " "))
}

function etiquetaOpcion(mes: string): string {
  if (mes === MES_ACTUAL) {
    return `${nombreMes(mes)} · en curso`
  }
  return mes > MES_ACTUAL ? `${nombreMes(mes)} · proyección` : nombreMes(mes)
}

export function DashboardFacturacionResumen({
  pendiente,
  mes,
  onMesChange,
  proyeccion,
}: {
  pendiente: PendientePorFacturar
  /** `YYYY-MM` */
  mes: string
  onMesChange: (mes: string) => void
  /** null = cargando. */
  proyeccion: ProyeccionMes[] | null
}) {
  const navigate = useNavigate()
  const [resumen, setResumen] = useState<FacturasResumen | null>(null)
  const [error, setError] = useState(false)

  const esFuturo = mes > MES_ACTUAL
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

  function clickeable(ariaLabel: string, destino: string, card: ReactNode) {
    return (
      <DashboardKpiTrigger ariaLabel={ariaLabel} onOpen={() => navigate(destino)}>
        {card}
      </DashboardKpiTrigger>
    )
  }

  const tarjetaPendiente = clickeable(
    "Ver cotizaciones por facturar",
    "/cotizaciones?estado=por_facturar",
    <KpiCard
      title="Pendiente por facturar"
      value={formatMoney(pendiente.monto)}
      hint={`${pendiente.cantidad} ${pendiente.cantidad === 1 ? "cotización" : "cotizaciones"} · a hoy, sin mes asignado`}
      icon={Clock}
      tone="bg-warning/15 text-warning"
    />,
  )

  const encabezado = (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-section">
          {esFuturo ? `Por facturar en ${nombreMes(mes)}` : `Facturación · ${nombreMes(mes)}`}
        </h2>
        <p className="mt-1 max-w-3xl text-kicker text-muted-foreground">
          {esFuturo
            ? "Proyección sin IVA. Lo único que tiene mes asignado son los contratos de fee recurrente; las cotizaciones sueltas aceptadas van en «Pendiente por facturar» hasta que se facturen."
            : `${mes === MES_ACTUAL ? "Mes en curso (Ecuador)" : "Mes completo"}, sin IVA — mismo criterio que Negocios → Facturas.`}
        </p>
      </div>
      <div className="filter-field">
        <Label htmlFor="dash-mes-facturacion">Mes</Label>
        <Select value={mes} onValueChange={onMesChange}>
          <SelectTrigger id="dash-mes-facturacion" className="sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPCIONES_MES.map((opcion) => (
              <SelectItem key={opcion} value={opcion}>
                {etiquetaOpcion(opcion)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  if (esFuturo) {
    const sinContratos = proyeccion != null && (fees?.piso_contratado ?? 0) === 0
    return (
      <section className="space-y-3">
        {encabezado}
        {proyeccion == null ? (
          <TilesSkeleton count={4} className="sm:grid-cols-2 2xl:grid-cols-4" />
        ) : sinContratos ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <EmptyState
              icon={Repeat}
              title={`Nada contratado para ${nombreMes(mes)}`}
              body="No hay contratos de fee recurrente vigentes ese mes. Cargalos en Contratos y aparecen acá."
              action={
                <Link to="/contratos" className="text-ui-medium underline-offset-4 hover:underline">
                  Ir a Contratos
                </Link>
              }
              className="surface-card"
            />
            {tarjetaPendiente}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            {clickeable(
              "Ver la proyección de contratos",
              "/contratos/proyeccion",
              <KpiCard
                title="Fees contratados"
                value={formatMoney(fees?.piso_contratado ?? 0)}
                hint="Piso de facturación del mes"
                icon={Layers}
                tone="bg-primary/10 text-primary"
              />,
            )}
            {clickeable(
              "Ver la proyección de contratos",
              "/contratos/proyeccion",
              <KpiCard
                title="Ya generado"
                value={formatMoney((fees?.por_facturar ?? 0) + (fees?.facturado ?? 0))}
                hint="Cotizaciones del mes ya creadas"
                icon={ReceiptText}
                tone="bg-success/10 text-success"
              />,
            )}
            {clickeable(
              "Ver contratos por renovar",
              "/contratos/renovaciones",
              <KpiCard
                title="Vence en el mes"
                value={formatMoney(fees?.vence_en_el_mes ?? 0)}
                hint="Se cae el mes siguiente si no se renueva"
                icon={CalendarX}
                tone="bg-destructive/10 text-destructive"
              />,
            )}
            {tarjetaPendiente}
          </div>
        )}
      </section>
    )
  }

  return (
    <section className="space-y-3">
      {encabezado}
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
      {resumen?.truncado ? (
        <p className="text-kicker text-warning">
          Contífico devolvió más documentos de los que se leen: lo facturado de este mes puede estar incompleto.
        </p>
      ) : null}
      {fees && fees.piso_contratado > 0 ? (
        <p className="text-kicker">
          Fees recurrentes del mes:{" "}
          <span className="text-ui-medium tabular-nums text-foreground">
            {formatMoney(fees.piso_contratado)}
          </span>{" "}
          contratado · <span className="tabular-nums">{formatMoney(fees.facturado)}</span> facturado ·{" "}
          <span className="tabular-nums">{formatMoney(fees.por_facturar)}</span> por facturar.{" "}
          <Link
            to="/contratos/proyeccion"
            className="text-ui-medium text-foreground underline-offset-4 hover:underline"
          >
            Ver proyección
          </Link>
        </p>
      ) : null}
    </section>
  )
}
