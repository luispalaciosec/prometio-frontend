import { apiFetch } from "@/lib/api-client"
import type { Auditoria, ListAuditoriaQuery } from "@/types/auditoria"

export function listAuditoria(query: ListAuditoriaQuery = {}): Promise<Auditoria[]> {
  const params = new URLSearchParams()
  if (query.perfil_id) {
    params.set("perfil_id", query.perfil_id)
  }
  if (query.accion?.trim()) {
    params.set("accion", query.accion.trim())
  }
  if (query.entidad_tipo?.trim()) {
    params.set("entidad_tipo", query.entidad_tipo.trim())
  }
  if (query.desde) {
    params.set("desde", query.desde)
  }
  if (query.hasta) {
    params.set("hasta", query.hasta)
  }
  const qs = params.toString()
  return apiFetch(`/auditoria${qs ? `?${qs}` : ""}`)
}
