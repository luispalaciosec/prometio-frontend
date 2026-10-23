import { useRef } from "react"
import { DndContext, PointerSensor, closestCorners, useSensor, useSensors } from "@dnd-kit/core"
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core"

import { DIAS_CIERRES_RECIENTES, PipelineColumn } from "@/components/pipeline/PipelineColumn"
import { ETAPA_PIPELINE_CODIGOS, type EtapaPipeline, type EtapaPipelineCodigo } from "@/types/etapa-pipeline"
import type { EstadoAlerta } from "@/types/alerta"
import type { OportunidadKanban } from "@/types/oportunidad"

function isEtapaCodigo(value: string): value is EtapaPipelineCodigo {
  return (ETAPA_PIPELINE_CODIGOS as readonly string[]).includes(value)
}

const ETAPAS_CERRADAS: EtapaPipelineCodigo[] = ["cierre_ganado", "cierre_perdido"]

/** Cerrada dentro de la ventana reciente. Sin fecha de cierre (datos viejos) cuenta como antigua. */
function cierreReciente(row: OportunidadKanban, desde: number): boolean {
  const fecha = row.fecha_cierre ? Date.parse(row.fecha_cierre) : Number.NaN
  return !Number.isNaN(fecha) && fecha >= desde
}

export function PipelineBoard({
  etapas,
  items,
  alertasPorId,
  onMover,
  onPedirCierrePerdido,
  onReasignar,
  onAbrir,
  mostrarEjecutivo,
  onVerCerradas,
}: {
  etapas: EtapaPipeline[]
  items: OportunidadKanban[]
  alertasPorId?: Map<string, EstadoAlerta>
  onMover: (id: string, etapa: EtapaPipelineCodigo) => void
  onPedirCierrePerdido: (id: string) => void
  onReasignar?: (id: string) => void
  onAbrir: (id: string) => void
  mostrarEjecutivo: boolean
  /** Abre la vista Lista filtrada por esa etapa cerrada, con todo su historial. */
  onVerCerradas: (etapa: EtapaPipelineCodigo) => void
}) {
  const dragDidActivate = useRef(false)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  function etapaDestino(event: DragEndEvent): EtapaPipelineCodigo | null {
    const overId = event.over?.id
    if (typeof overId !== "string") {
      return null
    }
    if (isEtapaCodigo(overId)) {
      return overId
    }
    return items.find((row) => row.id === overId)?.etapa ?? null
  }

  function handleDragStart(_event: DragStartEvent) {
    dragDidActivate.current = true
  }

  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id)
    const from = items.find((row) => row.id === activeId)?.etapa
    const to = etapaDestino(event)
    if (from && to && from !== to) {
      if (to === "cierre_perdido") {
        onPedirCierrePerdido(activeId)
      } else {
        onMover(activeId, to)
      }
    }
    window.setTimeout(() => {
      dragDidActivate.current = false
    }, 100)
  }

  function handleAbrir(id: string) {
    if (dragDidActivate.current) {
      return
    }
    onAbrir(id)
  }

  const ordered = [...etapas].sort((a, b) => a.orden - b.orden)
  const desde = Date.now() - DIAS_CIERRES_RECIENTES * 86_400_000

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        window.setTimeout(() => {
          dragDidActivate.current = false
        }, 100)
      }}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {ordered.map((etapa) => {
          const deEtapa = items.filter((row) => row.etapa === etapa.codigo)
          const cerrada = ETAPAS_CERRADAS.includes(etapa.codigo)
          const visibles = cerrada ? deEtapa.filter((row) => cierreReciente(row, desde)) : deEtapa
          return (
            <PipelineColumn
              key={etapa.id}
              etapa={etapa}
              items={visibles}
              ocultas={deEtapa.length - visibles.length}
              alertasPorId={alertasPorId}
              mostrarEjecutivo={mostrarEjecutivo}
              onReasignar={onReasignar}
              onAbrir={handleAbrir}
              onVerTodas={cerrada ? () => onVerCerradas(etapa.codigo) : undefined}
            />
          )
        })}
      </div>
    </DndContext>
  )
}
