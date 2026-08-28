/**
 * Fachada de la bienvenida. Apunta al backend real (GET /inicio).
 */
import { apiFetch } from "@/lib/api-client"
import type { Inicio } from "@/types/inicio"

export function getInicio(): Promise<Inicio> {
  return apiFetch("/inicio")
}
