/**
 * Conveniencia por navegador: la última selección de columnas, orden y agrupación de cada exportación.
 * Los filtros no se guardan: siempre arrancan con los de la pantalla.
 */
import type { Direccion, EntidadExportacion, RecursoExportable } from "@/types/exportar"

export type ColumnaElegida = { clave: string; activa: boolean }

export type PreferenciasExportacion = {
  columnas: ColumnaElegida[]
  ordenPor: string
  orden: Direccion
  agruparPor: string
  ordenGrupos: Direccion
}

const CLAVE = (recurso: RecursoExportable) => `prometio.exportar.v1.${recurso}`

function direccion(value: unknown): Direccion {
  return value === "desc" ? "desc" : "asc"
}

/** Lo guardado se cruza con las opciones actuales: lo que ya no existe se descarta y lo nuevo entra al final, marcado. */
export function leerPreferencias(recurso: RecursoExportable, entidad: EntidadExportacion): PreferenciasExportacion {
  const claves = entidad.columnas.map((columna) => columna.clave)
  const porDefecto: PreferenciasExportacion = {
    columnas: claves.map((clave) => ({ clave, activa: true })),
    ordenPor: "",
    orden: "asc",
    agruparPor: "",
    ordenGrupos: "asc",
  }
  let guardado: Partial<Record<keyof PreferenciasExportacion, unknown>> | null = null
  try {
    const raw = window.localStorage.getItem(CLAVE(recurso))
    guardado = raw ? (JSON.parse(raw) as typeof guardado) : null
  } catch {
    guardado = null
  }
  if (!guardado || typeof guardado !== "object") {
    return porDefecto
  }
  const vistas = new Set<string>()
  const columnas: ColumnaElegida[] = []
  if (Array.isArray(guardado.columnas)) {
    for (const item of guardado.columnas as unknown[]) {
      const clave = (item as ColumnaElegida | null)?.clave
      if (typeof clave === "string" && claves.includes(clave) && !vistas.has(clave)) {
        vistas.add(clave)
        columnas.push({ clave, activa: (item as ColumnaElegida).activa !== false })
      }
    }
  }
  for (const clave of claves) {
    if (!vistas.has(clave)) {
      columnas.push({ clave, activa: true })
    }
  }
  if (!columnas.some((columna) => columna.activa)) {
    return porDefecto
  }
  const ordenPor = typeof guardado.ordenPor === "string" && claves.includes(guardado.ordenPor) ? guardado.ordenPor : ""
  const agruparPor =
    typeof guardado.agruparPor === "string" && entidad.agrupables.some((a) => a.clave === guardado?.agruparPor)
      ? guardado.agruparPor
      : ""
  return {
    columnas,
    ordenPor,
    orden: direccion(guardado.orden),
    agruparPor,
    ordenGrupos: direccion(guardado.ordenGrupos),
  }
}

export function guardarPreferencias(recurso: RecursoExportable, preferencias: PreferenciasExportacion) {
  try {
    window.localStorage.setItem(CLAVE(recurso), JSON.stringify(preferencias))
  } catch {
    /* modo privado o almacenamiento bloqueado: no es crítico */
  }
}
