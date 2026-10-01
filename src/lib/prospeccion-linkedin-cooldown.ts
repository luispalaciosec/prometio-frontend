/** true si aún no se puede volver a buscar. */
export function prospeccionEnCooldown(proximoIntentoEn: string | null | undefined): boolean {
  if (!proximoIntentoEn) {
    return false
  }
  const ms = new Date(proximoIntentoEn).getTime()
  if (Number.isNaN(ms)) {
    return false
  }
  return ms > Date.now()
}
