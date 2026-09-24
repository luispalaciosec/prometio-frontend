import { useState } from "react"
import { Loader2, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api-client"
import { regenerarSeccionDocumento } from "@/lib/api/documento-alcance"
import { TITULO_SECCION } from "@/lib/documento-alcance-draft"
import { cn } from "@/lib/utils"
import type { RegenerarSeccionResponse, SeccionRegenerable } from "@/types/documento-alcance"

const CHIPS = ["Más corto", "Más formal", "Más cercano", "Agregar métricas"] as const

export function CopilotoPanel({
  documentoId,
  seccion,
  disabled,
  onAceptar,
}: {
  documentoId: string
  seccion: SeccionRegenerable
  disabled: boolean
  onAceptar: (propuesta: RegenerarSeccionResponse) => void
}) {
  const [instruccion, setInstruccion] = useState("")
  const [generando, setGenerando] = useState(false)
  const [propuesta, setPropuesta] = useState<RegenerarSeccionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function pedir(extra?: string) {
    setGenerando(true)
    setError(null)
    setPropuesta(null)
    try {
      const resp = await regenerarSeccionDocumento(documentoId, {
        seccion,
        instruccion: (extra ?? instruccion.trim()) || null,
      })
      setPropuesta(resp)
    } catch (err) {
      if (err instanceof ApiError && err.status === 502) {
        setError("No pude generar esto ahora, probá de nuevo o escribilo vos.")
      } else {
        setError(err instanceof Error ? err.message : "No pude generar la propuesta.")
      }
    } finally {
      setGenerando(false)
    }
  }

  function descartar() {
    setPropuesta(null)
  }

  return (
    <aside
      className="surface-card flex flex-col gap-3 border-primary/15 bg-primary/[0.03] p-4 lg:sticky lg:top-4"
      aria-label="Copiloto de IA"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="size-4" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div>
          <p className="text-ui-medium">Copiloto de IA</p>
          <p className="text-micro text-muted-foreground">Te propone texto; vos decidís si lo usás.</p>
        </div>
      </div>

      <p className="text-kicker">
        Sección: <span className="text-foreground">{TITULO_SECCION[seccion]}</span>
      </p>

      <div className="flex flex-wrap gap-1.5">
        {CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            disabled={disabled || generando}
            className={cn(
              "rounded-full border border-border bg-background px-2.5 py-1 text-micro transition-colors",
              "hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:pointer-events-none disabled:opacity-50",
            )}
            onClick={() => void pedir(chip)}
          >
            {chip}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={instruccion}
          disabled={disabled || generando}
          placeholder="Decile qué querés cambiar…"
          className="h-9 flex-1"
          onChange={(e) => setInstruccion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              void pedir()
            }
          }}
        />
        <Button type="button" size="sm" disabled={disabled || generando} onClick={() => void pedir()}>
          {generando ? <Loader2 className="size-4 animate-spin" /> : "Proponer"}
        </Button>
      </div>

      {error ? (
        <p className="text-kicker text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {propuesta ? (
        <div className="space-y-3 rounded-xl border border-border bg-background p-3 shadow-raised" aria-live="polite">
          <p className="text-ui-medium">Propuesta de la IA</p>
          <PropuestaPreview propuesta={propuesta} />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onAceptar(propuesta)
                setPropuesta(null)
              }}
            >
              Usar esta
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={descartar}>
              Descartar
            </Button>
          </div>
        </div>
      ) : null}
    </aside>
  )
}

function PropuestaPreview({ propuesta }: { propuesta: RegenerarSeccionResponse }) {
  const { seccion, valor } = propuesta
  if (seccion === "alcance_funcional" && Array.isArray(valor)) {
    return (
      <ul className="max-h-48 space-y-2 overflow-y-auto text-kicker">
        {(valor as { seccion: string; entregables: string[] }[]).map((row, i) => (
          <li key={i}>
            <span className="text-ui-medium">{row.seccion}</span>
            <ul className="mt-1 list-disc pl-4">
              {row.entregables.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    )
  }
  if (seccion === "entregables" && Array.isArray(valor)) {
    return (
      <ul className="max-h-48 space-y-2 overflow-y-auto text-kicker">
        {(valor as { nombre: string; descripcion: string }[]).map((row, i) => (
          <li key={i}>
            <span className="text-ui-medium">{row.nombre}</span>
            {row.descripcion ? <p className="text-muted-foreground">{row.descripcion}</p> : null}
          </li>
        ))}
      </ul>
    )
  }
  return <p className="max-h-48 overflow-y-auto whitespace-pre-wrap text-kicker">{String(valor ?? "")}</p>
}
