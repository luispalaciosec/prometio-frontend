import { Badge } from "@/components/ui/badge"
import type { EstadoSla } from "@/types/atencion-lead"

const ESTADO: Record<EstadoSla, { label: string; variant: "success" | "warning" | "destructive" }> = {
  a_tiempo: { label: "A tiempo", variant: "success" },
  vencido: { label: "Vencido", variant: "warning" },
  escalado: { label: "Escalado", variant: "destructive" },
}

export function LeadSlaBadge({ estado }: { estado: EstadoSla }) {
  const { label, variant } = ESTADO[estado]
  return <Badge variant={variant}>{label}</Badge>
}
