export type ClienteMedios = {
  id: string
  organizacion_id: string
  ruc: string
  nombre: string
}

export type ClienteMediosCreate = {
  ruc: string
  nombre: string
}
