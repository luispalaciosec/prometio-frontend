import { useEffect, useState } from "react"
import { toast } from "sonner"

import { ContratoLineasEditor } from "@/components/contratos/ContratoLineasEditor"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { reemplazarLineasContrato } from "@/lib/api/contrato-recurrente"
import {
  lineasBorradorDesde,
  validarLineasBorrador,
  type ContratoLineaBorrador,
} from "@/lib/contrato-lineas-borrador"
import type { CategoriaServicio } from "@/types/categoria-servicio"
import type { ContratoRecurrente, ContratoRecurrenteDetalle } from "@/types/contrato-recurrente"
import type { Servicio } from "@/types/servicio"

export function ContratoLineasDialog({
  contrato,
  servicios,
  categorias,
  onGuardado,
  onCancel,
}: {
  contrato: ContratoRecurrente | null
  servicios: Servicio[]
  categorias: CategoriaServicio[]
  onGuardado: (contrato: ContratoRecurrenteDetalle) => void
  onCancel: () => void
}) {
  const [lineas, setLineas] = useState<ContratoLineaBorrador[]>([])
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (contrato) {
      setLineas(lineasBorradorDesde(contrato.lineas))
    }
  }, [contrato])

  async function guardar() {
    if (!contrato) {
      return
    }
    const validadas = validarLineasBorrador(lineas)
    if ("error" in validadas) {
      toast.error(validadas.error)
      return
    }
    setEnviando(true)
    try {
      onGuardado(await reemplazarLineasContrato(contrato.id, validadas.lineas))
      toast.success("Líneas actualizadas.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron guardar las líneas.")
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
            <DialogTitle>Editar líneas</DialogTitle>
            <DialogDescription>
              Solo cambia los meses que todavía no se generaron. Las cotizaciones ya creadas quedan
              como están.
            </DialogDescription>
          </DialogHeader>
          <ContratoLineasEditor
            lineas={lineas}
            onChange={setLineas}
            servicios={servicios}
            categorias={categorias}
            disabled={enviando}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando}>
              Guardar líneas
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
