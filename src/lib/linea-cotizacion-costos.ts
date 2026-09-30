import type { LineaCotizacion, LineaCotizacionCosto } from "@/types/linea-cotizacion"

export function lineaConProveedor(linea: Pick<LineaCotizacion, "costo_proveedor">): boolean {
  return linea.costo_proveedor != null
}

export function lineaTieneDesgloseCostos(linea: Pick<LineaCotizacion, "costos">): boolean {
  return (linea.costos?.length ?? 0) >= 1
}

export function etiquetaCostoLinea(costo: LineaCotizacionCosto): string {
  if (costo.proveedor_nombre?.trim()) {
    return costo.proveedor_nombre.trim()
  }
  if (costo.descripcion?.trim()) {
    return costo.descripcion.trim()
  }
  return "Costo interno"
}

export function sumaCostosLinea(costos: LineaCotizacionCosto[] | undefined): number {
  return (costos ?? []).reduce((sum, row) => sum + row.monto, 0)
}
