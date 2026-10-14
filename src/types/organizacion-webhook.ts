export const EVENTO_WEBHOOK_FORMULARIO = "contacto.creado_formulario" as const

export type EventoWebhook = typeof EVENTO_WEBHOOK_FORMULARIO

export type OrganizacionWebhook = {
  id: string
  organizacion_id: string
  evento: EventoWebhook
  url: string
  activo: boolean
}

/**
 * Respuesta de crear (201) y de rotar el secreto: incluye `secreto` (64 hex) una sola vez. Los GET nunca lo devuelven.
 * El receptor verifica el HMAC-SHA256 del cuerpo con la cabecera `X-Prometio-Signature: sha256=<hex>`.
 */
export type OrganizacionWebhookCreateResponse = OrganizacionWebhook & {
  secreto?: string
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
