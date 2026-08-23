export const SEO_CRAWL_ESTADOS = ["corriendo", "completado", "fallido"] as const

export type SeoCrawlEstado = (typeof SEO_CRAWL_ESTADOS)[number]

export const SEO_FUENTES = ["campo", "laboratorio"] as const

export type SeoFuente = (typeof SEO_FUENTES)[number]

export const SEO_ESTRATEGIAS = ["mobile", "desktop"] as const

export type SeoEstrategia = (typeof SEO_ESTRATEGIAS)[number]

export type SeoCrawlResumen = {
  total_paginas: number
  con_error: number
  sin_title: number
  sin_meta_description: number
  sin_h1: number
  enlaces_rotos_confirmados: number
  enlaces_posiblemente_bloqueados: number
  enlaces_no_verificables: number
}

export type SeoPagina = {
  url: string
  status_code: number | null
  error?: string | null
  title?: string | null
  title_len?: number
  meta_description?: string | null
  meta_description_len?: number
  h1_count?: number
  h1_texto?: string | null
  canonical_url?: string | null
  robots_noindex?: boolean
  imagenes_sin_alt?: number
  enlaces_rotos?: string[]
  enlaces_posiblemente_bloqueados?: string[]
  enlaces_no_verificables?: string[]
}

export type SeoCrawlListItem = {
  id: string
  organizacion_id: string
  iniciado_por: string
  cuenta_contrato_id: string | null
  sitio_url: string
  estado: SeoCrawlEstado
  paginas_encontradas: number | null
  resumen: SeoCrawlResumen | null
  error: string | null
  created_at: string
  completado_en: string | null
}

export type SeoCrawl = SeoCrawlListItem & {
  paginas: SeoPagina[] | null
}

export type SeoCoreWebVitals = {
  id: string
  organizacion_id: string
  iniciado_por: string
  cuenta_contrato_id: string | null
  url: string
  estrategia: SeoEstrategia
  fuente: SeoFuente
  lcp_ms: number | null
  inp_ms: number | null
  cls: number | null
  created_at: string
}

export type SeoTriggerBody = {
  url?: string | null
}

export const SEO_CRAWL_ESTADO_LABELS: Record<SeoCrawlEstado, string> = {
  corriendo: "En curso",
  completado: "Completado",
  fallido: "Fallido",
}

export const SEO_FUENTE_LABELS: Record<SeoFuente, string> = {
  campo: "Campo",
  laboratorio: "Laboratorio",
}

export const SEO_ESTRATEGIA_LABELS: Record<SeoEstrategia, string> = {
  mobile: "Móvil",
  desktop: "Escritorio",
}
