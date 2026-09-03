import { History } from "lucide-react"

import { KindMark } from "@/components/kind-mark"
import { TipoActividadMark } from "@/components/pipeline/TipoActividadMark"
import { TIMELINE_EVENTO_VISUAL } from "@/lib/timeline-visual"
import { TIPOS_ACTIVIDAD, type TipoActividad } from "@/types/actividad"
import { esTipoTimeline, labelTipoTimeline, TIPO_TIMELINE_LABELS, type TimelineEvento } from "@/types/timeline"

function tipoActividadDe(row: TimelineEvento): TipoActividad | null {
  const raw = row.detalle.tipo_actividad
  if (typeof raw !== "string") {
    return null
  }
  return (TIPOS_ACTIVIDAD as readonly string[]).includes(raw) ? (raw as TipoActividad) : null
}

export function TimelineEventoMark({
  row,
  size = "md",
  showLabel = true,
}: {
  row: TimelineEvento
  size?: "sm" | "md" | "lg"
  /** false en Modo TV — el título va aparte, sin duplicar ni truncar. */
  showLabel?: boolean
}) {
  const tipo = esTipoTimeline(row.tipo_evento) ? row.tipo_evento : null
  if (tipo === "actividad_reportada") {
    const actividad = tipoActividadDe(row)
    if (actividad) {
      return <TipoActividadMark tipo={actividad} size={size} />
    }
  }
  if (tipo) {
    const visual = TIMELINE_EVENTO_VISUAL[tipo]
    return (
      <KindMark
        icon={visual.icon}
        tone={visual.tone}
        size={size}
        label={showLabel ? TIPO_TIMELINE_LABELS[tipo] : undefined}
      />
    )
  }
  return (
    <KindMark
      icon={History}
      tone="bg-muted text-muted-foreground"
      size={size}
      label={showLabel ? labelTipoTimeline(row.tipo_evento) : undefined}
    />
  )
}
