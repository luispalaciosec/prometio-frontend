export type Resumen = {
  contactos: number
  empresas: number
  conversaciones: number
  mensajes: number
  mails: number | null
}

export type PuntoSerieDiaria = {
  fecha: string
  cantidad: number
}

export type ResumenSeries = {
  desde: string
  hasta: string
  contactos: PuntoSerieDiaria[]
  empresas: PuntoSerieDiaria[]
  conversaciones: PuntoSerieDiaria[]
}
