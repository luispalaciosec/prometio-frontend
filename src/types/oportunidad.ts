import type { EtapaPipelineCodigo } from "./etapa-pipeline"

export type LeadScoreDesglose = {
  frescura: number
  seguimiento: number
  primera_respuesta: number | null
  tamano_deal: number
  fit_empresa: number
}

export type Oportunidad = {
  id: string
  organizacion_id: string
  contacto_id: string
  empresa_id: string
  ejecutivo_id: string
  etapa: EtapaPipelineCodigo
  valor_referencial: number | null
  valor_cotizado: number | null
  probabilidad_cierre: number | null
  servicios_ids: string[]
  causa_perdida_principal_id: string | null
  causa_perdida_secundaria_id: string | null
  competidor_mencionado: string | null
  fecha_ultima_actividad: string | null
  activo: boolean
  created_at: string
  lead_score: number
  lead_score_desglose: LeadScoreDesglose
}

/** Fila de tablero: mismos campos de `oportunidad` más nombres ya resueltos. */
export type OportunidadKanban = Oportunidad & {
  contacto: { id: string; nombre_completo: string }
  empresa: { id: string; nombre: string }
  ejecutivo: { id: string; nombre_completo: string }
}

export type PipelineScope = "mio" | "equipo"

export type OportunidadCreate = {
  contacto_id: string
  empresa_id: string
  valor_referencial?: number | null
  servicios_ids?: string[] | null
}

export type OportunidadUpdate = {
  contacto_id?: string
  empresa_id?: string
  valor_referencial?: number | null
  servicios_ids?: string[] | null
}
