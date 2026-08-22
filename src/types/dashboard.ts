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

export type DashboardKPIs = {
  pipeline_por_etapa: PipelinePorEtapa[]
  valor_total_en_juego: number
  conversion: ConversionResumen
  cotizaciones_por_estado: CotizacionesPorEstado[]
  actividades_por_vendedor: ActividadPorVendedor[]
  causas_perdida: CausaPerdidaResumen[]
}
