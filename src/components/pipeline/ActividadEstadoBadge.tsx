import { Badge } from "@/components/ui/badge"
import { estadoActividad } from "@/lib/actividad-estado"
import type { Actividad } from "@/types/actividad"

const VARIANTE = {
  programada: "warning",
  reportada: "success",
  actividad: "outline",
} as const

export function ActividadEstadoBadge({ actividad }: { actividad: Actividad }) {
  const estado = estadoActividad(actividad)
  return <Badge variant={VARIANTE[estado]}>{estado}</Badge>
}
