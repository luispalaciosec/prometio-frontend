export type SugerenciaInicioPrioridad = "alta" | "media" | "baja"

export type SugerenciaInicioTipo =
  | "cotizacion_por_vencer"
  | "oportunidad_estancada"
  | "actividad_vencida"
  | "oportunidad_caliente"
  | "cotizacion_por_aprobar"
  | "documento_por_aprobar"
  | "meta_atrasada"
  | "lead_linkedin_prioritario"

export type EnlaceSugerenciaTipo =
  | "oportunidad"
  | "cotizacion"
  | "actividad"
  | "documento_alcance"
  | "meta"
  | "lead_linkedin"

export type EnlaceSugerencia = {
  tipo: EnlaceSugerenciaTipo
  id: string
}

export type SugerenciaInicio = {
  id: string
  tipo: SugerenciaInicioTipo
  prioridad: SugerenciaInicioPrioridad
  titulo: string
  motivo: string
  accion: string
  mensaje_sugerido: string | null
  enlace: EnlaceSugerencia
}

export type SugerenciasInicioResponse = {
  generado_en: string
  generado_con_ia: boolean
  sugerencias: SugerenciaInicio[]
}
