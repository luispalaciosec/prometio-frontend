export type FacturaOrdenPor = "fecha" | "valor" | "cliente"
export type FacturaOrdenDireccion = "asc" | "desc"

export type FacturaContifico = {
  numero: string
  fecha_emision: string
  cliente: string | null
  resumen_productos: string | null
  total: number
  anulado: boolean
  url_ride: string | null
  url_xml: string | null
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
