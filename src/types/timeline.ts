export const TIPOS_TIMELINE = [
  "actividad_reportada",
  "oportunidad_cierre_ganado",
  "oportunidad_cierre_perdido",
  "cotizacion_aprobada",
  "lead_convertido",
] as const

export type TipoTimeline = (typeof TIPOS_TIMELINE)[number]

export const TIPO_TIMELINE_LABELS: Record<TipoTimeline, string> = {
  actividad_reportada: "Actividad reportada",
  oportunidad_cierre_ganado: "Cierre ganado",
  oportunidad_cierre_perdido: "Cierre perdido",
  cotizacion_aprobada: "Cotización aprobada",
  lead_convertido: "Lead convertido",
}

export type TimelineEvento = {
  id: string
  perfil_id: string
  perfil_nombre: string
  tipo_evento: string
  entidad_tipo: string
  entidad_id: string
  detalle: Record<string, unknown>
  created_at: string
}

export function esTipoTimeline(value: string): value is TipoTimeline {
  return (TIPOS_TIMELINE as readonly string[]).includes(value)
}
