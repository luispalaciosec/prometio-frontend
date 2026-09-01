import { apiFetch } from "@/lib/api-client"
import type { FacturasResponse } from "@/types/factura"

export function listFacturas(meses = 6): Promise<FacturasResponse> {
  return apiFetch(`/facturas?meses=${meses}`)
}
