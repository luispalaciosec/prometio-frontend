export function contarPalabras(texto: string | null | undefined): number {
  const t = texto?.trim()
  if (!t) {
    return 0
  }
  return t.split(/\s+/).filter(Boolean).length
}
