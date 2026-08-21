import type { EtapaPipelineCodigo } from "./etapa-pipeline"

export const ESTADOS_ALERTA = ["alerta", "escalada"] as const

export type EstadoAlerta = (typeof ESTADOS_ALERTA)[number]

export type Alerta = {
  oportunidad_id: string
  etapa: EtapaPipelineCodigo
  ejecutivo_id: string
  contacto_id: string
  empresa_id: string
  fecha_ultima_actividad: string
  horas_transcurridas: number
  umbral_alerta_horas: number
  estado_alerta: EstadoAlerta
}
