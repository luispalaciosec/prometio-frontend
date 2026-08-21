export const ETAPA_PIPELINE_CODIGOS = [
  "clasificacion",
  "descubrimiento",
  "presentacion_inicial",
  "propuesta",
  "evaluacion",
  "negociacion",
  "contratacion",
  "cierre_ganado",
  "cierre_perdido",
] as const

export type EtapaPipelineCodigo = (typeof ETAPA_PIPELINE_CODIGOS)[number]

export type EtapaPipeline = {
  id: string
  organizacion_id: string
  codigo: EtapaPipelineCodigo
  nombre: string
  orden: number
  probabilidad_cierre_default_pct: number
  umbral_alerta_horas: number | null
}
