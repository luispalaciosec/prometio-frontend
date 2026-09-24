import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { WIZARD_PASOS_STEPPER, type WizardPasoId, indiceStepper } from "./wizard-steps"

export function WizardStepper({
  pasoActual,
  completados,
}: {
  pasoActual: WizardPasoId
  completados: Set<WizardPasoId>
}) {
  const actualIdx = indiceStepper(pasoActual)

  return (
    <nav aria-label="Pasos del documento de alcance" className="overflow-x-auto pb-1">
      <ol className="flex min-w-max items-center gap-1">
        {WIZARD_PASOS_STEPPER.map((paso, index) => {
          const done = completados.has(paso.id) || (actualIdx >= 0 && index < actualIdx)
          const actual = paso.id === pasoActual
          return (
            <li key={paso.id} className="flex items-center gap-1">
              {index > 0 ? <span className="mx-1 text-muted-foreground/50" aria-hidden="true">·</span> : null}
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-micro transition-colors",
                  actual && "bg-primary/10 text-primary font-medium ring-1 ring-primary/25",
                  !actual && done && "text-foreground",
                  !actual && !done && "text-muted-foreground",
                )}
                aria-current={actual ? "step" : undefined}
              >
                <span
                  className={cn(
                    "inline-flex size-5 items-center justify-center rounded-full border text-[10px]",
                    done && "border-primary/30 bg-primary text-primary-foreground",
                    actual && !done && "border-primary bg-background text-primary",
                    !actual && !done && "border-border bg-muted/50",
                  )}
                  aria-hidden="true"
                >
                  {done ? <Check className="size-3" strokeWidth={2.5} /> : index + 1}
                </span>
                {paso.label}
                {paso.opcional ? <span className="text-muted-foreground">(opc.)</span> : null}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
