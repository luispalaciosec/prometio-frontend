import {
  Bell,
  CalendarClock,
  FileCheck,
  FileText,
  Flame,
  ScrollText,
  Target,
  type LucideIcon,
} from "lucide-react"

import type { SugerenciaInicioPrioridad, SugerenciaInicioTipo } from "@/types/inicio-sugerencias"

export const SUGERENCIA_TIPO_VISUAL: Record<
  SugerenciaInicioTipo,
  { icon: LucideIcon; tone: string; label: string }
> = {
  cotizacion_por_vencer: {
    icon: FileText,
    tone: "bg-primary/15 text-primary",
    label: "Cotización por vencer",
  },
  oportunidad_estancada: {
    icon: Bell,
    tone: "bg-warning/15 text-warning",
    label: "Oportunidad estancada",
  },
  actividad_vencida: {
    icon: CalendarClock,
    tone: "bg-destructive/15 text-destructive",
    label: "Actividad vencida",
  },
  oportunidad_caliente: {
    icon: Flame,
    tone: "bg-highlight/15 text-highlight",
    label: "Oportunidad caliente",
  },
  cotizacion_por_aprobar: {
    icon: FileCheck,
    tone: "bg-primary/15 text-primary",
    label: "Cotización por aprobar",
  },
  documento_por_aprobar: {
    icon: ScrollText,
    tone: "bg-primary/15 text-primary",
    label: "Documento por aprobar",
  },
  meta_atrasada: {
    icon: Target,
    tone: "bg-success/15 text-success",
    label: "Meta atrasada",
  },
}

export const PRIORIDAD_BADGE: Record<
  SugerenciaInicioPrioridad,
  "destructive" | "warning" | "outline"
> = {
  alta: "destructive",
  media: "warning",
  baja: "outline",
}

export const PRIORIDAD_ORDEN: Record<SugerenciaInicioPrioridad, number> = {
  alta: 0,
  media: 1,
  baja: 2,
}
