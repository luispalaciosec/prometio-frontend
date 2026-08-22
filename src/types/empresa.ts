export type GoogleResultado = {
  title?: string | null
  url?: string | null
  description?: string | null
}

export type DatosEnriquecidos = {
  google_resultados?: GoogleResultado[]
  linkedin?: Record<string, unknown>
  linkedin_sin_resultados?: boolean
  enriquecimiento_error?: string
}

export type Empresa = {
  id: string
  organizacion_id: string
  nombre: string
  web: string | null
  direccion: string | null
  ruc: string | null
  sector: string | null
  tamano_estimado: string | null
  linkedin_url: string | null
  logo_url: string | null
  datos_enriquecidos: DatosEnriquecidos
  propiedades_custom: Record<string, unknown>
  created_at: string
}

export type EmpresaCreate = {
  nombre: string
  web?: string | null
  direccion?: string | null
  ruc?: string | null
}

export type EmpresaUpdate = {
  nombre?: string | null
  web?: string | null
  direccion?: string | null
  ruc?: string | null
}

/** Vacío `{}` o solo el error de un intento fallido — el vendedor puede (re)intentar. */
export function puedeEnriquecer(empresa: Empresa): boolean {
  const datos = empresa.datos_enriquecidos ?? {}
  const keys = Object.keys(datos)
  return keys.length === 0 || (keys.length === 1 && keys[0] === "enriquecimiento_error")
}
