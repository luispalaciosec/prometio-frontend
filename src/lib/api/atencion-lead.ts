/**
 * Reloj de respuesta a leads. `POST /atencion-leads/procesar` es del cron del backend: la UI no lo llama.
 */
import { apiFetch } from "@/lib/api-client"
import type { LeadPendiente, ResumenSla } from "@/types/atencion-lead"

export function listLeadsPendientes(): Promise<LeadPendiente[]> {
  return apiFetch("/atencion-leads/pendientes")
}

/** Sin rango, el backend usa los últimos 30 días. */
export function getResumenSla(rango?: { desde: string; hasta: string }): Promise<ResumenSla> {
  const qs = rango ? `?${new URLSearchParams(rango).toString()}` : ""
  return apiFetch(`/atencion-leads/resumen${qs}`)
}
