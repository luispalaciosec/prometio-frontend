export const ETAPAS_CICLO_VIDA = ["contacto", "lead", "cliente"] as const

export type EtapaCicloVida = (typeof ETAPAS_CICLO_VIDA)[number]

export const ETAPA_CICLO_LABELS: Record<EtapaCicloVida, string> = {
  contacto: "Contacto",
  lead: "Lead",
  cliente: "Cliente",
}

export type Contacto = {
  id: string
  organizacion_id: string
  nombre_completo: string
  email_trabajo: string | null
  telefono_movil: string | null
  empresa_id: string | null
  producto_interes: string | null
  ciudad: string | null
  provincia: string | null
  linkedin_url: string | null
  etapa_ciclo_vida: EtapaCicloVida
  elegible_marketing: boolean
  fuente: string | null
  fclid: string | null
  gclid: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  propiedades_custom: Record<string, unknown>
  activo: boolean
  created_at: string
}

export type ContactoCreate = {
  nombre_completo: string
  email_trabajo?: string | null
  telefono_movil?: string | null
  empresa_id?: string | null
  producto_interes?: string | null
  ciudad?: string | null
  provincia?: string | null
  linkedin_url?: string | null
  etapa_ciclo_vida?: EtapaCicloVida
  elegible_marketing?: boolean
  fuente?: string | null
}

export type ContactoUpdate = {
  nombre_completo?: string | null
  email_trabajo?: string | null
  telefono_movil?: string | null
  empresa_id?: string | null
  producto_interes?: string | null
  ciudad?: string | null
  provincia?: string | null
  linkedin_url?: string | null
  etapa_ciclo_vida?: EtapaCicloVida | null
  elegible_marketing?: boolean | null
}

export type ListContactosQuery = {
  q?: string
  etapa_ciclo_vida?: EtapaCicloVida
  empresa_id?: string
  incluir_inactivos?: boolean
}
