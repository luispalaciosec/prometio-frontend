export type ModeloTarifa = "por_hora" | "por_sueldo" | "por_evento"

export const MODELO_TARIFA_LABELS: Record<ModeloTarifa, string> = {
  por_hora: "Por hora",
  por_sueldo: "Por sueldo",
  por_evento: "Por evento",
}

/** Label del input de cantidad en el wizard, según `tarifa_interna.modelo`. */
export const CANTIDAD_ESTIMACION_LABELS: Record<ModeloTarifa, string> = {
  por_hora: "Horas estimadas",
  por_sueldo: "% del mes",
  por_evento: "Veces",
}

export const MODELOS_TARIFA = ["por_hora", "por_sueldo", "por_evento"] as const

export const COSTO_TARIFA_CAMPO: Record<ModeloTarifa, "costo_hora" | "costo_mensual" | "costo_evento"> =
  {
    por_hora: "costo_hora",
    por_sueldo: "costo_mensual",
    por_evento: "costo_evento",
  }

export const COSTO_TARIFA_LABELS: Record<ModeloTarifa, string> = {
  por_hora: "Costo por hora",
  por_sueldo: "Costo mensual",
  por_evento: "Costo por evento",
}

export type TarifaInterna = {
  id: string
  organizacion_id: string
  nombre_rol: string
  modelo: ModeloTarifa
  costo_hora: number | null
  costo_mensual: number | null
  costo_evento: number | null
}
