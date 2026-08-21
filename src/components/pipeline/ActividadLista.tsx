import { ActividadForm, type ActividadFormValores } from "@/components/pipeline/ActividadForm"
import { ActividadReportar } from "@/components/pipeline/ActividadReportar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDateTime } from "@/lib/datetime-local"
import { TIPO_ACTIVIDAD_LABELS, type Actividad } from "@/types/actividad"

export function ActividadLista({
  actividades,
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
  editandoId: string | null
  reportandoId: string | null
  onEditar: (id: string) => void
  onReportar: (id: string) => void
  onBorrar: (id: string) => void
  onGuardarEdicion: (id: string, input: ActividadFormValores) => void
  onConfirmarReporte: (id: string, input: { reportada_en: string; feedback: string }) => void
  onCancelar: () => void
}) {
  if (actividades.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin actividades todavía.</p>
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
          <li key={actividad.id} className="rounded-lg p-3 ring-1 ring-foreground/10">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{TIPO_ACTIVIDAD_LABELS[actividad.tipo]}</p>
                  <Badge variant={pendiente ? "secondary" : actividad.reportada_en ? "default" : "outline"}>
                    {pendiente ? "programada" : actividad.reportada_en ? "reportada" : "actividad"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  programada_para {formatDateTime(actividad.programada_para)} · reportada_en{" "}
                  {formatDateTime(actividad.reportada_en)}
                </p>
                {actividad.feedback ? (
                  <p className="text-sm">{actividad.feedback}</p>
                ) : null}
                <p className="text-xs text-muted-foreground">
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
