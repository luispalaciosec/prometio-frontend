import type { ContratoVigencia } from "@/types/contrato-recurrente"

export const CONTRATO_VIGENCIA_LABELS: Record<ContratoVigencia, string> = {
  por_iniciar: "Por iniciar",
  vigente: "Vigente",
  por_renovar: "Por renovar",
  vencido: "Vencido",
}

export const CONTRATO_VIGENCIA_VARIANTS: Record<
  ContratoVigencia,
  "outline" | "success" | "warning" | "destructive"
> = {
  por_iniciar: "outline",
  vigente: "success",
  por_renovar: "warning",
  vencido: "destructive",
}

/** `YYYY-MM-01` → «oct 2026» (o «octubre 2026» con `largo`), sin correr el mes por zona horaria. */
export function formatPeriodo(periodo: string, largo = false): string {
  const [year, month] = periodo.slice(0, 7).split("-").map(Number)
  if (!year || !month) {
    return periodo
  }
  return new Date(year, month - 1, 1).toLocaleDateString("es-EC", {
    month: largo ? "long" : "short",
    year: "numeric",
  })
}

/** «Vence en 12 días» / «Vence hoy» / «Venció hace 3 días». */
export function textoDiasParaVencer(dias: number): string {
  if (dias === 0) {
    return "Vence hoy"
  }
  if (dias > 0) {
    return dias === 1 ? "Vence mañana" : `Vence en ${dias} días`
  }
  const atras = Math.abs(dias)
  return atras === 1 ? "Venció ayer" : `Venció hace ${atras} días`
}

/** Mes en curso en Ecuador como `YYYY-MM` (para `<input type="month">`). */
export function mesActualEcuador(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Guayaquil" }).slice(0, 7)
}

/** Hoy en Ecuador como `YYYY-MM-DD`. */
export function hoyEcuador(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Guayaquil" })
}
