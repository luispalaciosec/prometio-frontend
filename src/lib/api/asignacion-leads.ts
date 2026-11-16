/**
 * Motor de asignación de leads (`/config/asignacion-leads`). La disponibilidad de cada persona se edita con
 * `PATCH /perfiles/{id}` (`updatePerfilAdmin`). Lectura: supervisor y admin; escritura y simulador: solo admin.
 */
import { apiFetch } from "@/lib/api-client"
import type {
  AsignacionLeads,
  MetodoBase,
  ReasignacionLead,
  ReglaAsignacion,
  ReglaAsignacionInput,
  SimulacionAsignacion,
  ValoresAsignacion,
} from "@/types/asignacion-leads"

const BASE = "/config/asignacion-leads"

export function getAsignacionLeads(): Promise<AsignacionLeads> {
  return apiFetch(BASE)
}

/** `respaldo_perfil_id: null` quita el respaldo; omitirlo lo deja igual. */
export function updateAsignacionLeads(patch: {
  metodo_base?: MetodoBase
  respaldo_perfil_id?: string | null
}): Promise<AsignacionLeads> {
  return apiFetch(BASE, { method: "PATCH", body: JSON.stringify(patch) })
}

export function createRegla(input: ReglaAsignacionInput): Promise<ReglaAsignacion> {
  return apiFetch(`${BASE}/reglas`, { method: "POST", body: JSON.stringify({ ...input, valor: input.valor.trim() }) })
}

export function updateRegla(id: string, patch: Partial<ReglaAsignacionInput>): Promise<ReglaAsignacion> {
  const body = patch.valor === undefined ? patch : { ...patch, valor: patch.valor.trim() }
  return apiFetch(`${BASE}/reglas/${id}`, { method: "PATCH", body: JSON.stringify(body) })
}

export function deleteRegla(id: string): Promise<void> {
  return apiFetch(`${BASE}/reglas/${id}`, { method: "DELETE" })
}

/** Cada regla exactamente una vez, en el orden nuevo. */
export function reordenarReglas(ids: string[]): Promise<ReglaAsignacion[]> {
  return apiFetch(`${BASE}/reglas/orden`, { method: "PUT", body: JSON.stringify(ids) })
}

export function getValoresAsignacion(): Promise<ValoresAsignacion> {
  return apiFetch(`${BASE}/valores`)
}

/** Sin efectos: no mueve los turnos ni crea nada. */
export function simularAsignacion(input: {
  producto?: string
  provincia?: string
  utm_source?: string
  utm_campaign?: string
}): Promise<SimulacionAsignacion> {
  const body = Object.fromEntries(Object.entries(input).filter(([, valor]) => valor && valor.trim() !== ""))
  return apiFetch(`${BASE}/simular`, { method: "POST", body: JSON.stringify(body) })
}

/** Supervisor o admin. No reinicia el reloj de respuesta. */
export function reasignarLead(actividadId: string, responsableId: string): Promise<ReasignacionLead> {
  return apiFetch(`/atencion-leads/${actividadId}/reasignar`, {
    method: "POST",
    body: JSON.stringify({ responsable_id: responsableId }),
  })
}
