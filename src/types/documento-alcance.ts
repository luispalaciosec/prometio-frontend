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
  docx_subido_url: string | null
  resumen_cambios: ResumenCambiosDocx | null
  auditoria_ia: AuditoriaIaGuardada | null
  auditoria_ia_en: string | null
  creado_por: string | null
  creado_por_nombre: string | null
  created_at: string
}

export type SeccionRegenerable =
  | "objetivo"
  | "alcance_funcional"
  | "alcance_tecnico_incluido"
  | "alcance_tecnico_no_incluido"
  | "metodologia"
  | "tiempos"
  | "modelo_inversion"
  | "supuestos"
  | "entregables"
  | "condiciones_pago_texto"
  | "exclusiones_texto"
  | "consideraciones_texto"
  | "por_que_geeks_texto"

export type CambioDocxResumen = {
  seccion: string
  tipo: string
  detalle: string
}

export type ResumenCambiosDocx = {
  resumen: string
  cambios: CambioDocxResumen[]
  secciones_no_encontradas?: string[]
  titulos_no_reconocidos?: string[]
  ia_disponible?: boolean
  archivo_original_guardado?: boolean
}

export type SeveridadAuditoria = "alta" | "media" | "baja"

export type AdvertenciaAuditoria = {
  severidad: SeveridadAuditoria
  seccion: string
  mensaje: string
  cita: string | null
  cita_verificada: boolean
}

export type AuditoriaIaResultado = {
  resumen: string
  advertencias: AdvertenciaAuditoria[]
  auditado_en: string
}

export type AuditoriaIaGuardada = AuditoriaIaResultado

export type RegenerarSeccionBody = {
  seccion: SeccionRegenerable
  instruccion?: string | null
}

export type RegenerarSeccionResponse = {
  seccion: SeccionRegenerable
  valor: unknown
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
