export const DOCUMENTO_ALCANCE_ESTADOS = [
  "borrador",
  "pendiente_aprobacion",
  "aprobado",
  "rechazado",
] as const

export type DocumentoAlcanceEstado = (typeof DOCUMENTO_ALCANCE_ESTADOS)[number]

export const DOCUMENTO_ALCANCE_ESTADO_LABELS: Record<DocumentoAlcanceEstado, string> = {
  borrador: "Borrador",
  pendiente_aprobacion: "Pendiente de aprobación",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
}

export const GENERACION_IA_ESTADOS = ["pendiente", "generando", "completado", "fallido"] as const

export type GeneracionIaEstado = (typeof GENERACION_IA_ESTADOS)[number]

export type SeccionAlcanceFuncional = {
  seccion: string
  entregables: string[]
}

export type EntregableDocumento = {
  nombre: string
  descripcion: string
}

export type DocumentoAlcance = {
  id: string
  organizacion_id: string
  cotizacion_id: string
  version: number
  documento_raiz_id: string | null
  objetivo: string | null
  alcance_funcional: SeccionAlcanceFuncional[] | null
  alcance_tecnico_incluido: string | null
  alcance_tecnico_no_incluido: string | null
  metodologia: string | null
  tiempos: string | null
  modelo_inversion: string | null
  supuestos: string | null
  entregables: EntregableDocumento[] | null
  condiciones_pago_texto: string | null
  exclusiones_texto: string | null
  consideraciones_texto: string | null
  por_que_geeks_texto: string | null
  estado: DocumentoAlcanceEstado
  generacion_ia_estado: GeneracionIaEstado | null
  generacion_ia_error: string | null
  aprobado_por: string | null
  aprobado_en: string | null
  pdf_url: string | null
  creado_por: string | null
  creado_por_nombre: string | null
  created_at: string
}

export type DocumentoAlcanceUpdate = {
  objetivo?: string | null
  alcance_funcional?: SeccionAlcanceFuncional[] | null
  alcance_tecnico_incluido?: string | null
  alcance_tecnico_no_incluido?: string | null
  metodologia?: string | null
  tiempos?: string | null
  modelo_inversion?: string | null
  supuestos?: string | null
  entregables?: EntregableDocumento[] | null
  condiciones_pago_texto?: string | null
  exclusiones_texto?: string | null
  consideraciones_texto?: string | null
  por_que_geeks_texto?: string | null
}

export type DocumentoAlcanceVersionListItem = {
  id: string
  version: number
  estado: DocumentoAlcanceEstado
  created_at: string
}
