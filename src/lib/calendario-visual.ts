/**
 * Catálogo Kind de eventos de calendario que no son actividad.
 * Las actividades reusan `actividad-visual.ts` vía TipoActividadMark.
 * Las pantallas renderizan KindMark / CalendarioEventoMark; no eligen Lucide ni tono.
 */
import { Cake, FileClock, type LucideIcon } from "lucide-react"

export const CALENDARIO_EVENTO_VISUAL = {
  cumpleanos: { icon: Cake, tone: "bg-success/15 text-success", label: "Cumpleaños" },
  vencimiento_cotizacion: {
    icon: FileClock,
    tone: "bg-warning/15 text-warning",
    label: "Vencimiento",
  },
} as const satisfies Record<string, { icon: LucideIcon; tone: string; label: string }>
