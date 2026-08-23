import type { PeriodoTipo } from "@/types/meta-comercial"

function pad(n: number): string {
  return String(n).padStart(2, "0")
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function periodoVigenteHoy(): {
  mes: string
  anio: string
  trimestre: "1" | "2" | "3" | "4"
} {
  const now = new Date()
  const trimestre = (Math.floor(now.getMonth() / 3) + 1) as 1 | 2 | 3 | 4
  return {
    mes: `${now.getFullYear()}-${pad(now.getMonth() + 1)}`,
    anio: String(now.getFullYear()),
    trimestre: String(trimestre) as "1" | "2" | "3" | "4",
  }
}

export function rangoMensual(yearMonth: string): { fecha_inicio: string; fecha_fin: string } {
  const [yearRaw, monthRaw] = yearMonth.split("-")
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  if (!year || !month) {
    throw new Error("mes inválido")
  }
  const inicio = new Date(year, month - 1, 1)
  const fin = new Date(year, month, 0)
  return { fecha_inicio: toIsoDate(inicio), fecha_fin: toIsoDate(fin) }
}

export function rangoTrimestral(
  year: number,
  trimestre: 1 | 2 | 3 | 4,
): { fecha_inicio: string; fecha_fin: string } {
  const startMonth = (trimestre - 1) * 3
  const inicio = new Date(year, startMonth, 1)
  const fin = new Date(year, startMonth + 3, 0)
  return { fecha_inicio: toIsoDate(inicio), fecha_fin: toIsoDate(fin) }
}

export function esMetaVigente(row: { fecha_inicio: string; fecha_fin: string }, hoy = toIsoDate(new Date())): boolean {
  return row.fecha_inicio <= hoy && row.fecha_fin >= hoy
}

export function etiquetaPeriodo(tipo: PeriodoTipo | string | null | undefined): string {
  if (tipo === "mensual") {
    return "Mensual"
  }
  if (tipo === "trimestral") {
    return "Trimestral"
  }
  return tipo ?? "—"
}
