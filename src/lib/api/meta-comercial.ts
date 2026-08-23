import { apiFetch } from "@/lib/api-client"
import type { MetaComercial, MetaComercialCreate, PeriodoTipo } from "@/types/meta-comercial"

export function listMetasComerciales(query: {
  perfil_id?: string
  periodo_tipo?: PeriodoTipo
} = {}): Promise<MetaComercial[]> {
  const params = new URLSearchParams()
  if (query.perfil_id) {
    params.set("perfil_id", query.perfil_id)
  }
  if (query.periodo_tipo) {
    params.set("periodo_tipo", query.periodo_tipo)
  }
  const qs = params.toString()
  return apiFetch(`/metas-comerciales${qs ? `?${qs}` : ""}`)
}

export function createMetaComercial(input: MetaComercialCreate): Promise<MetaComercial> {
  return apiFetch("/metas-comerciales", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateMetaComercial(id: string, monto: number): Promise<MetaComercial> {
  return apiFetch(`/metas-comerciales/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ monto }),
  })
}

export function deleteMetaComercial(id: string): Promise<void> {
  return apiFetch(`/metas-comerciales/${id}`, { method: "DELETE" })
}
