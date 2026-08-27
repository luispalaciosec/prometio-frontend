export type ModeloCobro = "por_hora" | "fee_fijo" | "fee_recurrente"

export const MODELO_COBRO_LABELS: Record<ModeloCobro, string> = {
  por_hora: "Por hora",
  fee_fijo: "Fee fijo",
  fee_recurrente: "Fee recurrente",
}

export type ServicioEstado = "borrador" | "activo" | "archivado"

export const SERVICIO_ESTADO_LABELS: Record<ServicioEstado, string> = {
  borrador: "Borrador",
  activo: "Activo",
  archivado: "Archivado",
}

export type ServicioFase = {
  nombre: string
  orden: number
  hito_pago: string
}

export type ServicioConfigFee = {
  monto: number
  duracion_minima: number
  ciclo_renovacion: string
}

/** JSONB `estimacion_horas_por_rol`: clave = tarifa_interna.id, valor = horas. */
export type EstimacionHorasPorRol = Record<string, number>

export type Servicio = {
  id: string
  organizacion_id: string
  nombre: string
  descripcion: string | null
  categoria: string | null
  modelo_cobro: ModeloCobro
  tiene_fases: boolean
  precio_base_cliente: number | null
  estimacion_horas_por_rol: EstimacionHorasPorRol | null
  fases: ServicioFase[] | null
  config_fee: ServicioConfigFee | null
  margen_default_pct: number | null
  comision_sugerida_min_pct: number | null
  comision_sugerida_max_pct: number | null
  tipos_documento_requeridos: string[] | null
  estado: ServicioEstado
  created_by: string
  created_at: string
  contifico_producto_id?: string | null
}
