import { apiFetch } from "@/lib/api-client"
import type {
  LinkedinCriterioBusqueda,
  LinkedinCriterioCreate,
  LinkedinCriterioPatch,
} from "@/types/linkedin-criterio"

export function listLinkedinCriteriosBusqueda(): Promise<LinkedinCriterioBusqueda[]> {
  return apiFetch("/config/linkedin-criterios-busqueda")
}

export function createLinkedinCriterioBusqueda(
  body: LinkedinCriterioCreate,
): Promise<LinkedinCriterioBusqueda> {
  return apiFetch("/config/linkedin-criterios-busqueda", {
    method: "POST",
    body: JSON.stringify({
      texto: body.texto.trim(),
      activo: body.activo ?? true,
    }),
  })
}

export function updateLinkedinCriterioBusqueda(
  id: string,
  body: LinkedinCriterioPatch,
): Promise<LinkedinCriterioBusqueda> {
  return apiFetch(`/config/linkedin-criterios-busqueda/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export function deleteLinkedinCriterioBusqueda(id: string): Promise<void> {
  return apiFetch(`/config/linkedin-criterios-busqueda/${id}`, { method: "DELETE" })
}
