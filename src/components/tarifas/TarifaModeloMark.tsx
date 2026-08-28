import { KindMark } from "@/components/kind-mark"
import { TARIFA_MODELO_VISUAL } from "@/lib/tarifa-visual"
import { MODELO_TARIFA_LABELS, type ModeloTarifa } from "@/types/tarifa-interna"

export function TarifaModeloMark({
  modelo,
  showLabel = true,
}: {
  modelo: ModeloTarifa
  showLabel?: boolean
}) {
  const visual = TARIFA_MODELO_VISUAL[modelo]
  return (
    <KindMark
      icon={visual.icon}
      tone={visual.tone}
      size="md"
      label={showLabel ? MODELO_TARIFA_LABELS[modelo] : undefined}
    />
  )
}
