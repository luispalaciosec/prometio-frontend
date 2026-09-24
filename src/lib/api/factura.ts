import { apiFetch } from "@/lib/api-client"
import type { FacturasResumen, FacturasResponse, ListFacturasQuery } from "@/types/factura"

export const FACTURAS_PAGE_SIZE = 25

function isoDateLocal(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Misma lógica que GET /facturas cuando no hay desde/hasta explícitos. */
export function facturasPeriodoBounds(input: {
  meses?: number
  desde?: string
  hasta?: string
}): { desde: string; hasta: string } {
  if (input.desde && input.hasta) {
    return { desde: input.desde, hasta: input.hasta }
  }
  const meses = input.meses ?? 6
  const fechaFinal = new Date()
  const fechaInicial = new Date(fechaFinal)
  fechaInicial.setDate(fechaInicial.getDate() - meses * 30)
  return { desde: isoDateLocal(fechaInicial), hasta: isoDateLocal(fechaFinal) }
}

export function getFacturasResumen(bounds: { desde: string; hasta: string }): Promise<FacturasResumen> {
  const params = new URLSearchParams({ desde: bounds.desde, hasta: bounds.hasta })
  return apiFetch(`/facturas/resumen?${params.toString()}`)
}

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
