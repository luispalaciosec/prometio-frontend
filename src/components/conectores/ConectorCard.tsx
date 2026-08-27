import { Badge } from "@/components/ui/badge"
import { ConectorMark } from "@/components/conectores/ConectorMark"
import { CONECTOR_VISUAL, type ConectorId } from "@/lib/conectores-visual"

export type ConectorEstado = "stdio_local" | "proximamente"

const ESTADO_LABEL: Record<ConectorEstado, string> = {
  stdio_local: "stdio local",
  proximamente: "Próximamente",
}

export function ConectorCard({
  id,
  estado,
}: {
  id: ConectorId
  estado: ConectorEstado
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl p-4 ring-1 ring-border">
      <ConectorMark id={id} />
      <div className="min-w-0 space-y-1">
        <p className="text-ui-medium">{CONECTOR_VISUAL[id].label}</p>
        <Badge variant="outline">{ESTADO_LABEL[estado]}</Badge>
      </div>
    </div>
  )
}
