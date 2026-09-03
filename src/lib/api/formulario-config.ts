import { apiFetch } from "@/lib/api-client"
import type {
  FormularioCampo,
  FormularioCampoCreate,
  FormularioCampoUpdate,
} from "@/types/formulario-campo"
import type { FormularioMeta } from "@/types/formulario-meta"
import type {
  OrganizacionWebhook,
  OrganizacionWebhookCreate,
  OrganizacionWebhookUpdate,
} from "@/types/organizacion-webhook"

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

export function listOrganizacionWebhooks(): Promise<OrganizacionWebhook[]> {
  return apiFetch("/config/organizacion-webhooks")
}

export function createOrganizacionWebhook(
  body: OrganizacionWebhookCreate,
): Promise<OrganizacionWebhook> {
  return apiFetch("/config/organizacion-webhooks", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export function updateOrganizacionWebhook(
  id: string,
  body: OrganizacionWebhookUpdate,
): Promise<OrganizacionWebhook> {
  return apiFetch(`/config/organizacion-webhooks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export function deleteOrganizacionWebhook(id: string): Promise<void> {
  return apiFetch(`/config/organizacion-webhooks/${id}`, { method: "DELETE" })
}
