/** Compara el servicio de un proveedor con una etiqueta, sin distinguir mayúsculas. */
export function mismoServicio(actual: string | null, tag: string): boolean {
  return actual != null && actual.toLocaleLowerCase("es") === tag.toLocaleLowerCase("es")
}
