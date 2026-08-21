import type { LineaCotizacionCalculada } from "./linea-cotizacion"

export const COTIZACION_ESTADOS = [
  "borrador",
  "preparacion",
  "enviada",
  "aprobada",
  "rechazada",
  "vencida",
] as const

export type CotizacionEstado = (typeof COTIZACION_ESTADOS)[number]

export type Cotizacion = {
  id: string
  numero: string
  oportunidad_id: string
  estado: CotizacionEstado
  requiere_aprobacion: boolean
  aprobado_por: string | null
  tasa_impuesto_pct_aplicada: number | null
  created_at: string
}

export type CotizacionConLineas = Cotizacion & {
  lineas: LineaCotizacionCalculada[]
  total_cotizacion: number
}
