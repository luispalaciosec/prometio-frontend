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
  creado_por: string | null
  creado_por_nombre: string | null
  activo: boolean
  created_at: string | null
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
