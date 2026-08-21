import type { EstimacionHorasPorRol } from "@/types/servicio"
import type { TarifaInterna } from "@/types/tarifa-interna"

export function costoInterno(
  estimacion: EstimacionHorasPorRol | null | undefined,
  tarifas: TarifaInterna[],
): number {
  if (!estimacion) {
    return 0
  }
  return Object.entries(estimacion).reduce((sum, [id, horas]) => {
    const tarifa = tarifas.find((row) => row.id === id)
    return sum + (tarifa ? tarifa.costo_hora * horas : 0)
  }, 0)
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
  }).format(value)
}
