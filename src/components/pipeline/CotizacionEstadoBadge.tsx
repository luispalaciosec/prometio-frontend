import { Badge } from "@/components/ui/badge"
import { COTIZACION_ESTADO_LABELS, type CotizacionEstado } from "@/types/cotizacion"

const VARIANTS: Record<
  CotizacionEstado,
  "outline" | "secondary" | "default" | "destructive" | "warning" | "success"
> = {
  borrador: "outline",
  preparacion: "warning",
  enviada: "default",
  aprobada: "success",
  rechazada: "destructive",
  vencida: "secondary",
}

export function CotizacionEstadoBadge({ estado }: { estado: CotizacionEstado }) {
  return <Badge variant={VARIANTS[estado]}>{COTIZACION_ESTADO_LABELS[estado]}</Badge>
}
