export type LinkedinCriterioBusqueda = {
  id: string
  texto: string
  activo: boolean
  categoria_servicio_id: string | null
  categoria_servicio_nombre: string | null
}

export type LinkedinCriterioCreate = {
  texto: string
  activo?: boolean
  categoria_servicio_id?: string | null
}

export type LinkedinCriterioPatch = {
  texto?: string
  activo?: boolean
  categoria_servicio_id?: string | null
}
