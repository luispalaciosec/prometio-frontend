/**
 * Fachada del resumen CRM. Apunta al backend real (GET /resumen, GET /resumen/series).
 */
import { apiFetch } from "@/lib/api-client"
import type { Resumen, ResumenSeries } from "@/types/resumen"

export function getResumen(): Promise<Resumen> {
  return apiFetch("/resumen")
}

export function getResumenSeries(): Promise<ResumenSeries> {
  return apiFetch("/resumen/series")
}
