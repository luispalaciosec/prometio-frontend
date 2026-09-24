import { useEffect, useState } from "react"
import { Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"

const FRASES = [
  "Leí tus líneas de cotización",
  "Entiendo el contexto del cliente",
  "Redactando objetivo y alcance…",
  "Organizando entregables y tiempos",
  "Puliendo el tono para el cliente",
  "Últimos retoques al borrador",
]

export function GeneracionProgreso({ lineasCount }: { lineasCount: number }) {
  const [indice, setIndice] = useState(0)
  const reduceMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

  useEffect(() => {
    if (reduceMotion) {
      return
    }
    const timer = window.setInterval(() => {
      setIndice((prev) => (prev + 1) % FRASES.length)
    }, 2800)
    return () => window.clearInterval(timer)
  }, [reduceMotion])

  const frases = [
    lineasCount === 1 ? "Leí tu línea de cotización" : `Leí tus ${lineasCount} líneas de cotización`,
    ...FRASES.slice(1),
  ]

  return (
    <div className="surface-card p-6">
      <div className="flex items-start gap-4">
        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="size-6" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <h4 className="text-section">Armando tu borrador</h4>
            <p className="mt-1 text-kicker">La IA suele tardar entre 10 y 20 segundos. Podés quedarte acá.</p>
          </div>
          <ul className="space-y-2" aria-live="polite" aria-busy="true">
            {frases.map((frase, i) => {
              const visible = reduceMotion ? i <= indice : i === indice || i < indice
              const actual = i === indice
              return (
                <li
                  key={frase}
                  className={cn(
                    "flex items-center gap-2 text-ui transition-all duration-500",
                    visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 h-0 overflow-hidden",
                    actual && "text-foreground font-medium",
                    !actual && visible && "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full bg-primary/40",
                      actual && !reduceMotion && "animate-pulse bg-primary",
                    )}
                    aria-hidden="true"
                  />
                  {frase}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}
