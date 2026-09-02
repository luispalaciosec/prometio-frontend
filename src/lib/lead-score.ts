import type { LeadScoreDesglose } from "@/types/oportunidad"

export const LEAD_SCORE_COMPONENTE_MAX: Record<keyof LeadScoreDesglose, number> = {
  frescura: 35,
  seguimiento: 25,
  primera_respuesta: 20,
  tamano_deal: 15,
  fit_empresa: 5,
}

export const LEAD_SCORE_COMPONENTE_LABELS: Record<keyof LeadScoreDesglose, string> = {
  frescura: "Frescura del contacto",
  seguimiento: "Seguimiento (actividades)",
  primera_respuesta: "Primera respuesta (Bandeja)",
  tamano_deal: "Tamaño del deal",
  fit_empresa: "Fit de empresa",
}

export type LeadScoreVariant = "success" | "warning" | "outline"

export function leadScoreVariant(score: number): LeadScoreVariant {
  if (score >= 70) {
    return "success"
  }
  if (score >= 40) {
    return "warning"
  }
  return "outline"
}

export function leadScoreTierLabel(score: number): string {
  if (score >= 70) {
    return "Lead caliente"
  }
  if (score >= 40) {
    return "Lead tibio"
  }
  return "Lead frío"
}
