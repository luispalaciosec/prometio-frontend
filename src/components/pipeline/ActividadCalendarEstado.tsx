import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Actividad } from "@/types/actividad"

function aplicaCalendar(actividad: Actividad): boolean {
  return (
    (actividad.tipo === "visita" || actividad.tipo === "videollamada") &&
    actividad.programada_para != null
  )
}

export function ActividadCalendarEstado({
  actividad,
  onSincronizar,
}: {
  actividad: Actividad
  onSincronizar?: (id: string) => void
}) {
  const sincronizada = Boolean(actividad.google_calendar_event_id)
  const error = actividad.google_calendar_sync_error
  const meetUrl = actividad.google_meet_url
  const puedeReintentar = Boolean(onSincronizar) && aplicaCalendar(actividad) && (Boolean(error) || !sincronizada)

  if (!sincronizada && !error && !meetUrl && !puedeReintentar) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {sincronizada && !error ? <Badge variant="success">En Calendar</Badge> : null}
      {error ? (
        <Badge variant="warning" title={error}>
          No se sincronizó
        </Badge>
      ) : null}
      {meetUrl ? (
        <a
          href={meetUrl}
          target="_blank"
          rel="noreferrer"
          className="text-kicker text-primary underline-offset-4 hover:underline"
        >
          Abrir videollamada
        </a>
      ) : null}
      {puedeReintentar ? (
        <Button type="button" variant="ghost" size="xs" onClick={() => onSincronizar?.(actividad.id)}>
          Sincronizar
        </Button>
      ) : null}
    </div>
  )
}
