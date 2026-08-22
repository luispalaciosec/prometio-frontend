/**
 * Fachada de contacto. Apunta al backend real (GET/POST/PATCH /contactos).
 */
import { listEmpresas } from "@/lib/api/empresa"
import { apiFetch } from "@/lib/api-client"
import type { Contacto, ContactoCreate, ContactoUpdate, ListContactosQuery } from "@/types/contacto"

function vacio(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? ""
  return trimmed === "" ? null : trimmed
}

function serializarAlta(input: ContactoCreate): ContactoCreate {
  return {
    nombre_completo: input.nombre_completo.trim(),
    email_trabajo: vacio(input.email_trabajo),
    telefono_movil: vacio(input.telefono_movil),
    empresa_id: vacio(input.empresa_id),
    producto_interes: vacio(input.producto_interes),
    ciudad: vacio(input.ciudad),
    provincia: vacio(input.provincia),
    linkedin_url: vacio(input.linkedin_url),
    fecha_nacimiento: vacio(input.fecha_nacimiento),
    cargo: vacio(input.cargo),
    etapa_ciclo_vida: input.etapa_ciclo_vida ?? "contacto",
    elegible_marketing: input.elegible_marketing ?? true,
    fuente: input.fuente ?? "manual",
  }
}

export function listContactos(query: ListContactosQuery = {}): Promise<Contacto[]> {
  const params = new URLSearchParams()
  if (query.q?.trim()) {
    params.set("q", query.q.trim())
  }
  if (query.etapa_ciclo_vida) {
    params.set("etapa_ciclo_vida", query.etapa_ciclo_vida)
  }
  if (query.empresa_id) {
    params.set("empresa_id", query.empresa_id)
  }
  if (query.incluir_inactivos) {
    params.set("incluir_inactivos", "true")
  }
  const qs = params.toString()
  return apiFetch(`/contactos${qs ? `?${qs}` : ""}`)
}

export function getContacto(id: string): Promise<Contacto> {
  return apiFetch(`/contactos/${id}`)
}

export function createContacto(input: ContactoCreate): Promise<Contacto> {
  return apiFetch("/contactos", {
    method: "POST",
    body: JSON.stringify(serializarAlta(input)),
  })
}

export function updateContacto(id: string, input: ContactoUpdate): Promise<Contacto> {
  const body: ContactoUpdate = {}
  if (input.nombre_completo !== undefined) {
    const nombre = input.nombre_completo.trim()
    if (nombre) {
      body.nombre_completo = nombre
    }
  }
  if (input.email_trabajo !== undefined) {
    body.email_trabajo = vacio(input.email_trabajo)
  }
  if (input.telefono_movil !== undefined) {
    body.telefono_movil = vacio(input.telefono_movil)
  }
  if (input.empresa_id !== undefined) {
    body.empresa_id = vacio(input.empresa_id)
  }
  if (input.producto_interes !== undefined) {
    body.producto_interes = vacio(input.producto_interes)
  }
  if (input.ciudad !== undefined) {
    body.ciudad = vacio(input.ciudad)
  }
  if (input.provincia !== undefined) {
    body.provincia = vacio(input.provincia)
  }
  if (input.linkedin_url !== undefined) {
    body.linkedin_url = vacio(input.linkedin_url)
  }
  if (input.fecha_nacimiento !== undefined) {
    body.fecha_nacimiento = vacio(input.fecha_nacimiento)
  }
  if (input.cargo !== undefined) {
    body.cargo = vacio(input.cargo)
  }
  if (input.etapa_ciclo_vida !== undefined) {
    body.etapa_ciclo_vida = input.etapa_ciclo_vida
  }
  if (input.elegible_marketing !== undefined) {
    body.elegible_marketing = input.elegible_marketing
  }
  return apiFetch(`/contactos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export function desactivarContacto(id: string): Promise<Contacto> {
  return apiFetch(`/contactos/${id}/desactivar`, { method: "POST" })
}

export function reactivarContacto(id: string): Promise<Contacto> {
  return apiFetch(`/contactos/${id}/reactivar`, { method: "POST" })
}

export function enriquecerContacto(id: string): Promise<Contacto> {
  return apiFetch(`/contactos/${id}/enriquecer`, { method: "POST" })
}

/** Empresas reales para el selector de Contactos. */
export async function listEmpresasParaContacto(): Promise<{ id: string; nombre: string }[]> {
  const rows = await listEmpresas()
  return [...rows].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")).map((row) => ({
    id: row.id,
    nombre: row.nombre,
  }))
}
