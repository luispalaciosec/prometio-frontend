export type Organizacion = {
  id: string
  nombre: string
  logo_url: string | null
  logo_url_oscuro: string | null
  color_primario: string | null
  color_secundario: string | null
  color_terciario: string | null
  color_cuaternario: string | null
  sitio_web_url: string | null
  email: string | null
  telefono: string | null
  created_at: string
}

export type OrganizacionUpdate = {
  sitio_web_url?: string | null
  color_primario?: string | null
  color_secundario?: string | null
  color_terciario?: string | null
  color_cuaternario?: string | null
  email?: string | null
  telefono?: string | null
}
