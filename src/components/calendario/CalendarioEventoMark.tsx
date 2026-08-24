import { KindMark } from "@/components/kind-mark"
import { TipoActividadMark } from "@/components/pipeline/TipoActividadMark"
import { CALENDARIO_EVENTO_VISUAL } from "@/lib/calendario-visual"
import { esTipoActividad } from "@/lib/calendario-rango"
import type { EventoCalendario } from "@/types/calendario"

export function CalendarioEventoMark({
  evento,
  size = "md",
  showLabel = true,
}: {
  evento: EventoCalendario
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}) {
  if (evento.tipo === "actividad") {
    if (esTipoActividad(evento.tipo_actividad)) {
      return <TipoActividadMark tipo={evento.tipo_actividad} size={size} showLabel={showLabel} />
    }
    return null
  }
  const visual = CALENDARIO_EVENTO_VISUAL[evento.tipo]
  return <KindMark icon={visual.icon} tone={visual.tone} size={size} label={showLabel ? visual.label : undefined} />
}
