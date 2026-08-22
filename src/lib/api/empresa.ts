/**
 * Fachada de empresa. Apunta al backend real (GET/POST/PATCH /empresas).
 */
import { apiFetch } from "@/lib/api-client"
import type { Empresa, EmpresaCreate, EmpresaUpdate } from "@/types/empresa"

function vacio(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? ""
  return trimmed === "" ? null : trimmed
}

export function listEmpresas(): Promise<Empresa[]> {
  return apiFetch("/empresas")
}

export function getEmpresa(id: string): Promise<Empresa> {
  return apiFetch(`/empresas/${id}`)
}

export function createEmpresa(input: EmpresaCreate): Promise<Empresa> {
  return apiFetch("/empresas", {
    method: "POST",
    body: JSON.stringify({
      nombre: input.nombre.trim(),
      web: vacio(input.web),
      direccion: vacio(input.direccion),
      ruc: vacio(input.ruc),
    }),
  })
}

export function updateEmpresa(id: string, input: EmpresaUpdate): Promise<Empresa> {
  const body: EmpresaUpdate = {}
  if (input.nombre !== undefined) {
    const nombre = input.nombre.trim()
    if (nombre) {
      body.nombre = nombre
    }
  }
  if (input.web !== undefined) {
    body.web = vacio(input.web)
  }
  if (input.direccion !== undefined) {
    body.direccion = vacio(input.direccion)
  }
  if (input.ruc !== undefined) {
    body.ruc = vacio(input.ruc)
  }
  return apiFetch(`/empresas/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export function enriquecerEmpresa(id: string): Promise<Empresa> {
  return apiFetch(`/empresas/${id}/enriquecer`, { method: "POST" })
}
