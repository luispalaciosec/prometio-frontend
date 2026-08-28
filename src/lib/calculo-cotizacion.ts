import type { CalculoLinea } from "@/types/linea-cotizacion"

/** Espejo de prometio-backend/app/core/calculo.py */
export function calcularLineaConProveedor(
  costo_proveedor: number,
  margen_pct: number,
  comision_agencia_pct: number,
  tasa_impuesto_pct: number,
): CalculoLinea {
  const precio_venta_base = costo_proveedor * (1 + margen_pct / 100)
  const subtotal_con_comision = precio_venta_base * (1 + comision_agencia_pct / 100)
  const total_linea = subtotal_con_comision * (1 + tasa_impuesto_pct / 100)
  return { precio_venta_base, subtotal_con_comision, total_linea }
}

export function calcularLineaSinProveedor(
  precio_base_cliente: number,
  tasa_impuesto_pct: number,
): CalculoLinea {
  const precio_venta_base = precio_base_cliente
  const subtotal_con_comision = precio_venta_base
  const total_linea = subtotal_con_comision * (1 + tasa_impuesto_pct / 100)
  return { precio_venta_base, subtotal_con_comision, total_linea }
}

/** Espejo de `_resolver_precio_sin_proveedor` en prometio-backend/app/routers/cotizacion.py */
export function precioDirectoServicio(servicio: {
  precio_base_cliente: number | null
  modelo_cobro: string
  config_fee: { monto: number } | null
} | undefined): number | null {
  if (!servicio) {
    return null
  }
  if (servicio.precio_base_cliente != null) {
    return servicio.precio_base_cliente
  }
  if (servicio.modelo_cobro === "fee_fijo" || servicio.modelo_cobro === "fee_recurrente") {
    return servicio.config_fee?.monto ?? null
  }
  return null
}

/** Vacío → null (cambia de camino si es costo_proveedor). "0" → 0. */
export function parseOptionalNumber(raw: string): number | null | "invalid" {
  const trimmed = raw.trim()
  if (trimmed === "") {
    return null
  }
  const value = Number(trimmed)
  if (Number.isNaN(value)) {
    return "invalid"
  }
  return value
}
