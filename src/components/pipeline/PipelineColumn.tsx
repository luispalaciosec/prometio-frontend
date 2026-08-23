import { useDroppable } from "@dnd-kit/core"

import { OportunidadCard } from "@/components/pipeline/OportunidadCard"
import { claseCuerpoEtapa, claseTituloEtapa } from "@/lib/etapa-tono"
import { cn } from "@/lib/utils"
import type { EstadoAlerta } from "@/types/alerta"
import type { EtapaPipeline } from "@/types/etapa-pipeline"
import type { OportunidadKanban } from "@/types/oportunidad"

export function PipelineColumn({
  etapa,
  items,
  alertasPorId,
  onReasignar,
  onAbrir,
}: {
  etapa: EtapaPipeline
  items: OportunidadKanban[]
  alertasPorId?: Map<string, EstadoAlerta>
  onReasignar?: (id: string) => void
  onAbrir: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: etapa.codigo,
    data: { etapa: etapa.codigo },
  })

  return (
    <section className="flex w-64 shrink-0 flex-col">
      <header className="mb-2 flex items-baseline justify-between gap-2 px-1">
        <h2 className={cn("text-ui-medium", claseTituloEtapa(etapa.codigo))}>
          {etapa.nombre}
        </h2>
        <span className="text-kicker tabular-nums">{items.length}</span>
      </header>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-40 flex-1 flex-col gap-2 rounded-xl p-2 ring-1 transition-colors duration-150",
          claseCuerpoEtapa(etapa.codigo, isOver),
        )}
      >
        {items.map((item) => (
          <OportunidadCard
            key={item.id}
            oportunidad={item}
            estadoAlerta={alertasPorId?.get(item.id)}
            onReasignar={onReasignar}
            onAbrir={onAbrir}
          />
        ))}
      </div>
    </section>
  )
}
