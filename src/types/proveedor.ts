export type Proveedor = {
  id: string
  organizacion_id: string
  nombre: string
  contacto_nombre: string | null
  ruc: string | null
  telefono: string | null
  email: string | null
  calificacion: number | null
  servicios: string[] | null
  activo: boolean
}

export type ProveedorWrite = {
  nombre: string
  contacto_nombre?: string | null
  ruc?: string | null
  telefono?: string | null
  email?: string | null
  calificacion?: number | null
  servicios?: string[] | null
}
