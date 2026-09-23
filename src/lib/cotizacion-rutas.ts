export function rutaConstructorCotizacion(
  cotizacionId: string,
  documentoId?: string | null,
): string {
  const base = `/cotizaciones/${cotizacionId}`
  if (documentoId) {
    return `${base}?documento=${encodeURIComponent(documentoId)}`
  }
  return base
}
