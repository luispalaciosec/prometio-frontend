import { apiFetch } from "@/lib/api-client"
import type {
  FormularioCampo,
  FormularioCampoCreate,
  FormularioCampoUpdate,
} from "@/types/formulario-campo"
import type { FormularioMeta } from "@/types/formulario-meta"

export function getFormularioMeta(): Promise<FormularioMeta> {
  return apiFetch("/config/formulario-meta")
}

export function listFormularioCampos(): Promise<FormularioCampo[]> {
  return apiFetch("/config/formulario-campos")
}

export function createFormularioCampo(body: FormularioCampoCreate): Promise<FormularioCampo> {
  return apiFetch("/config/formulario-campos", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export function updateFormularioCampo(
  id: string,
  body: FormularioCampoUpdate,
): Promise<FormularioCampo> {
  return apiFetch(`/config/formulario-campos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export function deleteFormularioCampo(id: string): Promise<void> {
  return apiFetch(`/config/formulario-campos/${id}`, { method: "DELETE" })
}
