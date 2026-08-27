import { apiFetch } from "@/lib/api-client"
import type { EstadoBasecamp } from "@/types/basecamp"

export function getEstadoBasecamp(): Promise<EstadoBasecamp> {
  return apiFetch("/basecamp/estado")
}

export function conectarBasecamp(code: string, redirectUri: string): Promise<EstadoBasecamp> {
  return apiFetch("/basecamp/conectar", {
    method: "POST",
    body: JSON.stringify({ code, redirect_uri: redirectUri }),
  })
}

let intercambio: Promise<EstadoBasecamp> | null = null
let intercambioCode: string | null = null

/** Strict Mode remonta el callback: un solo POST por `code` (el code de Launchpad es de un uso). */
export function conectarBasecampUnaVez(code: string, redirectUri: string): Promise<EstadoBasecamp> {
  if (intercambio && intercambioCode === code) {
    return intercambio
  }
  intercambioCode = code
  intercambio = conectarBasecamp(code, redirectUri)
  return intercambio
}
