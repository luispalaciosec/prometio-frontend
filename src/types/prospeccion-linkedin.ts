import type { Contacto } from "@/types/contacto"

export const PROSPECCION_LINKEDIN_ESTADOS = [
  "nuevo",
  "revisado",
  "descartado",
  "convertido",
] as const

export type ProspeccionLinkedinEstado = (typeof PROSPECCION_LINKEDIN_ESTADOS)[number]

export const PROSPECCION_ESTADO_LABELS: Record<ProspeccionLinkedinEstado, string> = {
  nuevo: "Nuevos",
  revisado: "Revisados",
  descartado: "Descartados",
  convertido: "Convertidos",
}

export type ProspeccionLinkedinLead = {
  id: string
  nombre: string
  headline: string | null
  ubicacion: string | null
  empresa_actual: string | null
  criterio_busqueda_texto: string | null
  categoria_servicio_nombre: string | null
  prioridad?: number
  fecha_inicio_cargo: string | null
  post_texto: string | null
  post_fecha: string | null
  post_url: string | null
  linkedin_url: string | null
  estado: ProspeccionLinkedinEstado
  investigado_en: string | null
  empresa_industria: string | null
  empresa_tamano: string | null
  empresa_sitio_web: string | null
  resumen_ia: string | null
  mensaje_sugerido_ia: string | null
}

export type ProspeccionLinkedinMesesEnCargo = 3 | 6 | 12

export type ListProspeccionLinkedinLeadsQuery = {
  estado?: ProspeccionLinkedinEstado
  ciudad?: string
  categoria_servicio_id?: string
  meses_en_cargo_menor_a?: ProspeccionLinkedinMesesEnCargo
}

export const PROSPECCION_PRIORIDAD_ALTA_MIN = 40

export type ProspeccionLinkedinBuscarResultado = {
  leads_nuevos: number
  perfiles_revisados: number
  criterios_usados: number
  proximo_intento_en: string | null
}

export type ProspeccionLinkedinConvertirResultado = {
  contacto: Contacto
  advertencia_otro_contacto_en_empresa: string | null
}

export type ProspeccionLinkedinCriterioResumen = {
  criterio_busqueda_id: string
  criterio_busqueda_texto: string
  total_leads: number
  convertidos: number
  tasa_conversion_pct: number
}
