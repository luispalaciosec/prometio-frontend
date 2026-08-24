import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type ConectorEstado = "stdio_local" | "proximamente"

const ESTADO_LABEL: Record<ConectorEstado, string> = {
  stdio_local: "stdio local",
  proximamente: "Próximamente",
}

export function ConectorCard({
  nombre,
  inicial,
  estado,
}: {
  nombre: string
  inicial: string
  estado: ConectorEstado
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl p-4 ring-1 ring-border">
      <div
        aria-hidden
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted font-medium",
          inicial.length > 1 ? "text-micro" : "text-sm",
        )}
      >
        {inicial}
      </div>
      <div className="min-w-0 space-y-1">
        <p className="text-ui-medium">{nombre}</p>
        <Badge variant="outline">{ESTADO_LABEL[estado]}</Badge>
      </div>
    </div>
  )
}
