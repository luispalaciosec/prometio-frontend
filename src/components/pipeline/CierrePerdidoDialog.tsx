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
import type { CausaPerdida } from "@/types/causa-perdida"

const SIN_SECUNDARIA = "none"

export function CierrePerdidoDialog({
  open,
  causas,
  onConfirm,
  onCancel,
}: {
  open: boolean
  causas: CausaPerdida[]
  onConfirm: (input: {
    causa_perdida_principal_id: string
    causa_perdida_secundaria_id: string | null
  }) => void
  onCancel: () => void
}) {
  const [principal, setPrincipal] = useState("")
  const [secundaria, setSecundaria] = useState(SIN_SECUNDARIA)

  function reset() {
    setPrincipal("")
    setSecundaria(SIN_SECUNDARIA)
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cierre Perdido</DialogTitle>
          <DialogDescription>
            La tarjeta no se mueve hasta que confirmes la causa principal.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="causa-principal">Causa principal</Label>
            <Select value={principal || undefined} onValueChange={setPrincipal}>
              <SelectTrigger id="causa-principal">
                <SelectValue placeholder="Selecciona una causa" />
              </SelectTrigger>
              <SelectContent>
                {causas.map((causa) => (
                  <SelectItem key={causa.id} value={causa.id}>
                    {causa.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="causa-secundaria">Causa secundaria (opcional)</Label>
            <Select value={secundaria} onValueChange={setSecundaria}>
              <SelectTrigger id="causa-secundaria">
                <SelectValue placeholder="Ninguna" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SIN_SECUNDARIA}>Ninguna</SelectItem>
                {causas
                  .filter((causa) => causa.id !== principal)
                  .map((causa) => (
                    <SelectItem key={causa.id} value={causa.id}>
                      {causa.nombre}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
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
            disabled={principal.trim() === ""}
            onClick={() => {
              onConfirm({
                causa_perdida_principal_id: principal,
                causa_perdida_secundaria_id:
                  secundaria === SIN_SECUNDARIA ? null : secundaria,
              })
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
