export const TIPOS_TIMELINE = [
  "actividad_reportada",
  "oportunidad_cierre_ganado",
  "oportunidad_cierre_perdido",
  "cotizacion_aprobada",
  "lead_convertido",
  "oportunidad_asignada_automatica",
] as const

export type TipoTimeline = (typeof TIPOS_TIMELINE)[number]

export const TIPO_TIMELINE_LABELS: Record<TipoTimeline, string> = {
  actividad_reportada: "Actividad reportada",
  oportunidad_cierre_ganado: "Cierre ganado",
  oportunidad_cierre_perdido: "Cierre perdido",
  cotizacion_aprobada: "Cotización aprobada",
  lead_convertido: "Lead convertido",
  oportunidad_asignada_automatica: "Asignación automática",
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

/** Etiqueta legible; fallback humaniza snake_case desconocido. */
export function labelTipoTimeline(value: string): string {
  if (esTipoTimeline(value)) {
    return TIPO_TIMELINE_LABELS[value]
  }
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}
