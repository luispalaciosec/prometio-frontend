/** Nombre libre de la oportunidad, si el usuario lo definió. */
export function oportunidadNombreLibre(nombre: string | null | undefined): string | null {
  const trimmed = nombre?.trim()
  return trimmed ? trimmed : null
}

export function subtituloContactoEmpresa(contacto: string, empresa: string): string {
  return `${contacto} · ${empresa}`
}

type OportunidadEtiquetas = {
  nombre?: string | null
  contacto: { nombre_completo: string }
  empresa: { nombre: string }
}

/** Título principal en tarjetas Kanban / detalle sin nombre libre (contacto, como hoy). */
export function tituloOportunidadLegacyContacto(op: OportunidadEtiquetas): string {
  return op.contacto.nombre_completo
}

const DIA_MS = 86_400_000

/**
 * Días sin actividad: desde la última actividad o, si nunca hubo, desde la creación. Es la misma referencia con la que
 * el backend calcula la alerta de estancamiento contra el umbral de la etapa.
 */
export function diasSinActividad(
  op: { fecha_ultima_actividad: string | null; created_at: string },
  ahora = Date.now(),
): number | null {
  const referencia = Date.parse(op.fecha_ultima_actividad ?? op.created_at)
  if (Number.isNaN(referencia)) {
    return null
  }
  return Math.max(0, Math.floor((ahora - referencia) / DIA_MS))
}

/** «Hoy», «1 día», «12 días». */
export function textoDiasSinActividad(dias: number | null): string {
  if (dias == null) {
    return "—"
  }
  if (dias === 0) {
    return "Hoy"
  }
  return dias === 1 ? "1 día" : `${dias} días`
}

/** Valor que pesa en el pipeline: el cotizado en firme o, si no hay, el referencial. 0 si no tiene. */
export function valorEfectivoOportunidad(op: { valor_cotizado: number | null; valor_referencial: number | null }): number {
  if (op.valor_cotizado != null && op.valor_cotizado > 0) {
    return op.valor_cotizado
  }
  return op.valor_referencial != null && op.valor_referencial > 0 ? op.valor_referencial : 0
}
