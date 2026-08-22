import { Badge } from "@/components/ui/badge"
import { ETAPA_CICLO_LABELS, type EtapaCicloVida } from "@/types/contacto"

const VARIANTE = {
  contacto: "outline",
  lead: "warning",
  cliente: "success",
} as const

export function EtapaCicloBadge({ etapa }: { etapa: EtapaCicloVida }) {
  return <Badge variant={VARIANTE[etapa]}>{ETAPA_CICLO_LABELS[etapa]}</Badge>
}
