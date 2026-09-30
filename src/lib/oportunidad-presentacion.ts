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
