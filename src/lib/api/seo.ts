import { apiFetch } from "@/lib/api-client"
import type {
  SeoCoreWebVitals,
  SeoCrawl,
  SeoCrawlListItem,
  SeoTriggerBody,
} from "@/types/seo"

function triggerBody(url?: string): SeoTriggerBody {
  const trimmed = url?.trim()
  return { url: trimmed ? trimmed : null }
}

export function listSeoCrawls(): Promise<SeoCrawlListItem[]> {
  return apiFetch("/seo/crawls")
}

export function getSeoCrawl(id: string): Promise<SeoCrawl> {
  return apiFetch(`/seo/crawls/${id}`)
}

/** 202 Accepted: el crawl sigue en background. El resultado no viene en esta respuesta. */
export function iniciarSeoCrawl(url?: string): Promise<SeoCrawl> {
  return apiFetch("/seo/crawl", {
    method: "POST",
    body: JSON.stringify(triggerBody(url)),
  })
}

export function listSeoCoreWebVitals(): Promise<SeoCoreWebVitals[]> {
  return apiFetch("/seo/core-web-vitals")
}

/** Síncrono. 502 si falla PageSpeed. */
export function medirSeoCoreWebVitals(url?: string): Promise<SeoCoreWebVitals[]> {
  return apiFetch("/seo/core-web-vitals", {
    method: "POST",
    body: JSON.stringify(triggerBody(url)),
  })
}
