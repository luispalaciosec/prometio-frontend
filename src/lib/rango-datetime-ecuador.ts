/** Ecuador no usa horario de verano — offset fijo para rangos de día calendario. */
const OFFSET = "-05:00"

/** Inicio/fin de día calendario en Ecuador → ISO con offset (para query params datetime). */
export function rangoDatetimeEcuador(desde: string, hasta: string): { desde: string; hasta: string } {
  return {
    desde: `${desde}T00:00:00${OFFSET}`,
    hasta: `${hasta}T23:59:59.999${OFFSET}`,
  }
}
