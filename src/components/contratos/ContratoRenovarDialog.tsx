import { useEffect, useState } from "react"
import { toast } from "sonner"

import { ContratoLineasEditor } from "@/components/contratos/ContratoLineasEditor"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { renovarContrato } from "@/lib/api/contrato-recurrente"
import {
  lineasBorradorDesde,
  validarLineasBorrador,
  type ContratoLineaBorrador,
} from "@/lib/contrato-lineas-borrador"
import { formatDateOnly } from "@/lib/datetime-local"
import type { CategoriaServicio } from "@/types/categoria-servicio"
import type { ContratoRecurrente, ContratoRecurrenteDetalle } from "@/types/contrato-recurrente"
import type { Servicio } from "@/types/servicio"

/** Un año más desde la fecha de fin actual. */
function sugerirFechaFin(fechaFin: string): string {
  const [year, month, day] = fechaFin.split("-")
  return `${Number(year) + 1}-${month}-${day}`
}

export function ContratoRenovarDialog({
  contrato,
  servicios,
  categorias,
  onRenovado,
  onCancel,
}: {
  /** null = cerrado. */
  contrato: ContratoRecurrente | null
  servicios: Servicio[]
  categorias: CategoriaServicio[]
  onRenovado: (contrato: ContratoRecurrenteDetalle) => void
  onCancel: () => void
}) {
  const [fechaFinNueva, setFechaFinNueva] = useState("")
  const [cambiarMontos, setCambiarMontos] = useState(false)
  const [lineas, setLineas] = useState<ContratoLineaBorrador[]>([])
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!contrato) {
      return
    }
    setFechaFinNueva(sugerirFechaFin(contrato.fecha_fin))
    setCambiarMontos(false)
    setLineas(lineasBorradorDesde(contrato.lineas))
  }, [contrato])

  async function guardar() {
    if (!contrato) {
      return
    }
    if (!fechaFinNueva || fechaFinNueva <= contrato.fecha_fin) {
      toast.error(`La nueva fecha de fin tiene que ser posterior al ${formatDateOnly(contrato.fecha_fin)}.`)
      return
    }
    let lineasNuevas = null
    if (cambiarMontos) {
      const validadas = validarLineasBorrador(lineas)
      if ("error" in validadas) {
        toast.error(validadas.error)
        return
      }
      lineasNuevas = validadas.lineas
    }
    setEnviando(true)
    try {
      const renovado = await renovarContrato(contrato.id, {
        fecha_fin_nueva: fechaFinNueva,
        lineas: lineasNuevas,
      })
      toast.success(`Contrato renovado hasta el ${formatDateOnly(renovado.fecha_fin)}.`)
      onRenovado(renovado)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo renovar el contrato.")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog
      open={contrato != null}
      onOpenChange={(next) => {
        if (!next) {
          onCancel()
        }
      }}
    >
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            void guardar()
          }}
        >
          <DialogHeader>
            <DialogTitle>Renovar contrato</DialogTitle>
            <DialogDescription>
              {contrato
                ? `${contrato.nombre} · hoy vence el ${formatDateOnly(contrato.fecha_fin)}.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 sm:max-w-56">
            <Label htmlFor="renovar-fecha-fin">Nueva fecha de fin</Label>
            <Input
              id="renovar-fecha-fin"
              type="date"
              value={fechaFinNueva}
              min={contrato?.fecha_fin}
              onChange={(event) => setFechaFinNueva(event.target.value)}
              disabled={enviando}
            />
          </div>
          <label className="flex items-center gap-2 text-ui">
            <Checkbox
              checked={cambiarMontos}
              onCheckedChange={(value) => setCambiarMontos(value === true)}
              disabled={enviando}
            />
            Cambiar líneas o montos al renovar
          </label>
          {cambiarMontos ? (
            <ContratoLineasEditor
              lineas={lineas}
              onChange={setLineas}
              servicios={servicios}
              categorias={categorias}
              disabled={enviando}
            />
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando}>
              Renovar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
