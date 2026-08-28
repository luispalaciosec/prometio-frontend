import type { EstimacionInternaPorRol } from "@/types/servicio"
import type { ModeloTarifa, TarifaInterna } from "@/types/tarifa-interna"

export const HORAS_LABORALES_MES_DEFAULT = 240

export function modeloTarifa(tarifa: TarifaInterna): ModeloTarifa {
  return tarifa.modelo
}

export function costoInterno(
  estimacion: EstimacionInternaPorRol | null | undefined,
  tarifas: TarifaInterna[],
  horasLaboralesMes: number = HORAS_LABORALES_MES_DEFAULT,
): number {
  if (!estimacion) {
    return 0
  }
  const horasMes = horasLaboralesMes > 0 ? horasLaboralesMes : HORAS_LABORALES_MES_DEFAULT
  return Object.entries(estimacion).reduce((sum, [id, item]) => {
    const tarifa = tarifas.find((row) => row.id === id)
    if (!tarifa) {
      return sum
    }
    const cantidad = item.cantidad
    if (!Number.isFinite(cantidad)) {
      return sum
    }
    const modelo = modeloTarifa(tarifa)
    if (modelo === "por_hora") {
      return sum + cantidad * (tarifa.costo_hora ?? 0)
    }
    if (modelo === "por_sueldo") {
      const horasEquivalentes = (cantidad / 100) * horasMes
      const costoPorHora = (tarifa.costo_mensual ?? 0) / horasMes
      return sum + horasEquivalentes * costoPorHora
    }
    return sum + cantidad * (tarifa.costo_evento ?? 0)
  }, 0)
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
  }).format(value)
}

export function etiquetaCostoTarifa(tarifa: TarifaInterna): string {
  const modelo = modeloTarifa(tarifa)
  if (modelo === "por_sueldo") {
    return tarifa.costo_mensual == null ? "—" : `${formatMoney(tarifa.costo_mensual)} / mes`
  }
  if (modelo === "por_evento") {
    return tarifa.costo_evento == null ? "—" : `${formatMoney(tarifa.costo_evento)} / evento`
  }
  return tarifa.costo_hora == null ? "—" : `${formatMoney(tarifa.costo_hora)} / h`
}
