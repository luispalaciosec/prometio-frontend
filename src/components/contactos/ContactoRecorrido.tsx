import { useEffect, useState } from "react"
import { Route as RouteIcon } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { TableSkeleton } from "@/components/skeleton"
import { TimelineEventoMark } from "@/components/timeline/TimelineEventoMark"
import { listTimeline } from "@/lib/api/timeline"
import { formatDateTime } from "@/lib/datetime-local"
import { resumenDetalle, textoDetalle } from "@/lib/timeline-detalle"
import type { TimelineEvento } from "@/types/timeline"

function campana(detalle: Record<string, unknown>): string | null {
  const nombre = textoDetalle(detalle, "utm_campaign")
  const origen = [textoDetalle(detalle, "utm_source"), textoDetalle(detalle, "utm_medium")].filter(Boolean).join(" / ")
  if (nombre) {
    return origen ? `Campaña: ${nombre} (${origen})` : `Campaña: ${nombre}`
  }
  return origen ? `Origen: ${origen}` : null
}

/** Qué dejó el contacto en un envío del formulario. Una línea por dato, solo los que vinieron. */
function lineasFormulario(detalle: Record<string, unknown>): string[] {
  const producto = textoDetalle(detalle, "producto_interes")
  const nombre = textoDetalle(detalle, "nombre_enviado")
  const lugar = [textoDetalle(detalle, "empresa"), textoDetalle(detalle, "ciudad")].filter(Boolean).join(" · ")
  const utm = campana(detalle)
  return [
    producto ? `Pidió: ${producto}` : null,
    nombre ? `Escribió el nombre: ${nombre}` : null,
    lugar || null,
    utm,
  ].filter((linea): linea is string => linea != null)
}

export function ContactoRecorrido({ contactoId }: { contactoId: string }) {
  const [eventos, setEventos] = useState<TimelineEvento[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setEventos(null)
    setError(false)
    void listTimeline({ entidad_id: contactoId, limit: 50 })
      .then((filas) => {
        if (!cancelled) {
          setEventos(filas)
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
  }, [contactoId])

  const ordenados =
    eventos == null
      ? null
      : [...eventos].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <section className="surface-card p-4">
      <h2 className="mb-4 text-section">Recorrido</h2>
      {error ? (
        <EmptyState icon={RouteIcon} title="Sin recorrido" body="No se pudo cargar. Probá recargar la página." />
      ) : ordenados == null ? (
        <TableSkeleton rows={2} />
      ) : ordenados.length === 0 ? (
        <EmptyState
          icon={RouteIcon}
          title="Sin recorrido"
          body="Acá aparece cada vez que este contacto entra por el formulario web."
        />
      ) : (
        <ol className="space-y-4">
          {ordenados.map((evento) => {
            const esFormulario = evento.tipo_evento === "formulario_web_enviado"
            const envio = evento.detalle.envio_numero
            const resumen = esFormulario ? null : resumenDetalle(evento)
            const lineas = esFormulario ? lineasFormulario(evento.detalle) : resumen ? [resumen] : []
            return (
              <li key={evento.id} className="space-y-1">
                <TimelineEventoMark row={evento} size="md" />
                {lineas.map((linea) => (
                  <p key={linea} className="pl-10 text-ui">
                    {linea}
                  </p>
                ))}
                <p className="pl-10 text-kicker text-muted-foreground">
                  {typeof envio === "number" ? `Envío n.º ${envio} · ` : ""}
                  {formatDateTime(evento.created_at)}
                </p>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
