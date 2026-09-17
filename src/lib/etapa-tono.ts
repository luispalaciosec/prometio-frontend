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
    "border border-border/80",
    tono === "temprana" && "border-primary/15 bg-primary/10",
    tono === "media" && "border-warning/20 bg-warning/10",
    tono === "ganado" && "border-success/20 bg-success/10",
    tono === "perdido" && "border-destructive/20 bg-destructive/10",
    isOver && "border-primary/40 bg-primary/5",
  )
}
