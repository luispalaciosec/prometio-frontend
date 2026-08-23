export const PERIODO_TIPOS = ["mensual", "trimestral"] as const

export type PeriodoTipo = (typeof PERIODO_TIPOS)[number]

export const PERIODO_TIPO_LABELS: Record<PeriodoTipo, string> = {
  mensual: "Mensual",
  trimestral: "Trimestral",
}

export type MetaComercial = {
  id: string
  organizacion_id: string
  perfil_id: string | null
  periodo_tipo: PeriodoTipo
  fecha_inicio: string
  fecha_fin: string
  monto: number
  created_at: string
}

export type MetaComercialCreate = {
  perfil_id: string | null
  periodo_tipo: PeriodoTipo
  fecha_inicio: string
  fecha_fin: string
  monto: number
}
