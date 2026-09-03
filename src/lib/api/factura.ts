import { apiFetch } from "@/lib/api-client"
import type { FacturasResponse, ListFacturasQuery } from "@/types/factura"

export const FACTURAS_PAGE_SIZE = 25

export function listFacturas(query: ListFacturasQuery = {}): Promise<FacturasResponse> {
  const params = new URLSearchParams()

  if (query.desde && query.hasta) {
    params.set("desde", query.desde)
    params.set("hasta", query.hasta)
  } else if (query.meses != null) {
    params.set("meses", String(query.meses))
  }

  const cliente = query.cliente?.trim()
  if (cliente) {
    params.set("cliente", cliente)
  }
  if (query.orden_por) {
    params.set("orden_por", query.orden_por)
  }
  if (query.orden_direccion) {
    params.set("orden_direccion", query.orden_direccion)
  }
  if (query.limit != null) {
    params.set("limit", String(query.limit))
  }
  if (query.offset != null) {
    params.set("offset", String(query.offset))
  }

  return apiFetch(`/facturas?${params.toString()}`)
}
