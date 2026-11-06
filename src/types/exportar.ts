export type RecursoExportable = "oportunidades" | "cotizaciones" | "contratos"
export type FormatoArchivo = "xlsx" | "pdf"
export type Direccion = "asc" | "desc"

export type TipoColumnaExportacion = "texto" | "moneda" | "entero" | "porcentaje" | "fecha" | "booleano"
export type TipoFiltroExportacion = "booleano" | "enum" | "uuid" | "numero" | "fecha" | "texto"

export type ColumnaExportacion = { clave: string; titulo: string; tipo: TipoColumnaExportacion }

export type FiltroExportacion = {
  nombre: string
  tipo: TipoFiltroExportacion
  titulo: string
  opciones?: { valor: string; etiqueta: string }[]
}

export type EntidadExportacion = {
  titulo: string
  columnas: ColumnaExportacion[]
  agrupables: { clave: string; titulo: string }[]
  sumables: string[]
  /** Ya viene recortada por rol: un vendedor no recibe `ejecutivo_id`. */
  filtros: FiltroExportacion[]
}

export type OpcionesExportacion = {
  entidades: Record<RecursoExportable, EntidadExportacion>
  limites: Record<FormatoArchivo, number>
  filas_vista_previa: number
}

export type VistaPreviaExportacion = {
  total_filas: number
  columnas: ColumnaExportacion[]
  /** Textos ya formateados, en el orden de `columnas`. Como mucho `filas_vista_previa`. */
  filas: string[][]
  hay_mas_filas: boolean
  totales: Record<string, number> | null
  resumen: { etiqueta: string; valor: string }[]
  grupos: { valor: string; cantidad: number; subtotales: Record<string, number> | null }[] | null
  excede: Record<FormatoArchivo, boolean>
  limites: Record<FormatoArchivo, number>
  filtros_aplicados: string
}

/** Lo que se elige en el panel. `filtros`: "" = sin filtro; los booleanos van como "true" / "false". */
export type SeleccionExportacion = {
  filtros: Record<string, string>
  columnas: string[]
  ordenPor: string
  orden: Direccion
  agruparPor: string
  ordenGrupos: Direccion
}
