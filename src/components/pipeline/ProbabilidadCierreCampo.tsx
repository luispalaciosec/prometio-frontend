import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/** Probabilidad de cierre con ajuste manual dentro de la etapa. El próximo cambio de etapa la vuelve al default. */
export function ProbabilidadCierreCampo({
  valor,
  editable,
  onGuardar,
}: {
  /** 0–100, o null si la oportunidad no la tiene. */
  valor: number | null
  editable: boolean
  onGuardar: (valor: number) => Promise<void>
}) {
  const [editando, setEditando] = useState(false)
  const [raw, setRaw] = useState("")
  const [guardando, setGuardando] = useState(false)

  const texto = valor == null ? "Sin definir" : `${Math.round(valor)}%`

  async function guardar() {
    const numero = Number(raw.replace(",", "."))
    if (raw.trim() === "" || !Number.isFinite(numero) || numero < 0 || numero > 100) {
      toast.error("La probabilidad tiene que estar entre 0 y 100.")
      return
    }
    setGuardando(true)
    try {
      await onGuardar(numero)
      setEditando(false)
    } catch {
      /* quien guarda ya mostró el error; el campo queda abierto para corregir */
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <dt className="text-micro">Probabilidad de cierre</dt>
      {editando ? (
        <dd>
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              void guardar()
            }}
          >
            <div className="relative w-24">
              <Input
                aria-label="Probabilidad de cierre en porcentaje"
                inputMode="decimal"
                value={raw}
                onChange={(event) => setRaw(event.target.value)}
                className="pr-7 text-right tabular-nums"
                autoFocus
              />
              <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-kicker">%</span>
            </div>
            <Button type="submit" size="sm" disabled={guardando}>
              Guardar
            </Button>
            <Button type="button" size="sm" variant="ghost" disabled={guardando} onClick={() => setEditando(false)}>
              Cancelar
            </Button>
          </form>
          <p className="mt-1 text-kicker">Al cambiar de etapa vuelve al valor por defecto de la etapa.</p>
        </dd>
      ) : (
        <dd className="flex items-center gap-2 text-ui">
          <span className="tabular-nums">{texto}</span>
          {editable ? (
            <button
              type="button"
              className="text-kicker text-primary underline-offset-4 hover:underline"
              onClick={() => {
                setRaw(valor == null ? "" : String(Math.round(valor)))
                setEditando(true)
              }}
            >
              Ajustar
            </button>
          ) : null}
        </dd>
      )}
    </div>
  )
}
