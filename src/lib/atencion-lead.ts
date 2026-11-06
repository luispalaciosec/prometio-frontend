/** Duración legible: «12 min», «1 h 5 min». */
export function formatMinutos(minutos: number): string {
  const total = Math.max(1, Math.round(Math.abs(minutos)))
  if (total < 60) {
    return `${total} min`
  }
  const resto = total % 60
  return resto === 0 ? `${Math.floor(total / 60)} h` : `${Math.floor(total / 60)} h ${resto} min`
}

/** Cuenta regresiva del reloj, en tiempo hábil. Negativo = ya se pasó de la meta. */
export function textoReloj(minutosRestantes: number): string {
  if (minutosRestantes < 0) {
    return `Vencido hace ${formatMinutos(minutosRestantes)}`
  }
  const duracion = formatMinutos(minutosRestantes)
  return duracion === "1 min" ? "Queda 1 min" : `Quedan ${duracion}`
}
