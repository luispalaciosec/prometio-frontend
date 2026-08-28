/**
 * Catálogo Kind de eventos de timeline: el único lugar con ícono y tono por tipo.
 * `actividad_reportada` reusa `actividad-visual` vía TipoActividadMark cuando hay tipo_actividad.
 * Las pantallas renderizan TimelineEventoMark / KindMark; no eligen Lucide ni tono.
 */
import { CircleCheck, CircleOff, ClipboardCheck, FileCheck, UserPlus, type LucideIcon } from "lucide-react"

import type { TipoTimeline } from "@/types/timeline"

export const TIMELINE_EVENTO_VISUAL: Record<TipoTimeline, { icon: LucideIcon; tone: string }> = {
  actividad_reportada: { icon: ClipboardCheck, tone: "bg-success/15 text-success" },
  oportunidad_cierre_ganado: { icon: CircleCheck, tone: "bg-success/15 text-success" },
  oportunidad_cierre_perdido: { icon: CircleOff, tone: "bg-destructive/15 text-destructive" },
  cotizacion_aprobada: { icon: FileCheck, tone: "bg-primary/15 text-primary" },
  lead_convertido: { icon: UserPlus, tone: "bg-highlight/15 text-highlight" },
}
