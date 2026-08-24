export type ConfiguracionGeneral = {
  id: string
  organizacion_id: string
  margen_agencia_default_pct: number
  comision_agencia_default_min_pct: number
  comision_agencia_default_max_pct: number
  umbral_descuento_aprobacion_pct: number
  multiplicador_escalamiento_supervisor: number
  tasa_impuesto_pct: number
  resend_dashboard_url: string
}
