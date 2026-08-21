/**
 * Las 3 reglas de integridad de actividad (espejo de ActividadCreate / PATCH merge).
 * Feedback en blanco → null, también dentro del merge: vaciar el de una ya reportada es 422.
 */
export type CamposIntegridadActividad = {
  contacto_id: string | null
  oportunidad_id: string | null
  programada_para: string | null
  reportada_en: string | null
  feedback: string | null
}

/** `undefined` = no vino en el PATCH. `""` / solo espacios → `null`. */
export function normalizarFeedback(value: string | null | undefined): string | null | undefined {
  if (value === undefined) {
    return undefined
  }
  if (value == null) {
    return null
  }
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

export function assertIntegridadActividad(row: CamposIntegridadActividad): void {
  if (row.contacto_id == null && row.oportunidad_id == null) {
    throw new Error("se requiere al menos uno de contacto_id/oportunidad_id")
  }
  if (row.programada_para == null && row.reportada_en == null) {
    throw new Error("se requiere al menos uno de programada_para/reportada_en")
  }
  if (row.reportada_en != null && row.feedback == null) {
    throw new Error("feedback es obligatorio cuando hay reportada_en")
  }
}

export function fusionarYValidar(
  existing: CamposIntegridadActividad,
  changes: Partial<CamposIntegridadActividad>,
): CamposIntegridadActividad {
  const feedbackChange = "feedback" in changes ? normalizarFeedback(changes.feedback) : undefined
  const merged: CamposIntegridadActividad = {
    contacto_id: "contacto_id" in changes ? (changes.contacto_id ?? null) : existing.contacto_id,
    oportunidad_id:
      "oportunidad_id" in changes ? (changes.oportunidad_id ?? null) : existing.oportunidad_id,
    programada_para:
      "programada_para" in changes ? (changes.programada_para ?? null) : existing.programada_para,
    reportada_en: "reportada_en" in changes ? (changes.reportada_en ?? null) : existing.reportada_en,
    feedback: feedbackChange !== undefined ? feedbackChange : existing.feedback,
  }
  assertIntegridadActividad(merged)
  return merged
}
