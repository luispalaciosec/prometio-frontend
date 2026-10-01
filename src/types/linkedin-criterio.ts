export type LinkedinCriterioBusqueda = {
  id: string
  texto: string
  activo: boolean
}

export type LinkedinCriterioCreate = {
  texto: string
  activo?: boolean
}

export type LinkedinCriterioPatch = {
  texto?: string
  activo?: boolean
}
