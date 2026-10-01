import { apiFetch } from "@/lib/api-client"
import type { Contacto } from "@/types/contacto"
import type {
  ProspeccionLinkedinBuscarResultado,
  ProspeccionLinkedinEstado,
  ProspeccionLinkedinLead,
} from "@/types/prospeccion-linkedin"

export function buscarProspeccionLinkedin(): Promise<ProspeccionLinkedinBuscarResultado> {
  return apiFetch("/prospeccion-linkedin/buscar", { method: "POST" })
}

export function listProspeccionLinkedinLeads(
  estado: ProspeccionLinkedinEstado = "nuevo",
): Promise<ProspeccionLinkedinLead[]> {
  const params = new URLSearchParams({ estado })
  return apiFetch(`/prospeccion-linkedin/leads?${params.toString()}`)
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
): Promise<Contacto> {
  return apiFetch(`/prospeccion-linkedin/leads/${id}/convertir`, {
    method: "POST",
    body: JSON.stringify(body),
  })
}
