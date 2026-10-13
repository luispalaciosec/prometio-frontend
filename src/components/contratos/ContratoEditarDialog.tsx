import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { updateContrato } from "@/lib/api/contrato-recurrente"
import { listContactos } from "@/lib/api/contacto"
import type { Contacto } from "@/types/contacto"
import type { ContratoRecurrente, ContratoRecurrenteDetalle } from "@/types/contrato-recurrente"

export function ContratoEditarDialog({
  contrato,
  onGuardado,
  onCancel,
}: {
  contrato: ContratoRecurrente | null
  onGuardado: (contrato: ContratoRecurrenteDetalle) => void
  onCancel: () => void
}) {
  const [contactos, setContactos] = useState<Contacto[]>([])
  const [nombre, setNombre] = useState("")
  const [contactoId, setContactoId] = useState("")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [notas, setNotas] = useState("")
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!contrato) {
      return
    }
    setNombre(contrato.nombre)
    setContactoId(contrato.contacto_id)
    setFechaInicio(contrato.fecha_inicio)
    setFechaFin(contrato.fecha_fin)
    setNotas(contrato.notas ?? "")
    let cancelled = false
    void listContactos({ empresa_id: contrato.empresa_id })
      .then((rows) => {
        if (!cancelled) {
          setContactos(rows)
        }
      })
      .catch(() => {
        /* el contacto actual sigue elegible aunque falle la lista */
      })
    return () => {
      cancelled = true
    }
  }, [contrato])

  async function guardar() {
    if (!contrato) {
      return
    }
    if (!nombre.trim()) {
      toast.error("El nombre no puede quedar vacío.")
      return
    }
    if (!fechaInicio || !fechaFin || fechaFin < fechaInicio) {
      toast.error("La fecha de fin no puede ser anterior a la de inicio.")
      return
    }
    setEnviando(true)
    try {
      onGuardado(
        await updateContrato(contrato.id, {
          nombre: nombre.trim(),
          contacto_id: contactoId,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          notas: notas.trim() || null,
        }),
      )
      toast.success("Contrato actualizado.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el contrato.")
    } finally {
      setEnviando(false)
    }
  }

  const opcionesContacto =
    contrato && !contactos.some((row) => row.id === contrato.contacto_id)
      ? [{ id: contrato.contacto_id, nombre_completo: contrato.contacto_nombre ?? "Contacto actual" }, ...contactos]
      : contactos

  return (
    <Dialog
      open={contrato != null}
      onOpenChange={(next) => {
        if (!next) {
          onCancel()
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            void guardar()
          }}
        >
          <DialogHeader>
            <DialogTitle>Editar contrato</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="editar-contrato-nombre">Nombre</Label>
              <Input
                id="editar-contrato-nombre"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                disabled={enviando}
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="editar-contrato-contacto">Contacto</Label>
              <Select value={contactoId} onValueChange={setContactoId} disabled={enviando}>
                <SelectTrigger id="editar-contrato-contacto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {opcionesContacto.map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.nombre_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="editar-contrato-inicio">Inicio</Label>
              <Input
                id="editar-contrato-inicio"
                type="date"
                value={fechaInicio}
                onChange={(event) => setFechaInicio(event.target.value)}
                disabled={enviando}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="editar-contrato-fin">Fin</Label>
              <Input
                id="editar-contrato-fin"
                type="date"
                value={fechaFin}
                min={fechaInicio || undefined}
                onChange={(event) => setFechaFin(event.target.value)}
                disabled={enviando}
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="editar-contrato-notas">Notas</Label>
              <Textarea
                id="editar-contrato-notas"
                value={notas}
                onChange={(event) => setNotas(event.target.value)}
                rows={3}
                disabled={enviando}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando}>
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
