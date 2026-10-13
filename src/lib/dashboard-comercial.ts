/**
 * Cálculos del dashboard comercial sobre las oportunidades que el usuario ya puede ver.
 * Montos sin IVA. Valor efectivo = cotizado en firme o, si no hay, el referencial
 * (mismo criterio que GET /dashboard/kpis).
 */
import type { EtapaPipeline } from "@/types/etapa-pipeline"
import type { Oportunidad } from "@/types/oportunidad"
import type { ProyeccionMes } from "@/types/contrato-recurrente"

const DIA_MS = 86_400_000

export function valorEfectivo(oportunidad: Oportunidad): number {
  return oportunidad.valor_cotizado ?? oportunidad.valor_referencial ?? 0
}

function esAbierta(oportunidad: Oportunidad): boolean {
  return (
    oportunidad.activo &&
    oportunidad.etapa !== "cierre_ganado" &&
    oportunidad.etapa !== "cierre_perdido"
  )
}

/** Probabilidad 0–1: la de la oportunidad o, si no tiene, la default de su etapa. */
function probabilidad(oportunidad: Oportunidad, etapas: EtapaPipeline[]): number {
  const pct =
    oportunidad.probabilidad_cierre ??
    etapas.find((etapa) => etapa.codigo === oportunidad.etapa)?.probabilidad_cierre_default_pct ??
    0
  return pct > 1 ? pct / 100 : pct
}

export type FilaPipelinePonderado = {
  oportunidad: Oportunidad
  valor: number
  /** 0–1 */
  probabilidad: number
  ponderado: number
}

/** Oportunidades abiertas con su aporte al pipeline ponderado, de mayor a menor. */
export function detallePipelinePonderado(
  oportunidades: Oportunidad[],
  etapas: EtapaPipeline[],
): FilaPipelinePonderado[] {
  return oportunidades
    .filter(esAbierta)
    .map((oportunidad) => {
      const valor = valorEfectivo(oportunidad)
      const prob = probabilidad(oportunidad, etapas)
      return { oportunidad, valor, probabilidad: prob, ponderado: valor * prob }
    })
    .sort((a, b) => b.ponderado - a.ponderado)
}

export function pipelinePonderado(oportunidades: Oportunidad[], etapas: EtapaPipeline[]): number {
  return detallePipelinePonderado(oportunidades, etapas).reduce((sum, row) => sum + row.ponderado, 0)
}

/** Meses con fees sin cotización todavía, de `desdeMes` a `hastaMes` (`YYYY-MM`). */
export function detalleFeesPorGenerar(
  proyeccion: ProyeccionMes[],
  desdeMes: string,
  hastaMes: string,
): { periodo: string; monto: number }[] {
  return proyeccion
    .filter((row) => {
      const mes = row.periodo.slice(0, 7)
      return mes >= desdeMes && mes <= hastaMes
    })
    .map((row) => ({
      periodo: row.periodo,
      monto: Math.max(0, row.piso_contratado - row.facturado - row.por_facturar),
    }))
    .filter((row) => row.monto > 0)
}

/** Fees de contratos que todavía no tienen cotización, de `desdeMes` a `hastaMes` (`YYYY-MM`). */
export function feesPorGenerar(proyeccion: ProyeccionMes[], desdeMes: string, hastaMes: string): number {
  return detalleFeesPorGenerar(proyeccion, desdeMes, hastaMes).reduce((sum, row) => sum + row.monto, 0)
}

/** Ganadas con fecha de cierre en [desde, hasta] (`YYYY-MM-DD`, comparación por día). */
export function ganadasEnRango(oportunidades: Oportunidad[], desde: string, hasta: string): Oportunidad[] {
  return oportunidades.filter((row) => {
    if (row.etapa !== "cierre_ganado" || !row.fecha_cierre) {
      return false
    }
    const dia = row.fecha_cierre.slice(0, 10)
    return dia >= desde && dia <= hasta
  })
}

export type CicloVenta = {
  ganadas: number
  ticketPromedio: number | null
  cicloPromedioDias: number | null
  mayorDeal: number | null
}

export function cicloVenta(ganadas: Oportunidad[]): CicloVenta {
  if (ganadas.length === 0) {
    return { ganadas: 0, ticketPromedio: null, cicloPromedioDias: null, mayorDeal: null }
  }
  const valores = ganadas.map(valorEfectivo)
  const dias = ganadas
    .map((row) => (Date.parse(row.fecha_cierre ?? "") - Date.parse(row.created_at)) / DIA_MS)
    // Alta directa como ganada (p. ej. un contrato sin oportunidad previa) no es ciclo de venta.
    .filter((value) => Number.isFinite(value) && value >= 1)
  return {
    ganadas: ganadas.length,
    ticketPromedio: valores.reduce((a, b) => a + b, 0) / valores.length,
    cicloPromedioDias: dias.length > 0 ? dias.reduce((a, b) => a + b, 0) / dias.length : null,
    mayorDeal: Math.max(...valores),
  }
}

export type FilaRanking = {
  ejecutivoId: string
  ganadas: number
  cerrado: number
  ponderado: number
}

/** Por ejecutivo: lo ganado en el rango y su pipeline abierto ponderado. */
export function rankingVendedores(
  oportunidades: Oportunidad[],
  etapas: EtapaPipeline[],
  desde: string,
  hasta: string,
): FilaRanking[] {
  const filas = new Map<string, FilaRanking>()
  const fila = (id: string) => {
    let row = filas.get(id)
    if (!row) {
      row = { ejecutivoId: id, ganadas: 0, cerrado: 0, ponderado: 0 }
      filas.set(id, row)
    }
    return row
  }
  for (const row of ganadasEnRango(oportunidades, desde, hasta)) {
    const target = fila(row.ejecutivo_id)
    target.ganadas += 1
    target.cerrado += valorEfectivo(row)
  }
  for (const row of oportunidades.filter(esAbierta)) {
    fila(row.ejecutivo_id).ponderado += valorEfectivo(row) * probabilidad(row, etapas)
  }
  return [...filas.values()].sort((a, b) => b.cerrado - a.cerrado || b.ponderado - a.ponderado)
}

/** Días enteros desde hoy (Ecuador) hasta `YYYY-MM-DD`. Negativo si ya pasó. */
export function diasHasta(fecha: string, hoy: string): number {
  return Math.round((Date.parse(`${fecha}T00:00:00`) - Date.parse(`${hoy}T00:00:00`)) / DIA_MS)
}
