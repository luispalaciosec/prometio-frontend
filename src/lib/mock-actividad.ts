/**
 * Mock de actividad. Mutaciones revalidan las 3 reglas contra el estado fusionado.
 * Ownership: responsable_id (vendedor solo lo suyo).
 */
import {
  assertIntegridadActividad,
  fusionarYValidar,
  normalizarFeedback,
} from "@/lib/actividad-validacion"
import { MOCK_ORGANIZACION_ID } from "@/lib/mock-config"
import { getOportunidad } from "@/lib/mock-oportunidad"
import { esSoloLoPropio } from "@/lib/pipeline-acceso"
import type { Actividad, TipoActividad } from "@/types/actividad"
import type { Perfil } from "@/types/perfil"

const STORAGE_KEY = "prometio-mock-actividad-v1"

type MockDb = {
  actividades: Actividad[]
}

function seed(): MockDb {
  return { actividades: [] }
}

function load(): MockDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw) as MockDb
    }
  } catch {
    /* seed */
  }
  const initial = seed()
  persist(initial)
  return initial
}

function persist(next: MockDb) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

let db = load()

function refresh() {
  db = load()
}

function assertOwnership(actividad: Actividad, perfil: Perfil) {
  if (esSoloLoPropio(perfil) && actividad.responsable_id !== perfil.id) {
    throw new Error("Esta actividad no te pertenece")
  }
}

export type ListActividadesQuery = {
  perfil: Perfil
  contacto_id?: string
  oportunidad_id?: string
  desde?: string
  hasta?: string
  responsable_id?: string
}

export async function listActividades(query: ListActividadesQuery): Promise<Actividad[]> {
  refresh()
  let responsableId = query.responsable_id
  if (esSoloLoPropio(query.perfil)) {
    if (responsableId != null && responsableId !== query.perfil.id) {
      throw new Error("Solo puedes consultar tu propia agenda")
    }
    responsableId = query.perfil.id
  }

  return db.actividades
    .filter((row) => {
      if (query.contacto_id != null && row.contacto_id !== query.contacto_id) {
        return false
      }
      if (query.oportunidad_id != null && row.oportunidad_id !== query.oportunidad_id) {
        return false
      }
      if (responsableId != null && row.responsable_id !== responsableId) {
        return false
      }
      if (query.desde != null && query.hasta != null) {
        const enRango = (iso: string | null) =>
          iso != null && iso >= query.desde! && iso <= query.hasta!
        if (!enRango(row.programada_para) && !enRango(row.reportada_en)) {
          return false
        }
      }
      return true
    })
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function getActividad(id: string, perfil: Perfil): Promise<Actividad> {
  refresh()
  const existing = db.actividades.find((row) => row.id === id)
  if (!existing) {
    throw new Error("actividad no encontrada")
  }
  assertOwnership(existing, perfil)
  return existing
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

export async function createActividad(input: CrearActividadInput): Promise<Actividad> {
  refresh()
  if (input.oportunidad_id) {
    await getOportunidad(input.oportunidad_id, input.perfil)
  }

  const feedback = normalizarFeedback(input.feedback) ?? null
  assertIntegridadActividad({
    contacto_id: input.contacto_id ?? null,
    oportunidad_id: input.oportunidad_id ?? null,
    programada_para: input.programada_para ?? null,
    reportada_en: input.reportada_en ?? null,
    feedback,
  })

  const created: Actividad = {
    id: crypto.randomUUID(),
    organizacion_id: MOCK_ORGANIZACION_ID,
    tipo: input.tipo,
    contacto_id: input.contacto_id ?? null,
    oportunidad_id: input.oportunidad_id ?? null,
    responsable_id: input.perfil.id,
    programada_para: input.programada_para ?? null,
    reportada_en: input.reportada_en ?? null,
    feedback,
    audio_url: null,
    google_calendar_event_id: null,
    google_meet_url: null,
    created_at: new Date().toISOString(),
  }
  db.actividades = [created, ...db.actividades]
  persist(db)
  return created
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

export async function updateActividad(input: ActualizarActividadInput): Promise<Actividad> {
  refresh()
  const existing = db.actividades.find((row) => row.id === input.id)
  if (!existing) {
    throw new Error("actividad no encontrada")
  }
  assertOwnership(existing, input.perfil)

  if (input.oportunidad_id) {
    await getOportunidad(input.oportunidad_id, input.perfil)
  }

  const changes: Parameters<typeof fusionarYValidar>[1] = {}
  if ("contacto_id" in input) {
    changes.contacto_id = input.contacto_id ?? null
  }
  if ("oportunidad_id" in input) {
    changes.oportunidad_id = input.oportunidad_id ?? null
  }
  if ("programada_para" in input) {
    changes.programada_para = input.programada_para ?? null
  }
  if ("reportada_en" in input) {
    changes.reportada_en = input.reportada_en ?? null
  }
  if ("feedback" in input) {
    changes.feedback = input.feedback
  }

  const merged = fusionarYValidar(
    {
      contacto_id: existing.contacto_id,
      oportunidad_id: existing.oportunidad_id,
      programada_para: existing.programada_para,
      reportada_en: existing.reportada_en,
      feedback: existing.feedback,
    },
    changes,
  )

  const next: Actividad = {
    ...existing,
    tipo: input.tipo ?? existing.tipo,
    contacto_id: merged.contacto_id,
    oportunidad_id: merged.oportunidad_id,
    programada_para: merged.programada_para,
    reportada_en: merged.reportada_en,
    feedback: merged.feedback,
  }
  db.actividades = db.actividades.map((row) => (row.id === existing.id ? next : row))
  persist(db)
  return next
}

export async function reportarActividad(input: {
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

export async function deleteActividad(input: { perfil: Perfil; id: string }): Promise<void> {
  refresh()
  const existing = db.actividades.find((row) => row.id === input.id)
  if (!existing) {
    throw new Error("actividad no encontrada")
  }
  assertOwnership(existing, input.perfil)
  db.actividades = db.actividades.filter((row) => row.id !== input.id)
  persist(db)
}
