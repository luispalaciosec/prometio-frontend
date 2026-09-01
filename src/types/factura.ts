export type FacturaContifico = {
  numero: string
  fecha_emision: string
  cliente: string | null
  total: number
  anulado: boolean
  url_ride: string | null
  url_xml: string | null
}

export type FacturasResponse = {
  cuenta_verificada: boolean
  resultados: FacturaContifico[]
}
