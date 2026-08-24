import { apiFetch } from "@/lib/api-client"
import type { CalendarioResponse } from "@/types/calendario"

export function getCalendario(query: { desde: string; hasta: string }): Promise<CalendarioResponse> {
  const params = new URLSearchParams({ desde: query.desde, hasta: query.hasta })
  return apiFetch(`/calendario?${params.toString()}`)
}
