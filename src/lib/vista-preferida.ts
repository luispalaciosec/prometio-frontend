export type VistaListaCuadricula = "lista" | "cuadricula"

export const VISTA_LISTA_CUADRICULA = ["lista", "cuadricula"] as const

export function leerVistaLocal<T extends string>(
  key: string,
  permitidas: readonly T[],
  fallback: T,
): T {
  try {
    const stored = localStorage.getItem(key)
    if (stored && (permitidas as readonly string[]).includes(stored)) {
      return stored as T
    }
  } catch {
    /* ignore */
  }
  return fallback
}

export function guardarVistaLocal(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}
