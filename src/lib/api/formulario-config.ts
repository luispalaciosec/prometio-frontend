import { apiFetch } from "@/lib/api-client"
import type { FormularioMeta } from "@/types/formulario-meta"

export function getFormularioMeta(): Promise<FormularioMeta> {
  return apiFetch("/config/formulario-meta")
}
