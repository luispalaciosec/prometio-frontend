export function normalizarParaBusqueda(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
}

export function coincideTexto(q: string, ...campos: string[]): boolean {
  const needle = normalizarParaBusqueda(q.trim())
  if (!needle) {
    return true
  }
  return campos.some((campo) => normalizarParaBusqueda(campo).includes(needle))
}

export function compareTextoLocale(a: string, b: string): number {
  return a.localeCompare(b, "es", { sensitivity: "base" })
}
