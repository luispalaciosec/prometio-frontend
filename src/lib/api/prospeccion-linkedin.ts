import { apiFetch } from "@/lib/api-client"
import type {
  ListProspeccionLinkedinLeadsQuery,
  ProspeccionLinkedinBuscarResultado,
  ProspeccionLinkedinConvertirResultado,
  ProspeccionLinkedinCriterioResumen,
  ProspeccionLinkedinEstado,
  ProspeccionLinkedinLead,
} from "@/types/prospeccion-linkedin"
import { PROSPECCION_LINKEDIN_ESTADOS } from "@/types/prospeccion-linkedin"

export function buscarProspeccionLinkedin(): Promise<ProspeccionLinkedinBuscarResultado> {
  return apiFetch("/prospeccion-linkedin/buscar", { method: "POST" })
}

export function buscarProspeccionLinkedinEmpresa(
  empresa_nombre: string,
): Promise<ProspeccionLinkedinBuscarResultado> {
  return apiFetch("/prospeccion-linkedin/buscar-empresa", {
    method: "POST",
    body: JSON.stringify({ empresa_nombre }),
  })
}

export function listProspeccionLinkedinCriteriosResumen(): Promise<
  ProspeccionLinkedinCriterioResumen[]
> {
  return apiFetch("/prospeccion-linkedin/criterios/resumen")
}

/** Sin GET por id: busca en cada pestaña de estado (una sola vez al abrir deep link). */
export async function findProspeccionLinkedinLeadById(
  id: string,
): Promise<ProspeccionLinkedinLead | null> {
  const listas = await Promise.all(
    PROSPECCION_LINKEDIN_ESTADOS.map((estado) => listProspeccionLinkedinLeads({ estado })),
  )
  for (const lista of listas) {
    const found = lista.find((row) => row.id === id)
    if (found) {
      return found
    }
  }
  return null
}

export function listProspeccionLinkedinLeads(
  query: ListProspeccionLinkedinLeadsQuery = {},
): Promise<ProspeccionLinkedinLead[]> {
  const params = new URLSearchParams()
  params.set("estado", query.estado ?? "nuevo")
  const ciudad = query.ciudad?.trim()
  if (ciudad) {
    params.set("ciudad", ciudad)
  }
  if (query.categoria_servicio_id) {
    params.set("categoria_servicio_id", query.categoria_servicio_id)
  }
  if (query.meses_en_cargo_menor_a != null) {
    params.set("meses_en_cargo_menor_a", String(query.meses_en_cargo_menor_a))
  }
  return apiFetch(`/prospeccion-linkedin/leads?${params.toString()}`)
}

export function investigarProspeccionLinkedinLead(id: string): Promise<ProspeccionLinkedinLead> {
  return apiFetch(`/prospeccion-linkedin/leads/${id}/investigar`, { method: "POST" })
}

export function patchProspeccionLinkedinLead(
  id: string,
  body: { estado: ProspeccionLinkedinEstado },
): Promise<ProspeccionLinkedinLead> {
  return apiFetch(`/prospeccion-linkedin/leads/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export type ConvertirLeadLinkedinInput = {
  crear_empresa_desde_actual?: boolean
}

export function convertirProspeccionLinkedinLead(
  id: string,
  body: ConvertirLeadLinkedinInput = {},
): Promise<ProspeccionLinkedinConvertirResultado> {
  return apiFetch(`/prospeccion-linkedin/leads/${id}/convertir`, {
    method: "POST",
    body: JSON.stringify(body),
  })
}
