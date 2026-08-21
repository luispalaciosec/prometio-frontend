import { Badge } from "@/components/ui/badge"
import type { CotizacionEstado } from "@/types/cotizacion"

const LABELS: Record<CotizacionEstado, string> = {
  borrador: "borrador",
  preparacion: "preparacion",
  enviada: "enviada",
  aprobada: "aprobada",
  rechazada: "rechazada",
  vencida: "vencida",
}

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
  return <Badge variant={VARIANTS[estado]}>{LABELS[estado]}</Badge>
}
