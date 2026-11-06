/** Datos para precargar el alta de una línea a partir de una sugerencia. */
export type LineaFormPrefillAlta = {
  sinCatalogo: boolean
  servicio_id: string | null
  descripcion: string
  cantidad: number
  caminoProveedor: boolean
  justificacion_precio: string
  motivo: string
  categoria_servicio_id: string | null
}

export function prefillDesdeSugerencia(row: {
  servicio_id: string | null
  servicio_nombre_sugerido: string
  cantidad: number
  descripcion: string
  requiere_proveedor: boolean
  motivo: string
  categoria_servicio_id?: string | null
}): LineaFormPrefillAlta {
  const sinCatalogo = row.servicio_id == null
  const descripcion =
    row.descripcion.trim() || row.servicio_nombre_sugerido.trim() || "Ítem a medida"
  return {
    sinCatalogo,
    servicio_id: row.servicio_id,
    descripcion,
    cantidad: row.cantidad,
    caminoProveedor: row.requiere_proveedor,
    justificacion_precio: sinCatalogo && !row.requiere_proveedor ? row.motivo : "",
    motivo: row.motivo,
    categoria_servicio_id: row.categoria_servicio_id ?? null,
  }
}
