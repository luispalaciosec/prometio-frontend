import { KindMark } from "@/components/kind-mark"
import { TIPO_ACTIVIDAD_VISUAL } from "@/lib/actividad-visual"
import { TIPO_ACTIVIDAD_LABELS, type TipoActividad } from "@/types/actividad"

export function TipoActividadMark({
  tipo,
  size = "sm",
  showLabel = true,
}: {
  tipo: TipoActividad
  size?: "sm" | "md"
  showLabel?: boolean
}) {
  const visual = TIPO_ACTIVIDAD_VISUAL[tipo]
  return (
    <KindMark
      icon={visual.icon}
      tone={visual.tone}
      size={size}
      label={showLabel ? TIPO_ACTIVIDAD_LABELS[tipo] : undefined}
    />
  )
}
