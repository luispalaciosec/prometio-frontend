import { apiFetch } from "@/lib/api-client"
import type {
  AdsTrackingEventosQuery,
  AdsTrackingEventosResponse,
  OrganizacionAdsConfig,
  OrganizacionAdsConfigCreate,
  OrganizacionAdsConfigUpdate,
  ProbarGa4Response,
  ProbarMetaResponse,
} from "@/types/ads-tracking"
import type {
  FormularioCampo,
  FormularioCampoCreate,
  FormularioCampoUpdate,
} from "@/types/formulario-campo"
import type { FormularioMeta } from "@/types/formulario-meta"
import type {
  OrganizacionWebhook,
  OrganizacionWebhookCreate,
  OrganizacionWebhookCreateResponse,
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
): Promise<OrganizacionWebhookCreateResponse> {
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

export function getAdsTrackingConfig(): Promise<OrganizacionAdsConfig> {
  return apiFetch("/config/ads-tracking")
}

export function createAdsTrackingConfig(
  body: OrganizacionAdsConfigCreate,
): Promise<OrganizacionAdsConfig> {
  return apiFetch("/config/ads-tracking", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export function updateAdsTrackingConfig(
  body: OrganizacionAdsConfigUpdate,
): Promise<OrganizacionAdsConfig> {
  return apiFetch("/config/ads-tracking", {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export function probarMetaCapi(): Promise<ProbarMetaResponse> {
  return apiFetch("/config/ads-tracking/meta/probar", { method: "POST" })
}

export function probarGa4Mp(): Promise<ProbarGa4Response> {
  return apiFetch("/config/ads-tracking/ga4/probar", { method: "POST" })
}

export const ADS_TRACKING_EVENTOS_PAGE_SIZE = 50

export function listAdsTrackingEventos(
  query: AdsTrackingEventosQuery = {},
): Promise<AdsTrackingEventosResponse> {
  const params = new URLSearchParams()
  if (query.plataforma) {
    params.set("plataforma", query.plataforma)
  }
  if (query.exito != null) {
    params.set("exito", String(query.exito))
  }
  if (query.limit != null) {
    params.set("limit", String(query.limit))
  }
  if (query.offset != null) {
    params.set("offset", String(query.offset))
  }
  const qs = params.toString()
  return apiFetch(`/config/ads-tracking/eventos${qs ? `?${qs}` : ""}`)
}
