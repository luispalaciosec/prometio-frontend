/**
 * Fachada del resumen CRM. Apunta al backend real (GET /resumen).
 */
import { apiFetch } from "@/lib/api-client"
import type { Resumen } from "@/types/resumen"

export function getResumen(): Promise<Resumen> {
  return apiFetch("/resumen")
}
