export type FacturaOrdenPor = "fecha" | "valor" | "cliente"
export type FacturaOrdenDireccion = "asc" | "desc"

export type FacturaContifico = {
  numero: string
  fecha_emision: string
  cliente: string | null
  cliente_ruc: string | null
  resumen_productos: string | null
  /** Con IVA — no mostrar en UI. */
  total: number
  /** Antes de impuestos — monto visible y orden valor. */
  subtotal: number
  anulado: boolean
  url_ride: string | null
  url_xml: string | null
}

export type CategoriaFacturada = {
  categoria: string
  monto: number
  lineas: number
}

export type FacturasResumen = {
  cuenta_verificada: boolean
  desde: string
  hasta: string
  total_facturado: number
  facturacion_agencia: number
  facturacion_medios: number
  cantidad_facturas: number
  clientes_medios_configurados: number
  por_categoria: CategoriaFacturada[]
}

export type FacturasResponse = {
  cuenta_verificada: boolean
  total: number
  resultados: FacturaContifico[]
}

export type ListFacturasQuery = {
  meses?: number
  desde?: string
  hasta?: string
  cliente?: string
  orden_por?: FacturaOrdenPor
  orden_direccion?: FacturaOrdenDireccion
  limit?: number
  offset?: number
}
