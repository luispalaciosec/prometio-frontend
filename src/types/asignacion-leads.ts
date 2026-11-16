export const TIPOS_REGLA = ["producto", "provincia", "campana", "origen"] as const
export type TipoRegla = (typeof TIPOS_REGLA)[number]

export const TIPO_REGLA_LABELS: Record<TipoRegla, string> = {
  producto: "Producto de interés",
  provincia: "Provincia",
  campana: "Campaña (utm_campaign)",
  origen: "Origen (utm_source)",
}

export const METODOS_BASE = ["round_robin", "carga_trabajo"] as const
export type MetodoBase = (typeof METODOS_BASE)[number]

export const METODO_BASE_LABELS: Record<MetodoBase, string> = {
  round_robin: "Por turnos",
  carga_trabajo: "Por carga de trabajo",
}

export type ViaAsignacion = "regla" | "metodo_base" | "respaldo" | "sin_asignar"

export type ReglaAsignacion = {
  id: string
  organizacion_id: string
  orden: number
  tipo: TipoRegla
  valor: string
  activa: boolean
  destinos: string[]
}

export type ReglaAsignacionInput = {
  tipo: TipoRegla
  valor: string
  destinos: string[]
  activa: boolean
}

export type PersonaAsignacion = {
  perfil_id: string
  nombre: string
  equipo: string
  rol_ventas: string | null
  activo: boolean
  recibe_leads: boolean
  /** AAAA-MM-DD, inclusive, hora de Ecuador. */
  leads_pausado_hasta: string | null
  peso_reparto: number
  tope_pendientes: number | null
  pendientes_actuales: number
  disponible: boolean
}

export type AsignacionLeads = {
  metodo_base: MetodoBase
  respaldo_perfil_id: string | null
  reglas: ReglaAsignacion[]
  personas: PersonaAsignacion[]
}

export type ValoresAsignacion = {
  productos: string[]
  provincias: string[]
  campanas: string[]
  origenes: string[]
}

export type SimulacionAsignacion = {
  perfil_id: string | null
  nombre: string | null
  via: ViaAsignacion
  regla_id: string | null
  explicacion: string
}

export type ReasignacionLead = {
  actividad_id: string
  responsable_anterior_id: string
  responsable_id: string
  responsable_nombre: string | null
  reportada_en: string | null
}
