/**
 * Fachada de actividades. Apunta al backend real (GET/POST/PATCH /actividades).
 */
import { apiFetch } from "@/lib/api-client"
import type { Actividad, TipoActividad } from "@/types/actividad"
import type { Perfil } from "@/types/perfil"

export type ListActividadesQuery = {
  perfil: Perfil
  contacto_id?: string
  oportunidad_id?: string
  desde?: string
  hasta?: string
  responsable_id?: string
}

export type CrearActividadInput = {
  perfil: Perfil
  tipo: TipoActividad
  contacto_id?: string | null
  oportunidad_id?: string | null
  programada_para?: string | null
  reportada_en?: string | null
  feedback?: string | null
}

export type ActualizarActividadInput = {
  perfil: Perfil
  id: string
  tipo?: TipoActividad
  contacto_id?: string | null
  oportunidad_id?: string | null
  programada_para?: string | null
  reportada_en?: string | null
  feedback?: string | null
}

export function listActividades(query: ListActividadesQuery): Promise<Actividad[]> {
  const params = new URLSearchParams()
  if (query.contacto_id) {
    params.set("contacto_id", query.contacto_id)
  }
  if (query.oportunidad_id) {
    params.set("oportunidad_id", query.oportunidad_id)
  }
  if (query.desde && query.hasta) {
    params.set("desde", query.desde)
    params.set("hasta", query.hasta)
  }
  if (query.responsable_id) {
    params.set("responsable_id", query.responsable_id)
  }
  const qs = params.toString()
  return apiFetch(`/actividades${qs ? `?${qs}` : ""}`)
}

export function getActividad(id: string, _perfil: Perfil): Promise<Actividad> {
  return apiFetch(`/actividades/${id}`)
}

export function createActividad(input: CrearActividadInput): Promise<Actividad> {
  return apiFetch("/actividades", {
    method: "POST",
    body: JSON.stringify({
      tipo: input.tipo,
      contacto_id: input.contacto_id ?? null,
      oportunidad_id: input.oportunidad_id ?? null,
      programada_para: input.programada_para ?? null,
      reportada_en: input.reportada_en ?? null,
      feedback: input.feedback ?? null,
    }),
  })
}

export function updateActividad(input: ActualizarActividadInput): Promise<Actividad> {
  const body: Record<string, unknown> = {}
  if (input.tipo !== undefined) {
    body.tipo = input.tipo
  }
  if ("contacto_id" in input) {
    body.contacto_id = input.contacto_id ?? null
  }
  if ("oportunidad_id" in input) {
    body.oportunidad_id = input.oportunidad_id ?? null
  }
  if ("programada_para" in input) {
    body.programada_para = input.programada_para ?? null
  }
  if ("reportada_en" in input) {
    body.reportada_en = input.reportada_en ?? null
  }
  if ("feedback" in input) {
    body.feedback = input.feedback ?? null
  }
  return apiFetch(`/actividades/${input.id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export function reportarActividad(input: {
  perfil: Perfil
  id: string
  reportada_en: string
  feedback: string
}): Promise<Actividad> {
  return updateActividad({
    perfil: input.perfil,
    id: input.id,
    reportada_en: input.reportada_en,
    feedback: input.feedback,
  })
}

export function deleteActividad(input: { perfil: Perfil; id: string }): Promise<void> {
  return apiFetch(`/actividades/${input.id}`, { method: "DELETE" })
}

export function sincronizarCalendar(id: string): Promise<Actividad> {
  return apiFetch(`/actividades/${id}/sincronizar-calendar`, { method: "POST" })
}
