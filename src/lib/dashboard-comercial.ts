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

export function pipelinePonderado(oportunidades: Oportunidad[], etapas: EtapaPipeline[]): number {
  return oportunidades
    .filter(esAbierta)
    .reduce((sum, row) => sum + valorEfectivo(row) * probabilidad(row, etapas), 0)
}

/** Fees de contratos que todavía no tienen cotización, de `desdeMes` a `hastaMes` (`YYYY-MM`). */
export function feesPorGenerar(proyeccion: ProyeccionMes[], desdeMes: string, hastaMes: string): number {
  return proyeccion
    .filter((row) => {
      const mes = row.periodo.slice(0, 7)
      return mes >= desdeMes && mes <= hastaMes
    })
    .reduce((sum, row) => sum + Math.max(0, row.piso_contratado - row.facturado - row.por_facturar), 0)
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
