export const CANALES_CONVERSACION = [
  "whatsapp",
  "instagram",
  "messenger",
  "chat_web",
] as const

export type CanalConversacion = (typeof CANALES_CONVERSACION)[number]

export const CANAL_LABELS: Record<CanalConversacion, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  messenger: "Messenger",
  chat_web: "Chat web",
}

export const ESTADOS_CONVERSACION = ["abierta", "cerrada"] as const
export type EstadoConversacion = (typeof ESTADOS_CONVERSACION)[number]

export type DireccionMensaje = "entrante" | "saliente"

export type Mensaje = {
  id: string
  conversacion_id: string
  direccion: DireccionMensaje | null
  contenido: string | null
  external_id: string | null
  created_at: string
}

export type Conversacion = {
  id: string
  organizacion_id: string
  canal: CanalConversacion | string
  contacto_id: string | null
  remitente_nombre: string | null
  remitente_identificador: string | null
  asignado_a: string | null
  sla_limite: string | null
  estado: EstadoConversacion | string
  created_at: string
  mensajes: Mensaje[]
}

export type ConvertirConversacionInput = {
  contacto_id?: string | null
  nombre_completo?: string | null
  telefono_movil?: string | null
  email_trabajo?: string | null
  empresa_id?: string | null
}

export type ContactoConvertido = {
  id: string
  nombre_completo: string
}

export type BandejaScope = "mias" | "equipo"
