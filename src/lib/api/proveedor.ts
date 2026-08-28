/**
 * Fachada de proveedores. Apunta al backend real (GET/POST/PATCH/DELETE /proveedores).
 */
import { apiFetch } from "@/lib/api-client"
import type { Proveedor, ProveedorWrite } from "@/types/proveedor"

export function listProveedores(): Promise<Proveedor[]> {
  return apiFetch("/proveedores")
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
