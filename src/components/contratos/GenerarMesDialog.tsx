import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { generarMes } from "@/lib/api/contrato-recurrente"
import { formatPeriodo, mesActualEcuador } from "@/lib/contrato-recurrente"
import type { GenerarMesResultado } from "@/types/contrato-recurrente"

export function GenerarMesDialog({
  open,
  onGenerado,
  onClose,
}: {
  open: boolean
  onGenerado: (resultado: GenerarMesResultado) => void
  onClose: () => void
}) {
  const [mes, setMes] = useState(mesActualEcuador)
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<GenerarMesResultado | null>(null)

  function cerrar() {
    setResultado(null)
    setMes(mesActualEcuador())
    onClose()
  }

  async function generar() {
    if (!mes) {
      toast.error("Elegí el mes.")
      return
    }
    setEnviando(true)
    try {
      const data = await generarMes(`${mes}-01`)
      setResultado(data)
      onGenerado(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo generar el mes.")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          cerrar()
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generar cotizaciones del mes</DialogTitle>
          <DialogDescription>
            Crea la cotización de cada contrato vigente en ese mes, directo en «Por facturar». Si ya
            existe, no la duplica.
          </DialogDescription>
        </DialogHeader>
        {resultado ? (
          <div className="space-y-3">
            <p className="text-ui-medium first-letter:uppercase">
              {formatPeriodo(resultado.periodo, true)}
            </p>
            <dl className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-muted/50 p-3">
                <dt className="text-kicker">Generadas</dt>
                <dd className="text-section tabular-nums">{resultado.generadas}</dd>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <dt className="text-kicker">Ya existían</dt>
                <dd className="text-section tabular-nums">{resultado.ya_existian}</dd>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <dt className="text-kicker">Errores</dt>
                <dd
                  className={
                    resultado.errores.length > 0
                      ? "text-section tabular-nums text-destructive"
                      : "text-section tabular-nums"
                  }
                >
                  {resultado.errores.length}
                </dd>
              </div>
            </dl>
            {resultado.errores.length > 0 ? (
              <ul className="space-y-2">
                {resultado.errores.map((error) => (
                  <li key={error.contrato_id} className="rounded-lg bg-destructive/10 px-3 py-2">
                    <Link
                      to={`/contratos/${error.contrato_id}`}
                      className="text-ui-medium underline-offset-4 hover:underline"
                      onClick={cerrar}
                    >
                      Ver contrato
                    </Link>
                    <p className="text-kicker">{error.detalle}</p>
                  </li>
                ))}
              </ul>
            ) : null}
            <DialogFooter>
              <Button type="button" onClick={cerrar}>
                Listo
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              void generar()
            }}
          >
            <div className="flex flex-col gap-2 sm:max-w-48">
              <Label htmlFor="generar-mes">Mes</Label>
              <Input
                id="generar-mes"
                type="month"
                value={mes}
                onChange={(event) => setMes(event.target.value)}
                disabled={enviando}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={cerrar}>
                Cancelar
              </Button>
              <Button type="submit" disabled={enviando}>
                {enviando ? "Generando…" : "Generar"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
