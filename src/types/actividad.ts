export const TIPOS_ACTIVIDAD = [
  "llamada",
  "whatsapp",
  "visita",
  "videollamada",
  "email",
  "tarea_interna",
  "atender_lead",
] as const

export type TipoActividad = (typeof TIPOS_ACTIVIDAD)[number]

export const TIPO_ACTIVIDAD_LABELS: Record<TipoActividad, string> = {
  llamada: "Llamada",
  whatsapp: "WhatsApp",
  visita: "Visita",
  videollamada: "Videollamada",
  email: "Email",
  tarea_interna: "Tarea interna",
  atender_lead: "Atender lead",
}

/** `atender_lead` lo crea el sistema cuando entra un lead: no se ofrece al crear una actividad a mano. */
export const TIPOS_ACTIVIDAD_MANUALES = TIPOS_ACTIVIDAD.filter((tipo) => tipo !== "atender_lead")

export type Actividad = {
  id: string
  organizacion_id: string
  tipo: TipoActividad
  contacto_id: string | null
  oportunidad_id: string | null
  responsable_id: string
  programada_para: string | null
  reportada_en: string | null
  feedback: string | null
  audio_url: string | null
  google_calendar_event_id: string | null
  google_meet_url: string | null
  google_calendar_sync_error: string | null
  created_at: string
}
