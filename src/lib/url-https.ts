/**
 * URL absoluta con esquema https y host. Se usa para destinos que salen de la app
 * (webhooks, redirección post-envío del formulario): http:// expone el payload o la
 * navegación en texto plano, y cualquier otro esquema (javascript:, data:, ftp:) se rechaza.
 */
export function esUrlHttps(value: string): boolean {
  try {
    const url = new URL(value.trim())
    return url.protocol === "https:" && url.hostname !== ""
  } catch {
    return false
  }
}

export const MENSAJE_URL_HTTPS = "La URL tiene que empezar con https:// (no se aceptan http:// ni otros esquemas)."
