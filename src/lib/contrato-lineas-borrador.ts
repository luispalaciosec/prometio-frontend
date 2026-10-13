import type { ContratoLineaInput } from "@/types/contrato-recurrente"

/** Fila en edición: el monto queda como texto hasta enviar. */
export type ContratoLineaBorrador = {
  key: string
  servicio_id: string | null
  categoria_servicio_id: string | null
  descripcion: string
  monto: string
}

let siguienteKey = 0

export function lineaBorradorVacia(): ContratoLineaBorrador {
  siguienteKey += 1
  return {
    key: `linea-${siguienteKey}`,
    servicio_id: null,
    categoria_servicio_id: null,
    descripcion: "",
    monto: "",
  }
}

export function lineasBorradorDesde(lineas: ContratoLineaInput[]): ContratoLineaBorrador[] {
  return lineas.map((linea) => ({
    ...lineaBorradorVacia(),
    servicio_id: linea.servicio_id,
    categoria_servicio_id: linea.categoria_servicio_id,
    descripcion: linea.descripcion,
    monto: String(linea.monto_mensual),
  }))
}

/** Valida como el backend. Devuelve el primer error o las líneas listas para enviar. */
export function validarLineasBorrador(
  lineas: ContratoLineaBorrador[],
): { error: string } | { lineas: ContratoLineaInput[] } {
  if (lineas.length === 0) {
    return { error: "Agregá al menos una línea." }
  }
  const salida: ContratoLineaInput[] = []
  for (const [index, linea] of lineas.entries()) {
    const n = index + 1
    if (!linea.servicio_id && !linea.categoria_servicio_id) {
      return { error: `Línea ${n}: elegí un servicio o, si es a medida, una categoría.` }
    }
    if (!linea.descripcion.trim()) {
      return { error: `Línea ${n}: falta la descripción.` }
    }
    const monto = Number(linea.monto.replace(",", "."))
    if (!Number.isFinite(monto) || monto <= 0) {
      return { error: `Línea ${n}: el monto mensual tiene que ser mayor a 0.` }
    }
    salida.push({
      servicio_id: linea.servicio_id,
      categoria_servicio_id: linea.servicio_id ? null : linea.categoria_servicio_id,
      descripcion: linea.descripcion.trim(),
      monto_mensual: monto,
    })
  }
  return { lineas: salida }
}
