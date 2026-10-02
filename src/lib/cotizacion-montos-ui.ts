import type { CotizacionConLineas } from "@/types/cotizacion"
import type { LineaCotizacionCalculada } from "@/types/linea-cotizacion"

/**
 * Subtotal extendido sin IVA para pantallas internas del constructor.
 * Siempre desde subtotal_con_comision — no usar total_linea_extendido ni
 * total_linea (incluyen impuesto).
 */
export function montoLineaCotizacionSinIva(linea: LineaCotizacionCalculada): number {
  return linea.subtotal_con_comision * linea.cantidad
}

/** Subtotal de cotización sin IVA (sidebar del constructor). */
export function subtotalCotizacionSinIva(cotizacion: CotizacionConLineas): number {
  if (cotizacion.lineas.length > 0) {
    return cotizacion.lineas.reduce((sum, linea) => sum + montoLineaCotizacionSinIva(linea), 0)
  }
  return cotizacion.subtotal_cotizacion ?? 0
}
