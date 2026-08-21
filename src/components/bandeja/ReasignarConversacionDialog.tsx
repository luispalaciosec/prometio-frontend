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
import type { Conversacion } from "@/types/conversacion"
import type { Perfil } from "@/types/perfil"

export function ReasignarConversacionDialog({
  open,
  conversacion,
  perfiles,
  onConfirm,
  onCancel,
}: {
  open: boolean
  conversacion: Conversacion | null
  perfiles: Perfil[]
  onConfirm: (nuevo_asignado_a: string) => void
  onCancel: () => void
}) {
  const [destinoId, setDestinoId] = useState("")

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setDestinoId("")
          onCancel()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reasignar conversación</DialogTitle>
          <DialogDescription>
            {conversacion
              ? conversacion.remitente_nombre ?? conversacion.remitente_identificador ?? "Sin nombre"
              : "Elige un perfil activo de ventas o marketing."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="nuevo-asignado">Asignar a</Label>
          <Select value={destinoId || undefined} onValueChange={setDestinoId}>
            <SelectTrigger id="nuevo-asignado">
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
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDestinoId("")
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
              setDestinoId("")
            }}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
