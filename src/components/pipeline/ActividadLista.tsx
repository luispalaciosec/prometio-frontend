import { CalendarClock } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { Skeleton } from "@/components/skeleton"
import { ActividadForm, type ActividadFormValores } from "@/components/pipeline/ActividadForm"
import { ActividadReportar } from "@/components/pipeline/ActividadReportar"
import { ActividadEstadoBadge } from "@/components/pipeline/ActividadEstadoBadge"
import { TipoActividadMark } from "@/components/pipeline/TipoActividadMark"
import { Button } from "@/components/ui/button"
import { formatDateTime } from "@/lib/datetime-local"
import type { Actividad } from "@/types/actividad"

export function ActividadLista({
  actividades,
  cargando = false,
  onProgramar,
  editandoId,
  reportandoId,
  onEditar,
  onReportar,
  onBorrar,
  onGuardarEdicion,
  onConfirmarReporte,
  onCancelar,
}: {
  actividades: Actividad[]
  cargando?: boolean
  onProgramar?: () => void
  editandoId: string | null
  reportandoId: string | null
  onEditar: (id: string) => void
  onReportar: (id: string) => void
  onBorrar: (id: string) => void
  onGuardarEdicion: (id: string, input: ActividadFormValores) => void
  onConfirmarReporte: (id: string, input: { reportada_en: string; feedback: string }) => void
  onCancelar: () => void
}) {
  if (cargando) {
    return (
      <div className="space-y-2" aria-hidden>
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    )
  }

  if (actividades.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="Nada programado"
        body="Las visitas y llamadas de esta oportunidad aparecen acá. Programá la primera para que el pipeline no se estanque."
        action={
          onProgramar ? (
            <Button type="button" variant="ghost" size="sm" onClick={onProgramar}>
              Programar actividad
            </Button>
          ) : null
        }
      />
    )
  }

  return (
    <ul className="space-y-3">
      {actividades.map((actividad) => {
        if (editandoId === actividad.id) {
          return (
            <li key={actividad.id}>
              <ActividadForm
                modo="editar"
                actividad={actividad}
                onSubmit={(input) => onGuardarEdicion(actividad.id, input)}
                onCancel={onCancelar}
              />
            </li>
          )
        }

        const pendiente = actividad.programada_para != null && actividad.reportada_en == null

        return (
          <li key={actividad.id} className="rounded-xl p-3 ring-1 ring-border">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <TipoActividadMark tipo={actividad.tipo} size="md" />
                  <ActividadEstadoBadge actividad={actividad} />
                </div>
                <p className="text-kicker">
                  programada_para {formatDateTime(actividad.programada_para)} · reportada_en{" "}
                  {formatDateTime(actividad.reportada_en)}
                </p>
                {actividad.feedback ? (
                  <p className="text-ui">{actividad.feedback}</p>
                ) : null}
                <p className="text-kicker">
                  Calendar {actividad.google_calendar_event_id ?? "—"} · Meet{" "}
                  {actividad.google_meet_url ?? "—"}
                </p>
              </div>
              <div className="flex gap-1">
                {pendiente ? (
                  <Button type="button" variant="ghost" size="xs" onClick={() => onReportar(actividad.id)}>
                    Reportar
                  </Button>
                ) : null}
                <Button type="button" variant="ghost" size="xs" onClick={() => onEditar(actividad.id)}>
                  Editar
                </Button>
                <Button type="button" variant="ghost" size="xs" onClick={() => onBorrar(actividad.id)}>
                  Borrar
                </Button>
              </div>
            </div>
            {reportandoId === actividad.id ? (
              <ActividadReportar
                actividad={actividad}
                onSubmit={(input) => onConfirmarReporte(actividad.id, input)}
                onCancel={onCancelar}
              />
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
