import { Badge } from "@/components/ui/badge"
import type { Actividad } from "@/types/actividad"

export function estadoActividad(row: {
  programada_para: string | null
  reportada_en: string | null
}): "programada" | "reportada" | "actividad" {
  if (row.programada_para != null && row.reportada_en == null) {
    return "programada"
  }
  if (row.reportada_en) {
    return "reportada"
  }
  return "actividad"
}

const VARIANTE = {
  programada: "warning",
  reportada: "success",
  actividad: "outline",
} as const

export function ActividadEstadoBadge({ actividad }: { actividad: Actividad }) {
  const estado = estadoActividad(actividad)
  return <Badge variant={VARIANTE[estado]}>{estado}</Badge>
}
