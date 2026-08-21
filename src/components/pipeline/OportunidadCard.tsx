import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"

import { AlertaEstadoBadge } from "@/components/alertas/AlertaEstadoBadge"
import { OportunidadValor } from "@/components/pipeline/OportunidadValor"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { EstadoAlerta } from "@/types/alerta"
import type { OportunidadKanban } from "@/types/oportunidad"

export function OportunidadCard({
  oportunidad,
  estadoAlerta,
  onReasignar,
  onAbrir,
}: {
  oportunidad: OportunidadKanban
  estadoAlerta?: EstadoAlerta
  onReasignar?: (id: string) => void
  onAbrir: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: oportunidad.id,
    data: { etapa: oportunidad.etapa, oportunidad },
  })

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "rounded-lg bg-card p-3 ring-1 ring-foreground/10 transition-shadow duration-150",
        "hover:ring-primary/25",
        isDragging && "z-10 opacity-70 shadow-md",
      )}
    >
      <div
        className="cursor-grab active:cursor-grabbing"
        {...listeners}
        {...attributes}
        onClick={() => onAbrir(oportunidad.id)}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium">{oportunidad.contacto.nombre_completo}</p>
          {estadoAlerta ? <AlertaEstadoBadge estado={estadoAlerta} /> : null}
        </div>
        <p className="text-xs text-muted-foreground">{oportunidad.empresa.nombre}</p>
        <p className="mt-2 text-xs text-muted-foreground">{oportunidad.ejecutivo.nombre_completo}</p>
        <p className="mt-2 text-sm">
          <OportunidadValor
            valor_referencial={oportunidad.valor_referencial}
            valor_cotizado={oportunidad.valor_cotizado}
          />
        </p>
      </div>
      {onReasignar ? (
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className="mt-2"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => onReasignar(oportunidad.id)}
        >
          Reasignar
        </Button>
      ) : null}
    </article>
  )
}
