export type Organizacion = {
  id: string
  nombre: string
  logo_url: string | null
  color_primario: string | null
  color_secundario: string | null
  sitio_web_url: string | null
  created_at: string
}

export type OrganizacionUpdate = {
  sitio_web_url?: string | null
  color_primario?: string | null
  color_secundario?: string | null
}
