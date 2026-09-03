export const EVENTO_WEBHOOK_FORMULARIO = "contacto.creado_formulario" as const

export type EventoWebhook = typeof EVENTO_WEBHOOK_FORMULARIO

export type OrganizacionWebhook = {
  id: string
  organizacion_id: string
  evento: EventoWebhook
  url: string
  /** Presente en la API; mostrar solo una vez al crear. */
  secreto: string
  activo: boolean
}

export type OrganizacionWebhookCreate = {
  evento: EventoWebhook
  url: string
  activo?: boolean
}

export type OrganizacionWebhookUpdate = {
  url?: string
  activo?: boolean
}
