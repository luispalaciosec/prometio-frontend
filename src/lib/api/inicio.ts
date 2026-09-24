/**
 * Fachada de la bienvenida. Apunta al backend real (GET /inicio).
 */
import { apiFetch } from "@/lib/api-client"
import type { Inicio } from "@/types/inicio"
import type { SugerenciasInicioResponse } from "@/types/inicio-sugerencias"

export function getInicio(): Promise<Inicio> {
  return apiFetch("/inicio")
}

export function getSugerenciasInicio(refrescar = false): Promise<SugerenciasInicioResponse> {
  const qs = refrescar ? "?refrescar=true" : ""
  return apiFetch(`/inicio/sugerencias${qs}`)
}
