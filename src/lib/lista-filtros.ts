export function coincideTexto(q: string, ...campos: string[]): boolean {
  const needle = q.trim().toLowerCase()
  if (!needle) {
    return true
  }
  return campos.some((campo) => campo.toLowerCase().includes(needle))
}
