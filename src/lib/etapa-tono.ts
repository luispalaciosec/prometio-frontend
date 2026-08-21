import { cn } from "@/lib/utils"
import type { EtapaPipelineCodigo } from "@/types/etapa-pipeline"

export type EtapaTono = "temprana" | "media" | "ganado" | "perdido"

/** Agrupa las 9 etapas fijas en 4 tonos de progreso. No un color por columna. */
export function tonoEtapa(codigo: EtapaPipelineCodigo): EtapaTono {
  if (codigo === "cierre_ganado") {
    return "ganado"
  }
  if (codigo === "cierre_perdido") {
    return "perdido"
  }
  if (
    codigo === "propuesta" ||
    codigo === "evaluacion" ||
    codigo === "negociacion" ||
    codigo === "contratacion"
  ) {
    return "media"
  }
  return "temprana"
}

export function claseTituloEtapa(codigo: EtapaPipelineCodigo): string {
  const tono = tonoEtapa(codigo)
  return {
    temprana: "text-primary",
    media: "text-warning",
    ganado: "text-success",
    perdido: "text-destructive",
  }[tono]
}

export function claseCuerpoEtapa(codigo: EtapaPipelineCodigo, isOver: boolean): string {
  const tono = tonoEtapa(codigo)
  return cn(
    tono === "temprana" && "bg-primary/5 ring-primary/20",
    tono === "media" && "bg-warning/5 ring-warning/25",
    tono === "ganado" && "bg-success/5 ring-success/20",
    tono === "perdido" && "bg-destructive/5 ring-destructive/20",
    isOver && "bg-muted/40 ring-highlight/50",
  )
}
