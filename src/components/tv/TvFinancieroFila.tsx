import { FileCheck, Receipt, TriangleAlert, Wallet } from "lucide-react"

import { KpiCard } from "@/components/kpi-card"
import { TvFacturacionPilarBarras } from "@/components/tv/TvFacturacionPilarBarras"
import { formatMoney } from "@/lib/costo-interno"
import type { TvFinanciero } from "@/types/tv-financiero"

const APROX_HINT = "Estimación heurística — no es dato contable exacto"

function valorAproximado(monto: number): string {
  return `≈ ${formatMoney(monto)}`
}

export function TvFinancieroFila({
  datos,
  contificoDisponible,
}: {
  datos: TvFinanciero | null
  contificoDisponible: boolean
}) {
  const avisoContifico =
    !contificoDisponible && datos
      ? "Contífico no respondió — mostrando último dato conocido"
      : !contificoDisponible && !datos
        ? "Contífico temporalmente no disponible"
        : undefined

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Facturado mes"
          value={datos ? formatMoney(datos.facturado_mes_actual) : "—"}
          hint={
            datos && !datos.cuenta_verificada
              ? "Cuenta Contífico sin verificar"
              : avisoContifico ?? "IVA incluido · Contífico"
          }
          icon={Receipt}
          tone="bg-primary/15 text-primary"
        />
        <KpiCard
          title="Pendiente por facturar"
          value={
            datos ? valorAproximado(datos.pendiente_por_facturar_aproximado) : "—"
          }
          hint={avisoContifico ?? APROX_HINT}
          icon={Wallet}
          tone="bg-warning/15 text-warning"
        />
        <KpiCard
          title="Cotizaciones pendientes"
          value={
            datos ? valorAproximado(datos.cotizaciones_pendientes_aproximado) : "—"
          }
          hint={avisoContifico ?? APROX_HINT}
          icon={FileCheck}
          tone="bg-highlight/15 text-highlight"
        />
        <div className="rounded-xl p-5 ring-1 ring-border">
          <p className="text-kicker">Facturación por pilar</p>
          <p className="mb-3 text-micro text-muted-foreground">IVA incluido · mes actual</p>
          {datos ? (
            <TvFacturacionPilarBarras pilares={datos.facturacion_por_pilar} />
          ) : (
            <p className="text-kicker text-muted-foreground">—</p>
          )}
          {avisoContifico ? (
            <p className="mt-3 flex items-start gap-1.5 text-micro text-warning">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {avisoContifico}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
