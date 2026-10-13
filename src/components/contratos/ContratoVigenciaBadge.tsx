import { Badge } from "@/components/ui/badge"
import { CONTRATO_VIGENCIA_LABELS, CONTRATO_VIGENCIA_VARIANTS } from "@/lib/contrato-recurrente"
import type { ContratoVigencia } from "@/types/contrato-recurrente"

export function ContratoVigenciaBadge({ vigencia }: { vigencia: ContratoVigencia }) {
  return (
    <Badge variant={CONTRATO_VIGENCIA_VARIANTS[vigencia]}>{CONTRATO_VIGENCIA_LABELS[vigencia]}</Badge>
  )
}
