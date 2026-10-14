/**
 * Como `Promise.all(items.map(fn))`, pero con a lo sumo `limite` llamadas en curso a la vez.
 * Sirve para pedidos por fila (p. ej. documentos de alcance por cotización) sin saturar al backend.
 */
export async function mapConLimite<T, R>(items: T[], limite: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const resultados: R[] = new Array(items.length)
  let siguiente = 0
  async function trabajador() {
    while (siguiente < items.length) {
      const indice = siguiente
      siguiente += 1
      resultados[indice] = await fn(items[indice])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limite, items.length) }, trabajador))
  return resultados
}
