/** Estado visible de una actividad según qué fechas tiene. */
export function estadoActividad(row: {
  programada_para: string | null
  reportada_en: string | null
}): "programada" | "reportada" | "actividad" {
  if (row.programada_para != null && row.reportada_en == null) {
    return "programada"
  }
  if (row.reportada_en) {
    return "reportada"
  }
  return "actividad"
}
