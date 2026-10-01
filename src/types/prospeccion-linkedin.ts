export const PROSPECCION_LINKEDIN_ESTADOS = [
  "nuevo",
  "revisado",
  "descartado",
  "convertido",
] as const

export type ProspeccionLinkedinEstado = (typeof PROSPECCION_LINKEDIN_ESTADOS)[number]

export const PROSPECCION_ESTADO_LABELS: Record<ProspeccionLinkedinEstado, string> = {
  nuevo: "Nuevo",
  revisado: "Revisado",
  descartado: "Descartado",
  convertido: "Convertido",
}

export type ProspeccionLinkedinLead = {
  id: string
  nombre: string
  headline: string | null
  ubicacion: string | null
  empresa_actual: string | null
  criterio_busqueda_texto: string | null
  post_texto: string | null
  post_fecha: string | null
  post_url: string | null
  linkedin_url: string | null
  estado: ProspeccionLinkedinEstado
}

export type ProspeccionLinkedinBuscarResultado = {
  leads_nuevos: number
  perfiles_revisados: number
  criterios_usados: number
  proximo_intento_en: string | null
}
