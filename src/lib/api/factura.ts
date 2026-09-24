import { apiFetch } from "@/lib/api-client"
import type { FacturasResumen, FacturasResponse, ListFacturasQuery } from "@/types/factura"

export const FACTURAS_PAGE_SIZE = 25

const TZ_ECUADOR = "America/Guayaquil"

export type FacturasPeriodoModo = "mes_actual" | "mes" | "ultimos" | "rango"

export type FacturasPeriodoState = {
  modo: FacturasPeriodoModo
  /** YYYY-MM — modo `mes` */
  mesCalendario: string
  /** modo `ultimos` */
  mesesRolling: number
  /** modo `rango` */
  rangoDesde: string
  rangoHasta: string
}

/** Fecha calendario YYYY-MM-DD en hora de Ecuador (alineado al resumen del backend). */
export function fechaHoyEcuador(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ_ECUADOR }).format(new Date())
}

export function mesActualYyyyMmEcuador(): string {
  return fechaHoyEcuador().slice(0, 7)
}

export function mesEnCursoEcuadorBounds(): { desde: string; hasta: string } {
  const hasta = fechaHoyEcuador()
  const [y, m] = hasta.split("-")
  return { desde: `${y}-${m}-01`, hasta }
}

/** Mes calendario completo; si es el mes en curso, `hasta` = hoy (Ecuador). */
export function boundsMesCalendario(yyyyMm: string): { desde: string; hasta: string } {
  const [yStr, mStr] = yyyyMm.split("-")
  const y = Number(yStr)
  const m = Number(mStr)
  const desde = `${yyyyMm}-01`
  const hoy = fechaHoyEcuador()
  if (hoy.startsWith(yyyyMm)) {
    return { desde, hasta: hoy }
  }
  const ultimoDia = new Date(y, m, 0).getDate()
  return { desde, hasta: `${yyyyMm}-${String(ultimoDia).padStart(2, "0")}` }
}

export function boundsUltimosMeses(meses: number): { desde: string; hasta: string } {
  const hasta = fechaHoyEcuador()
  const [y, mo, d] = hasta.split("-").map(Number)
  const fin = new Date(y, mo - 1, d)
  const inicio = new Date(fin)
  inicio.setDate(inicio.getDate() - meses * 30)
  const iso = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
  return { desde: iso(inicio), hasta: iso(fin) }
}

export function periodoFacturasInicial(): FacturasPeriodoState {
  return {
    modo: "mes_actual",
    mesCalendario: mesActualYyyyMmEcuador(),
    mesesRolling: 6,
    rangoDesde: "",
    rangoHasta: "",
  }
}

export function resolveFacturasPeriodoBounds(periodo: FacturasPeriodoState): { desde: string; hasta: string } {
  switch (periodo.modo) {
    case "mes_actual":
      return mesEnCursoEcuadorBounds()
    case "mes":
      return boundsMesCalendario(periodo.mesCalendario)
    case "ultimos":
      return boundsUltimosMeses(periodo.mesesRolling)
    case "rango":
      if (periodo.rangoDesde && periodo.rangoHasta) {
        return { desde: periodo.rangoDesde, hasta: periodo.rangoHasta }
      }
      return mesEnCursoEcuadorBounds()
  }
}

export function periodoFacturasSig(periodo: FacturasPeriodoState): string {
  return `${periodo.modo}|${periodo.mesCalendario}|${periodo.mesesRolling}|${periodo.rangoDesde}|${periodo.rangoHasta}`
}

export function etiquetaPeriodoFacturas(periodo: FacturasPeriodoState, bounds: { desde: string; hasta: string }): string {
  switch (periodo.modo) {
    case "mes_actual":
      return "este mes (hasta hoy)"
    case "mes":
      return `el mes ${periodo.mesCalendario}`
    case "ultimos":
      return `los últimos ${periodo.mesesRolling} meses`
    case "rango":
      return `entre ${bounds.desde} y ${bounds.hasta}`
  }
}

export function getFacturasResumen(bounds: { desde: string; hasta: string }): Promise<FacturasResumen> {
  const params = new URLSearchParams({ desde: bounds.desde, hasta: bounds.hasta })
  return apiFetch(`/facturas/resumen?${params.toString()}`)
}

export function listFacturas(query: ListFacturasQuery = {}): Promise<FacturasResponse> {
  const params = new URLSearchParams()

  if (query.desde && query.hasta) {
    params.set("desde", query.desde)
    params.set("hasta", query.hasta)
  } else if (query.meses != null) {
    params.set("meses", String(query.meses))
  }

  const cliente = query.cliente?.trim()
  if (cliente) {
    params.set("cliente", cliente)
  }
  if (query.orden_por) {
    params.set("orden_por", query.orden_por)
  }
  if (query.orden_direccion) {
    params.set("orden_direccion", query.orden_direccion)
  }
  if (query.limit != null) {
    params.set("limit", String(query.limit))
  }
  if (query.offset != null) {
    params.set("offset", String(query.offset))
  }

  return apiFetch(`/facturas?${params.toString()}`)
}
