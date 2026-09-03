export type OrganizacionAdsConfig = {
  id: string
  organizacion_id: string
  meta_pixel_id: string | null
  meta_access_token_configurado: boolean
  meta_test_event_code: string | null
  ga4_measurement_id: string | null
  ga4_api_secret_configurado: boolean
}

export type OrganizacionAdsConfigCreate = {
  meta_pixel_id?: string | null
  meta_access_token?: string | null
  meta_test_event_code?: string | null
  ga4_measurement_id?: string | null
  ga4_api_secret?: string | null
}

export type OrganizacionAdsConfigUpdate = OrganizacionAdsConfigCreate

export type PlataformaAdsTracking = "meta" | "ga4"

export type AdsTrackingEvento = {
  id: string
  organizacion_id: string
  contacto_id: string
  contacto_nombre: string | null
  plataforma: PlataformaAdsTracking
  event_id: string
  exito: boolean
  mensaje_error: string | null
  created_at: string
}

export type AdsTrackingEventosQuery = {
  plataforma?: PlataformaAdsTracking
  exito?: boolean
  limit?: number
  offset?: number
}

export type AdsTrackingEventosResponse = {
  total: number
  resultados: AdsTrackingEvento[]
}

export type ProbarMetaResponse = {
  ok: boolean
  detalle: string
}

export type ProbarGa4Response = {
  ok: boolean
  detalle: string
  validation_messages: unknown[]
}
