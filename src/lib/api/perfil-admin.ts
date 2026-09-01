import { apiFetch } from "@/lib/api-client"
import type {
  InvitarPerfilInput,
  PerfilAdminUpdate,
  PerfilDetalle,
  PerfilListado,
} from "@/types/perfil"

export function listPerfilesAdmin(equipo?: string): Promise<PerfilListado[]> {
  const query = equipo ? `?equipo=${encodeURIComponent(equipo)}` : ""
  return apiFetch(`/perfiles${query}`)
}

export function getPerfilAdmin(id: string): Promise<PerfilDetalle> {
  return apiFetch(`/perfiles/${id}`)
}

export function invitarPerfil(body: InvitarPerfilInput): Promise<PerfilDetalle> {
  const payload = {
    email: body.email.trim(),
    nombre_completo: body.nombre_completo.trim(),
    equipo: body.equipo,
    rol_ventas: body.equipo === "ventas" ? body.rol_ventas ?? "vendedor" : null,
  }
  return apiFetch("/perfiles/invitar", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function updatePerfilAdmin(id: string, patch: PerfilAdminUpdate): Promise<PerfilDetalle> {
  return apiFetch(`/perfiles/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  })
}

export function desactivarPerfil(id: string): Promise<PerfilDetalle> {
  return apiFetch(`/perfiles/${id}/desactivar`, { method: "POST" })
}

export function reactivarPerfil(id: string): Promise<PerfilDetalle> {
  return apiFetch(`/perfiles/${id}/reactivar`, { method: "POST" })
}
