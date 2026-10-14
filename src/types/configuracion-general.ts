export type ConfiguracionGeneral = {
  id: string
  organizacion_id: string
  margen_agencia_default_pct: number
  comision_agencia_default_min_pct: number
  comision_agencia_default_max_pct: number
  umbral_descuento_aprobacion_pct: number
  multiplicador_escalamiento_supervisor: number
  tasa_impuesto_pct: number
  horas_laborales_mes: number
  resend_dashboard_url: string
  exclusiones_default_texto?: string | null
  consideraciones_default_texto?: string | null
  por_que_geeks_default_texto?: string | null
  requiere_documento_alcance?: boolean
  condiciones_comerciales_texto?: string | null
  dias_validez_cotizacion?: number
  dias_anticipacion_cumpleanos?: number
  metodo_asignacion_leads?: MetodoAsignacionLeads
  linkedin_cooldown_horas?: number
  linkedin_max_criterios_por_corrida?: number
  linkedin_max_perfiles_por_corrida?: number
  contrato_dias_aviso_renovacion?: number
}

export const METODOS_ASIGNACION_LEADS = ["round_robin", "geografia", "carga_trabajo"] as const

export type MetodoAsignacionLeads = (typeof METODOS_ASIGNACION_LEADS)[number]

export const METODO_ASIGNACION_LEADS_LABELS: Record<MetodoAsignacionLeads, string> = {
  round_robin: "Por turnos",
  geografia: "Por geografía",
  carga_trabajo: "Por carga de trabajo",
}

/** Parámetros generales editables desde Configuración → Parámetros generales. */
export type ParametrosGeneralesUpdate = Partial<
  Pick<
    ConfiguracionGeneral,
    | "dias_validez_cotizacion"
    | "condiciones_comerciales_texto"
    | "requiere_documento_alcance"
    | "exclusiones_default_texto"
    | "consideraciones_default_texto"
    | "por_que_geeks_default_texto"
    | "contrato_dias_aviso_renovacion"
    | "linkedin_cooldown_horas"
    | "linkedin_max_criterios_por_corrida"
    | "linkedin_max_perfiles_por_corrida"
    | "metodo_asignacion_leads"
    | "dias_anticipacion_cumpleanos"
  >
>
