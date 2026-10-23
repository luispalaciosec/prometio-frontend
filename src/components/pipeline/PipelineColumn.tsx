import { useDroppable } from "@dnd-kit/core"

import { OportunidadCard } from "@/components/pipeline/OportunidadCard"
import { formatMoney } from "@/lib/costo-interno"
import { claseCuerpoEtapa, claseTituloEtapa } from "@/lib/etapa-tono"
import { valorEfectivoOportunidad } from "@/lib/oportunidad-presentacion"
import { cn } from "@/lib/utils"
import type { EstadoAlerta } from "@/types/alerta"
import type { EtapaPipeline } from "@/types/etapa-pipeline"
import type { OportunidadKanban } from "@/types/oportunidad"

/** Ganado y Perdido muestran solo lo cerrado en esta ventana; el resto queda en la vista Lista. */
export const DIAS_CIERRES_RECIENTES = 30

export function PipelineColumn({
  etapa,
  items,
  ocultas = 0,
  alertasPorId,
  mostrarEjecutivo,
  onReasignar,
  onAbrir,
  onVerTodas,
}: {
  etapa: EtapaPipeline
  items: OportunidadKanban[]
  /** Cerradas fuera de la ventana reciente (solo Ganado y Perdido). */
  ocultas?: number
  alertasPorId?: Map<string, EstadoAlerta>
  mostrarEjecutivo: boolean
  onReasignar?: (id: string) => void
  onAbrir: (id: string) => void
  onVerTodas?: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: etapa.codigo,
    data: { etapa: etapa.codigo },
  })
  const cerrada = etapa.codigo === "cierre_ganado" || etapa.codigo === "cierre_perdido"
  const total = items.reduce((suma, row) => suma + valorEfectivoOportunidad(row), 0)

  return (
    <section className="flex w-60 shrink-0 flex-col">
      <header className="mb-2 px-1">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className={cn("text-ui-medium", claseTituloEtapa(etapa.codigo))}>{etapa.nombre}</h2>
          <span className="text-kicker tabular-nums">{items.length}</span>
        </div>
        <p className="text-kicker tabular-nums text-muted-foreground">
          {total > 0 ? formatMoney(total) : "Sin valor"}
          {cerrada ? ` · últimos ${DIAS_CIERRES_RECIENTES} días` : ""}
        </p>
      </header>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-24 flex-1 flex-col gap-2 rounded-xl p-2 transition-colors duration-150",
          claseCuerpoEtapa(etapa.codigo, isOver),
        )}
      >
        {items.map((item) => (
          <OportunidadCard
            key={item.id}
            oportunidad={item}
            estadoAlerta={alertasPorId?.get(item.id)}
            mostrarEjecutivo={mostrarEjecutivo}
            onReasignar={onReasignar}
            onAbrir={onAbrir}
          />
        ))}
        {items.length === 0 ? (
          <p className="px-2 py-4 text-center text-kicker text-muted-foreground">
            {cerrada && ocultas > 0 ? "Nada cerrado en estos días." : "Sin oportunidades. Arrastrá una tarjeta acá."}
          </p>
        ) : null}
        {cerrada && ocultas > 0 && onVerTodas ? (
          <button
            type="button"
            onClick={onVerTodas}
            className="mt-auto rounded-lg px-2 py-1.5 text-kicker text-foreground underline-offset-4 hover:underline"
          >
            Ver todas ({items.length + ocultas})
          </button>
        ) : null}
      </div>
    </section>
  )
}
