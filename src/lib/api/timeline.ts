import { apiFetch } from "@/lib/api-client"
import type { TimelineEvento, TipoTimeline } from "@/types/timeline"

export function listTimeline(query: {
  perfil_id?: string
  entidad_id?: string
  tipo_evento?: TipoTimeline
  limit?: number
} = {}): Promise<TimelineEvento[]> {
  const params = new URLSearchParams()
  if (query.perfil_id) {
    params.set("perfil_id", query.perfil_id)
  }
  if (query.entidad_id) {
    params.set("entidad_id", query.entidad_id)
  }
  if (query.tipo_evento) {
    params.set("tipo_evento", query.tipo_evento)
  }
  params.set("limit", String(query.limit ?? 100))
  return apiFetch(`/timeline?${params.toString()}`)
}
