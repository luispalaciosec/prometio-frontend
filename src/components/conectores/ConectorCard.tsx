import { Badge } from "@/components/ui/badge"

export type ConectorEstado = "en_desarrollo" | "proximamente"

const ESTADO_LABEL: Record<ConectorEstado, string> = {
  en_desarrollo: "En desarrollo",
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
    <div className="flex items-start gap-3 rounded-xl p-4 ring-1 ring-foreground/10">
      <div
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-medium"
      >
        {inicial}
      </div>
      <div className="min-w-0 space-y-1">
        <p className="font-medium">{nombre}</p>
        <Badge variant={estado === "en_desarrollo" ? "secondary" : "outline"}>
          {ESTADO_LABEL[estado]}
        </Badge>
      </div>
    </div>
  )
}
