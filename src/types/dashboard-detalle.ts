export type DashboardTarjeta =
  | "valor_en_juego"
  | "pipeline_abierto"
  | "conversion"
  | "meta"
  | "pipeline_etapa"

export type DashboardDetalleResultado = "abierta" | "ganada" | "perdida"

export type DashboardDetalleFila = {
  oportunidad_id: string
  /** Nombre libre de la oportunidad; si viene, va como título principal en la fila. */
  nombre: string | null
  empresa: string | null
  contacto: string | null
  ejecutivo: string | null
  etapa: string
  etapa_nombre: string
  valor: number
  probabilidad_cierre: number | null
  dias_sin_actividad: number | null
  fecha_cierre: string | null
  causa_perdida: string | null
  resultado: DashboardDetalleResultado
}

export type DashboardDetalleGrupo = {
  nombre: string
  cantidad: number
  valor: number
}

export type DashboardDetalleMeta = {
  periodo_tipo: string
  fecha_inicio: string
  fecha_fin: string
  meta_total: number
  /** Agencia: facturado en Contífico (sin medios). Vendedor: cierres del CRM. null si Contífico no respondió. */
  valor_cerrado: number | null
  faltante: number | null
  avance_pct: number | null
  /** De dónde sale `valor_cerrado`. */
  fuente_cerrado?: "contifico" | "crm"
  /** Suma de los cierres del CRM (lo que listan las filas). */
  cerrado_crm?: number
  cerrado_no_disponible?: boolean
  cerrado_truncado?: boolean
}

export type DashboardDetalle = {
  tarjeta: DashboardTarjeta
  titulo: string
  cantidad: number
  valor_total: number
  filas: DashboardDetalleFila[]
  por_vendedor: DashboardDetalleGrupo[]
  por_etapa: DashboardDetalleGrupo[]
  ganadas: number | null
  perdidas: number | null
  tasa_conversion_pct: number | null
  meta: DashboardDetalleMeta | null
}

export type DashboardDetalleRequest = {
  tarjeta: DashboardTarjeta
  etapa?: string
  /** Valor mostrado en la tarjeta (para el encabezado mientras carga). */
  previewValor: string
  previewTitulo?: string
}
