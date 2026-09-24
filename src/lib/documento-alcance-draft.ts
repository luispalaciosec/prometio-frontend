import type { DocumentoAlcanceDraft } from "@/components/pipeline/DocumentoAlcanceEditor"
import type { DocumentoAlcance, DocumentoAlcanceUpdate, SeccionRegenerable } from "@/types/documento-alcance"

export function patchDesdeDraft(draft: DocumentoAlcanceDraft): DocumentoAlcanceUpdate {
  return {
    objetivo: draft.objetivo,
    alcance_funcional: limpiarSecciones(draft.alcance_funcional),
    alcance_tecnico_incluido: draft.alcance_tecnico_incluido,
    alcance_tecnico_no_incluido: draft.alcance_tecnico_no_incluido,
    metodologia: draft.metodologia,
    tiempos: draft.tiempos,
    modelo_inversion: draft.modelo_inversion,
    supuestos: draft.supuestos,
    entregables: limpiarEntregables(draft.entregables),
    condiciones_pago_texto: draft.condiciones_pago_texto,
    exclusiones_texto: draft.exclusiones_texto,
    consideraciones_texto: draft.consideraciones_texto,
    por_que_geeks_texto: draft.por_que_geeks_texto,
  }
}

export function limpiarSecciones(rows: DocumentoAlcanceDraft["alcance_funcional"]) {
  const next = rows
    .map((row) => ({
      seccion: row.seccion.trim(),
      entregables: row.entregables.map((item) => item.trim()).filter(Boolean),
    }))
    .filter((row) => row.seccion || row.entregables.length > 0)
  return next.length > 0 ? next : null
}

export function limpiarEntregables(rows: DocumentoAlcanceDraft["entregables"]) {
  const next = rows
    .map((row) => ({ nombre: row.nombre.trim(), descripcion: row.descripcion.trim() }))
    .filter((row) => row.nombre || row.descripcion)
  return next.length > 0 ? next : null
}

export function draftTieneCambiosLocales(
  draft: DocumentoAlcanceDraft,
  doc: DocumentoAlcance,
): boolean {
  const patch = patchDesdeDraft(draft)
  for (const key of Object.keys(patch) as (keyof DocumentoAlcanceUpdate)[]) {
    const local = JSON.stringify(patch[key] ?? null)
    const remoto = JSON.stringify(doc[key] ?? null)
    if (local !== remoto) {
      return true
    }
  }
  return false
}

export const TITULO_SECCION: Record<SeccionRegenerable, string> = {
  objetivo: "Objetivo",
  alcance_funcional: "Alcance funcional",
  alcance_tecnico_incluido: "Alcance técnico incluido",
  alcance_tecnico_no_incluido: "Alcance técnico no incluido",
  metodologia: "Metodología",
  tiempos: "Tiempos",
  modelo_inversion: "Modelo de inversión",
  supuestos: "Supuestos",
  entregables: "Entregables",
  condiciones_pago_texto: "Condiciones de pago",
  exclusiones_texto: "Exclusiones",
  consideraciones_texto: "Consideraciones",
  por_que_geeks_texto: "Por qué Geeks",
}

export function guardadoHaceTexto(iso: string | null): string | null {
  if (!iso) {
    return null
  }
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 15_000) {
    return "Guardado hace un momento"
  }
  if (ms < 60_000) {
    return "Guardado hace menos de un minuto"
  }
  const min = Math.floor(ms / 60_000)
  if (min === 1) {
    return "Guardado hace 1 minuto"
  }
  if (min < 60) {
    return `Guardado hace ${min} minutos`
  }
  const h = Math.floor(min / 60)
  return h === 1 ? "Guardado hace 1 hora" : `Guardado hace ${h} horas`
}
