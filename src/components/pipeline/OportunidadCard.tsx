import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { MoreHorizontal } from "lucide-react"

import { AlertaEstadoBadge } from "@/components/alertas/AlertaEstadoBadge"
import { LeadScoreBadge } from "@/components/pipeline/LeadScoreBadge"
import { OportunidadValor } from "@/components/pipeline/OportunidadValor"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  diasSinActividad,
  oportunidadNombreLibre,
  textoDiasSinActividad,
  valorEfectivoOportunidad,
} from "@/lib/oportunidad-presentacion"
import { cn } from "@/lib/utils"
import type { EstadoAlerta } from "@/types/alerta"
import type { OportunidadKanban } from "@/types/oportunidad"

export function OportunidadCard({
  oportunidad,
  estadoAlerta,
  mostrarEjecutivo,
  onReasignar,
  onAbrir,
}: {
  oportunidad: OportunidadKanban
  estadoAlerta?: EstadoAlerta
  /** Solo con «Todo el equipo»: un vendedor ve únicamente lo suyo. */
  mostrarEjecutivo: boolean
  onReasignar?: (id: string) => void
  onAbrir: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: oportunidad.id,
    data: { etapa: oportunidad.etapa, oportunidad },
  })
  const nombreLibre = oportunidadNombreLibre(oportunidad.nombre)
  const cerrada = oportunidad.etapa === "cierre_ganado" || oportunidad.etapa === "cierre_perdido"
  const dias = diasSinActividad(oportunidad)

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn("surface-interactive relative p-3", isDragging && "z-10 opacity-70")}
    >
      <div
        className="cursor-grab space-y-1.5 active:cursor-grabbing"
        {...listeners}
        {...attributes}
        onClick={() => onAbrir(oportunidad.id)}
      >
        <div className="flex items-start justify-between gap-2 pr-6">
          <p className="line-clamp-2 break-words text-ui-medium">
            {nombreLibre ?? oportunidad.contacto.nombre_completo}
          </p>
          <LeadScoreBadge score={oportunidad.lead_score} className="shrink-0" />
        </div>
        <div className="text-kicker">
          {nombreLibre ? <p className="truncate">{oportunidad.contacto.nombre_completo}</p> : null}
          <p className="truncate text-muted-foreground">{oportunidad.empresa.nombre}</p>
        </div>
        {cerrada ? null : (
          <p className="flex flex-wrap items-center gap-1.5 text-kicker">
            <span className={cn("tabular-nums", estadoAlerta ? "text-foreground" : "text-muted-foreground")}>
              {dias === 0 ? "Actividad hoy" : `${textoDiasSinActividad(dias)} sin actividad`}
            </span>
            {estadoAlerta ? <AlertaEstadoBadge estado={estadoAlerta} /> : null}
          </p>
        )}
        {valorEfectivoOportunidad(oportunidad) > 0 ? (
          <p className="text-ui">
            <OportunidadValor
              valor_referencial={oportunidad.valor_referencial}
              valor_cotizado={oportunidad.valor_cotizado}
            />
          </p>
        ) : null}
        {mostrarEjecutivo ? (
          <p className="truncate text-kicker text-muted-foreground">{oportunidad.ejecutivo.nombre_completo}</p>
        ) : null}
      </div>
      {onReasignar ? (
        <div className="absolute top-2 right-1" onPointerDown={(event) => event.stopPropagation()}>
          {/* No modal: "Reasignar" abre un diálogo al cerrarse el menú (ver PipelineLista). */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="xs" aria-label="Acciones de la oportunidad">
                <MoreHorizontal className="size-4" strokeWidth={1.75} aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onAbrir(oportunidad.id)}>Abrir</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onReasignar(oportunidad.id)}>Reasignar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null}
    </article>
  )
}
