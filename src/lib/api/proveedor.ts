/**
 * Fachada de proveedores. Apunta al backend real (GET/POST/PATCH/DELETE /proveedores).
 */
import { apiFetch } from "@/lib/api-client"
import type { Proveedor, ProveedorWrite } from "@/types/proveedor"

export function listProveedores(query: { incluir_inactivos?: boolean } = {}): Promise<Proveedor[]> {
  const params = new URLSearchParams()
  if (query.incluir_inactivos) {
    params.set("incluir_inactivos", "true")
  }
  const qs = params.toString()
  return apiFetch(`/proveedores${qs ? `?${qs}` : ""}`)
}

export function createProveedor(input: ProveedorWrite): Promise<Proveedor> {
  return apiFetch("/proveedores", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateProveedor(id: string, input: ProveedorWrite): Promise<Proveedor> {
  return apiFetch(`/proveedores/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })
}

export function deleteProveedor(id: string): Promise<void> {
  return apiFetch(`/proveedores/${id}`, { method: "DELETE" })
}

export function desactivarProveedor(id: string): Promise<Proveedor> {
  return apiFetch(`/proveedores/${id}/desactivar`, { method: "POST" })
}

export function reactivarProveedor(id: string): Promise<Proveedor> {
  return apiFetch(`/proveedores/${id}/reactivar`, { method: "POST" })
}
