export type PipelinePorEtapa = {
  etapa: string
  nombre: string
  orden: number
  cantidad: number
  valor_en_juego: number
}

export type ConversionResumen = {
  ganadas: number
  perdidas: number
  tasa_conversion_pct: number | null
}

export type CotizacionesPorEstado = {
  estado: string
  cantidad: number
}

export type ActividadPorVendedor = {
  responsable_id: string
  nombre_completo: string
  cantidad: number
}

export type CausaPerdidaResumen = {
  causa_perdida_id: string
  nombre: string
  cantidad: number
}

export type MetaVendedor = {
  perfil_id: string
  nombre_completo: string
  monto_meta: number
  valor_cerrado: number
  avance_pct: number
}

export type MetasComerciales = {
  periodo_tipo: string | null
  fecha_inicio: string | null
  fecha_fin: string | null
  meta_total: number | null
  valor_cerrado_total: number
  avance_total_pct: number | null
  por_vendedor: MetaVendedor[]
}

export type DashboardKPIs = {
  pipeline_por_etapa: PipelinePorEtapa[]
  valor_total_en_juego: number
  conversion: ConversionResumen
  cotizaciones_por_estado: CotizacionesPorEstado[]
  actividades_por_vendedor: ActividadPorVendedor[]
  causas_perdida: CausaPerdidaResumen[]
  metas: MetasComerciales
}
