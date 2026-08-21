export type LineaCotizacion = {
  id: string
  cotizacion_id: string
  servicio_id: string
  proveedor_id: string | null
  costo_proveedor: number | null
  margen_pct: number | null
  comision_agencia_pct: number | null
  cantidad: number
  precio_base_cliente_aplicado: number | null
}

export type CalculoLinea = {
  precio_venta_base: number
  subtotal_con_comision: number
  total_linea: number
}

export type LineaCotizacionCalculada = LineaCotizacion &
  CalculoLinea & {
    total_linea_extendido: number
  }
