export type WizardPasoId =
  | "arranque"
  | "generando"
  | "objetivo"
  | "alcance"
  | "entregables"
  | "condiciones"
  | "auditoria"
  | "word"

export type WizardPasoStepper = {
  id: Exclude<WizardPasoId, "arranque" | "generando">
  label: string
  opcional?: boolean
}

export const WIZARD_PASOS_STEPPER: WizardPasoStepper[] = [
  { id: "objetivo", label: "Objetivo" },
  { id: "alcance", label: "Alcance" },
  { id: "entregables", label: "Entregables" },
  { id: "condiciones", label: "Condiciones", opcional: true },
  { id: "auditoria", label: "Revisión IA" },
  { id: "word", label: "Word y envío" },
]

export function indiceStepper(paso: WizardPasoId): number {
  if (paso === "arranque" || paso === "generando") {
    return -1
  }
  return WIZARD_PASOS_STEPPER.findIndex((row) => row.id === paso)
}

export function pasoAnterior(paso: WizardPasoId): WizardPasoId | null {
  if (paso === "arranque" || paso === "generando") {
    return null
  }
  const idx = indiceStepper(paso)
  if (idx <= 0) {
    return null
  }
  return WIZARD_PASOS_STEPPER[idx - 1].id
}

export function pasoSiguiente(paso: WizardPasoId, omitirCondiciones: boolean): WizardPasoId | null {
  if (paso === "arranque") {
    return "objetivo"
  }
  if (paso === "generando") {
    return null
  }
  const idx = indiceStepper(paso)
  if (idx < 0) {
    return null
  }
  if (idx >= WIZARD_PASOS_STEPPER.length - 1) {
    return null
  }
  const next = WIZARD_PASOS_STEPPER[idx + 1]
  if (next.id === "condiciones" && omitirCondiciones) {
    return WIZARD_PASOS_STEPPER[idx + 2]?.id ?? null
  }
  return next.id
}
