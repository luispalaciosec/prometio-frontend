import { Badge } from "@/components/ui/badge"
import type { EstadoAlerta } from "@/types/alerta"

const LABELS: Record<EstadoAlerta, string> = {
  alerta: "alerta",
  escalada: "escalada",
}

export function AlertaEstadoBadge({ estado }: { estado: EstadoAlerta }) {
  return (
    <Badge variant={estado === "escalada" ? "destructive" : "warning"}>
      {LABELS[estado]}
    </Badge>
  )
}
