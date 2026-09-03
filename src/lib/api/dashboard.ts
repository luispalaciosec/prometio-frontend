/**
 * Fachada del dashboard. Apunta al backend real (GET /dashboard/kpis).
 */
import { apiFetch } from "@/lib/api-client"
import type { DashboardKPIs } from "@/types/dashboard"
import type { TvFinanciero } from "@/types/tv-financiero"

export function getDashboardKpis(query: { desde?: string; hasta?: string } = {}): Promise<DashboardKPIs> {
  const params = new URLSearchParams()
  if (query.desde && query.hasta) {
    params.set("desde", query.desde)
    params.set("hasta", query.hasta)
  }
  const qs = params.toString()
  return apiFetch(`/dashboard/kpis${qs ? `?${qs}` : ""}`)
}

export function getTvFinanciero(): Promise<TvFinanciero> {
  return apiFetch("/dashboard/tv-financiero")
}
