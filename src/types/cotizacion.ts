import type { LineaCotizacionCalculada } from "./linea-cotizacion"

export const COTIZACION_ESTADOS = [
  "borrador",
  "preparacion",
  "enviada",
  "aprobada",
  "por_facturar",
  "facturado",
  "rechazada",
  "vencida",
] as const

export type CotizacionEstado = (typeof COTIZACION_ESTADOS)[number]

export const COTIZACION_ESTADO_LABELS: Record<CotizacionEstado, string> = {
  borrador: "Borrador",
  preparacion: "En preparación",
  enviada: "Enviada",
  aprobada: "Aprobada",
  por_facturar: "Por facturar",
  facturado: "Facturada",
  rechazada: "Rechazada",
  vencida: "Vencida",
}

/** Ganada = el cliente ya aceptó, esté donde esté la facturación (espejo de ESTADOS_GANADA). */
export const COTIZACION_ESTADOS_GANADA: readonly CotizacionEstado[] = [
  "aprobada",
  "por_facturar",
  "facturado",
]

export type Cotizacion = {
  id: string
  numero: string
  oportunidad_id: string
  estado: CotizacionEstado
  requiere_aprobacion: boolean
  aprobado_por: string | null
  tasa_impuesto_pct_aplicada: number | null
  requiere_documento_alcance?: boolean
  /** Solo con estado `facturado`. */
  numero_factura?: string | null
  /** Solo si la generó un contrato de fee recurrente. */
  contrato_recurrente_id?: string | null
  /** `YYYY-MM-DD`, primer día del mes que cubre. */
  periodo_contrato?: string | null
  created_at: string
}

export type CotizacionConLineas = Cotizacion & {
  lineas: LineaCotizacionCalculada[]
  /** Suma de subtotales de línea, sin IVA — uso en pantallas internas. */
  subtotal_cotizacion: number
  /** Total a cobrar al cliente (con IVA). No usar en listados ni sidebar del constructor. */
  total_cotizacion: number
}

export type SugerenciaLineaAsistente = {
  servicio_id: string | null
  servicio_nombre_sugerido: string
  cantidad: number
  descripcion: string
  requiere_proveedor: boolean
  motivo: string
  categoria_servicio_id?: string | null
}

export type SugerirLineasResponse = {
  sugerencias: SugerenciaLineaAsistente[]
}

export type PreviewAprobacion = {
  requiere_aprobacion: boolean
}
