export type TipoCampoFormulario = "texto" | "email" | "telefono" | "select" | "textarea"

export type FormularioCampo = {
  id: string
  organizacion_id: string
  clave: string
  tipo: TipoCampoFormulario
  etiqueta: string
  placeholder: string | null
  requerido: boolean
  opciones: string[] | null
  orden: number
  activo: boolean
}

export type FormularioCampoCreate = {
  clave: string
  tipo: TipoCampoFormulario
  etiqueta: string
  placeholder?: string | null
  requerido?: boolean
  opciones?: string[] | null
  orden: number
  activo?: boolean
}

export type FormularioCampoUpdate = {
  tipo?: TipoCampoFormulario
  etiqueta?: string
  placeholder?: string | null
  requerido?: boolean
  opciones?: string[] | null
  orden?: number
  activo?: boolean
}
