import { LeadScoreBadge } from "@/components/pipeline/LeadScoreBadge"
import {
  LEAD_SCORE_COMPONENTE_LABELS,
  LEAD_SCORE_COMPONENTE_MAX,
  leadScoreTierLabel,
} from "@/lib/lead-score"
import { cn } from "@/lib/utils"
import type { LeadScoreDesglose } from "@/types/oportunidad"

const COMPONENTES: (keyof LeadScoreDesglose)[] = [
  "frescura",
  "seguimiento",
  "primera_respuesta",
  "tamano_deal",
  "fit_empresa",
]

export function LeadScoreDesglosePanel({
  score,
  desglose,
}: {
  score: number
  desglose: LeadScoreDesglose
}) {
  return (
    <section className="space-y-4 rounded-xl p-4 ring-1 ring-border">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h3 className="text-section">Lead score</h3>
          <p className="mt-1 text-kicker">{leadScoreTierLabel(score)} · calculado en vivo</p>
        </div>
        <LeadScoreBadge score={score} showIcon className="h-6 px-2.5 text-sm" />
      </div>
      <dl className="space-y-3">
        {COMPONENTES.map((clave) => {
          const max = LEAD_SCORE_COMPONENTE_MAX[clave]
          const valor = desglose[clave]
          const noAplica = clave === "primera_respuesta" && valor == null
          const puntos = valor ?? 0
          const pct = noAplica ? 0 : max > 0 ? Math.round((puntos / max) * 100) : 0

          return (
            <div key={clave} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-ui">{LEAD_SCORE_COMPONENTE_LABELS[clave]}</dt>
                <dd className="shrink-0 text-kicker tabular-nums text-muted-foreground">
                  {noAplica ? "No aplica" : `${puntos} / ${max}`}
                </dd>
              </div>
              {!noAplica ? (
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full bg-primary transition-[width]",
                      pct >= 70 && "bg-success",
                      pct >= 35 && pct < 70 && "bg-warning",
                      pct < 35 && "bg-muted-foreground/40",
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              ) : (
                <p className="text-micro text-muted-foreground">
                  Sin conversación por Bandeja — este componente no penaliza el total.
                </p>
              )}
            </div>
          )
        })}
      </dl>
    </section>
  )
}
