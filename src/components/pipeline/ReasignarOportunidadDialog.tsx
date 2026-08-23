import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { OportunidadKanban } from "@/types/oportunidad"
import type { Perfil } from "@/types/perfil"

export function ReasignarOportunidadDialog({
  open,
  oportunidad,
  perfiles,
  onConfirm,
  onCancel,
}: {
  open: boolean
  oportunidad: OportunidadKanban | null
  perfiles: Perfil[]
  onConfirm: (nuevo_ejecutivo_id: string) => void
  onCancel: () => void
}) {
  const [destinoId, setDestinoId] = useState("")

  function reset() {
    setDestinoId("")
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset()
          onCancel()
        }
      }}
    >
      <DialogContent className="rounded-2xl shadow-modal">
        <DialogHeader>
          <DialogTitle>Reasignar ejecutivo</DialogTitle>
          <DialogDescription>
            {oportunidad
              ? `${oportunidad.contacto.nombre_completo} · ${oportunidad.empresa.nombre}`
              : "Elige un perfil activo de ventas o administrativo."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="nuevo-ejecutivo">Ejecutivo</Label>
          <Select value={destinoId || undefined} onValueChange={setDestinoId}>
            <SelectTrigger id="nuevo-ejecutivo">
              <SelectValue placeholder="Selecciona un perfil" />
            </SelectTrigger>
            <SelectContent>
              {perfiles.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.nombre_completo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter className="rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              reset()
              onCancel()
            }}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={destinoId.trim() === ""}
            onClick={() => {
              onConfirm(destinoId)
              reset()
            }}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
