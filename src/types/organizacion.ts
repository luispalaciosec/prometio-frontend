export type TipografiaFormulario = "sistema" | "inter" | "poppins" | "outfit" | "dm_sans"

export type TemaFormulario = "claro" | "oscuro"

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
  formulario_radio_bordes_px: number
  formulario_tipografia: TipografiaFormulario
  formulario_tema: TemaFormulario
  formulario_subtitulo: string | null
  formulario_ancho_max_rem: number
  formulario_titulo: string | null
  formulario_texto_boton: string
  formulario_texto_exito: string
  formulario_redirect_url: string | null
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
  formulario_radio_bordes_px?: number | null
  formulario_tipografia?: TipografiaFormulario | null
  formulario_tema?: TemaFormulario | null
  formulario_subtitulo?: string | null
  formulario_ancho_max_rem?: number | null
  formulario_titulo?: string | null
  formulario_texto_boton?: string | null
  formulario_texto_exito?: string | null
  formulario_redirect_url?: string | null
}
