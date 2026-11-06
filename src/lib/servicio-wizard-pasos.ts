import type { Servicio } from "@/types/servicio"

export type WizardPaso = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export function pasosVisibles(
  draft: Pick<Servicio, "modelo_cobro" | "tiene_fases">,
): WizardPaso[] {
  const pasos: WizardPaso[] = [1, 2, 3]
  if (draft.modelo_cobro === "fee_fijo" || draft.modelo_cobro === "fee_recurrente") {
    pasos.push(4)
  }
  if (draft.tiene_fases) {
    pasos.push(5)
  }
  pasos.push(6, 7, 8)
  return pasos
}

export const PASO_TITULO: Record<WizardPaso, string> = {
  1: "Datos básicos",
  2: "Modelo de cobro",
  3: "Equipo y costeo",
  4: "Configuración de fee",
  5: "Fases",
  6: "Márgenes por defecto",
  7: "Documentos requeridos",
  8: "Revisión y publicación",
}
