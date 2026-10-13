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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function MarcarFacturadaDialog({
  open,
  cotizacionNumero,
  enviando,
  onConfirm,
  onCancel,
}: {
  open: boolean
  cotizacionNumero: string | null
  enviando?: boolean
  onConfirm: (numeroFactura: string) => void
  onCancel: () => void
}) {
  const [numero, setNumero] = useState("")

  function cerrar() {
    setNumero("")
    onCancel()
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
      <DialogContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (numero.trim()) {
              onConfirm(numero.trim())
              setNumero("")
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Marcar facturada</DialogTitle>
            <DialogDescription>
              {cotizacionNumero
                ? `${cotizacionNumero} pasa a facturada. Este cambio no se deshace.`
                : "La cotización pasa a facturada. Este cambio no se deshace."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="numero-factura">Número de factura</Label>
            <Input
              id="numero-factura"
              value={numero}
              onChange={(event) => setNumero(event.target.value)}
              placeholder="001-001-000001234"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={cerrar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando || numero.trim() === ""}>
              Marcar facturada
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
