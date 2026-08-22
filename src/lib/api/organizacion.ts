import { apiFetch } from "@/lib/api-client"
import type { Organizacion, OrganizacionUpdate } from "@/types/organizacion"

export function getOrganizacion(): Promise<Organizacion> {
  return apiFetch("/organizacion")
}

export function updateOrganizacion(input: OrganizacionUpdate): Promise<Organizacion> {
  return apiFetch("/organizacion", {
    method: "PATCH",
    body: JSON.stringify(input),
  })
}

export function uploadLogoOrganizacion(file: File): Promise<Organizacion> {
  const body = new FormData()
  body.append("file", file)
  return apiFetch("/organizacion/logo", { method: "POST", body })
}
