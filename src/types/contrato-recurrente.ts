import type { CotizacionEstado } from "@/types/cotizacion"

// Todos los montos de este módulo son subtotal, SIN IVA.

export const CONTRATO_VIGENCIAS = ["por_iniciar", "vigente", "por_renovar", "vencido"] as const

export type ContratoVigencia = (typeof CONTRATO_VIGENCIAS)[number]

export type ContratoLineaInput = {
  servicio_id: string | null
  /** Obligatoria si no hay servicio de catálogo. */
  categoria_servicio_id: string | null
  descripcion: string
  monto_mensual: number
}

export type ContratoLinea = ContratoLineaInput & { id: string }

export type ContratoRecurrente = {
  id: string
  organizacion_id: string
  empresa_id: string
  empresa_nombre: string | null
  contacto_id: string
  contacto_nombre: string | null
  oportunidad_id: string
  nombre: string
  /** `YYYY-MM-DD` */
  fecha_inicio: string
  /** `YYYY-MM-DD` */
  fecha_fin: string
  activo: boolean
  notas: string | null
  created_at: string
  lineas: ContratoLinea[]
  monto_mensual_total: number
  vigencia: ContratoVigencia
  /** Negativo si ya venció. */
  dias_para_vencer: number
}

export type ContratoPeriodo = {
  /** `YYYY-MM-01` */
  periodo: string
  cotizacion_id: string
  numero: string
  estado: CotizacionEstado
  subtotal: number
  numero_factura: string | null
}

export type ContratoRecurrenteDetalle = ContratoRecurrente & {
  periodos: ContratoPeriodo[]
}

export type ContratoRecurrenteCreate = {
  empresa_id: string
  contacto_id: string
  oportunidad_id?: string | null
  nombre: string
  fecha_inicio: string
  fecha_fin: string
  notas?: string | null
  lineas: ContratoLineaInput[]
}

export type ContratoRecurrenteUpdate = {
  nombre?: string
  contacto_id?: string
  fecha_inicio?: string
  fecha_fin?: string
  notas?: string | null
}

export type ListContratosQuery = {
  vigente?: boolean | null
  activo?: boolean
  empresa_id?: string
  q?: string
}

export type ContratoRenovacion = {
  contrato_id: string
  nombre: string
  empresa_nombre: string | null
  fecha_fin: string
  /** Negativo si ya venció y no se renovó. */
  dias_para_vencer: number
  monto_mensual_total: number
}

export type ProyeccionMes = {
  /** `YYYY-MM-01` */
  periodo: string
  piso_contratado: number
  /** Parte del piso con cotización en por_facturar. */
  por_facturar: number
  /** Parte del piso ya facturada. */
  facturado: number
  /** Fee que se cae el mes siguiente si no se renueva. */
  vence_en_el_mes: number
  /** Solo con incluir_contifico: todo lo facturado por la agencia ese mes. */
  facturado_agencia_contifico: number | null
}

export type ProyeccionQuery = {
  meses?: number
  meses_atras?: number
  incluir_contifico?: boolean
}

export type GenerarMesResultado = {
  periodo: string
  generadas: number
  ya_existian: number
  errores: { contrato_id: string; detalle: string }[]
}
