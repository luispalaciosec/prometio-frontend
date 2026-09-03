import type { Pilar } from "@/types/servicio"

export type FacturacionPorPilar = Record<Pilar | "sin_clasificar", number>

export type TvFinanciero = {
  cuenta_verificada: boolean
  facturado_mes_actual: number
  pendiente_por_facturar_aproximado: number
  cotizaciones_pendientes_aproximado: number
  facturacion_por_pilar: FacturacionPorPilar
}

export const PILAR_FINANCIERO_ORDEN: (Pilar | "sin_clasificar")[] = [
  "marca",
  "crecimiento",
  "transformacion",
  "transversal",
  "sin_clasificar",
]

export const PILAR_FINANCIERO_LABELS: Record<Pilar | "sin_clasificar", string> = {
  marca: "Marca",
  crecimiento: "Crecimiento",
  transformacion: "Transformación",
  transversal: "Transversal",
  sin_clasificar: "Sin clasificar",
}
