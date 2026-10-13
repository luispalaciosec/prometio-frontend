import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { MailCheck } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { ListSkeleton } from "@/components/skeleton"
import { Badge } from "@/components/ui/badge"
import { listCotizaciones } from "@/lib/api/cotizacion"
import { etiquetaContacto, etiquetaEmpresa } from "@/lib/api/oportunidad"
import { hoyEcuador } from "@/lib/contrato-recurrente"
import { rutaConstructorCotizacion } from "@/lib/cotizacion-rutas"
import { formatMoney } from "@/lib/costo-interno"
import { diasHasta } from "@/lib/dashboard-comercial"
import type { CotizacionConLineas } from "@/types/cotizacion"
import type { Oportunidad } from "@/types/oportunidad"

const MAX_FILAS = 6
/** Enviada hace más de esto sin respuesta → pide seguimiento. */
const DIAS_SIN_RESPUESTA = 7
/** Validez que vence dentro de esto → pide seguimiento. */
const DIAS_POR_VENCER = 7

type Fila = {
  cotizacion: CotizacionConLineas
  /** Días hasta `valido_hasta`; null si no tiene. */
  diasValidez: number | null
  diasEnviada: number
}

function badge(fila: Fila) {
  if (fila.diasValidez != null && fila.diasValidez < 0) {
    return <Badge variant="destructive">Oferta vencida</Badge>
  }
  if (fila.diasValidez != null && fila.diasValidez <= DIAS_POR_VENCER) {
    return (
      <Badge variant="warning">
        {fila.diasValidez === 0 ? "Vence hoy" : `Vence en ${fila.diasValidez} d`}
      </Badge>
    )
  }
  return <Badge variant="outline">{fila.diasEnviada} días sin respuesta</Badge>
}

export function DashboardCotizacionesSeguimiento({
  oportunidades,
}: {
  /** Solo para esperar a que las etiquetas de contacto/empresa estén cargadas. */
  oportunidades: Oportunidad[] | null
}) {
  const [rows, setRows] = useState<Fila[] | null>(null)

  useEffect(() => {
    let cancelled = false
    void listCotizaciones({ estado: "enviada" })
      .then((cotizaciones) => {
        if (cancelled) {
          return
        }
        const hoy = hoyEcuador()
        const filas = cotizaciones
          .map((cotizacion) => ({
            cotizacion,
            diasValidez: cotizacion.valido_hasta ? diasHasta(cotizacion.valido_hasta, hoy) : null,
            diasEnviada: -diasHasta(cotizacion.created_at.slice(0, 10), hoy),
          }))
          .filter(
            (fila) =>
              (fila.diasValidez != null && fila.diasValidez <= DIAS_POR_VENCER) ||
              fila.diasEnviada >= DIAS_SIN_RESPUESTA,
          )
          .sort(
            (a, b) =>
              (a.diasValidez ?? Number.POSITIVE_INFINITY) - (b.diasValidez ?? Number.POSITIVE_INFINITY) ||
              b.diasEnviada - a.diasEnviada,
          )
        setRows(filas)
      })
      .catch(() => {
        if (!cancelled) {
          setRows([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const oppPorId = new Map((oportunidades ?? []).map((row) => [row.id, row]))

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-section">Cotizaciones a seguir</h2>
          <p className="mt-1 text-kicker text-muted-foreground">
            Enviadas con la oferta por vencer o más de {DIAS_SIN_RESPUESTA} días sin respuesta.
          </p>
        </div>
        <Link to="/cotizaciones" className="text-ui-medium underline-offset-4 hover:underline">
          Ver todas
        </Link>
      </div>
      {rows == null || oportunidades == null ? (
        <ListSkeleton rows={3} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={MailCheck}
          title="Todo al día"
          body="Ninguna cotización enviada está por vencer ni lleva días sin respuesta."
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl ring-1 ring-border">
          {rows.slice(0, MAX_FILAS).map((fila) => {
            const opp = oppPorId.get(fila.cotizacion.oportunidad_id)
            return (
              <li key={fila.cotizacion.id}>
                <Link
                  to={rutaConstructorCotizacion(fila.cotizacion.id)}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-ui-medium">
                      {fila.cotizacion.numero} · {opp ? etiquetaContacto(opp.contacto_id) : "—"}
                    </p>
                    <p className="truncate text-kicker text-muted-foreground">
                      {opp ? etiquetaEmpresa(opp.empresa_id) : "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-ui tabular-nums">{formatMoney(fila.cotizacion.subtotal_cotizacion)}</span>
                    {badge(fila)}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
      {rows && rows.length > MAX_FILAS ? (
        <p className="text-kicker">Y {rows.length - MAX_FILAS} más en Cotizaciones.</p>
      ) : null}
    </section>
  )
}
