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
}
