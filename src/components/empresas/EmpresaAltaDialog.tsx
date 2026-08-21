import { useEffect, useState } from "react"

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
import type { EmpresaCreate } from "@/types/empresa"

const VACIO: EmpresaCreate = { nombre: "", web: "", direccion: "", ruc: "" }

export function EmpresaAltaDialog({
  open,
  enviando,
  onConfirm,
  onCancel,
}: {
  open: boolean
  enviando: boolean
  onConfirm: (input: EmpresaCreate) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<EmpresaCreate>(VACIO)

  useEffect(() => {
    if (open) {
      setDraft(VACIO)
    }
  }, [open])

  function reset() {
    setDraft(VACIO)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          if (enviando) {
            return
          }
          reset()
          onCancel()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva empresa</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="emp-nombre">Nombre</Label>
            <Input
              id="emp-nombre"
              value={draft.nombre}
              onChange={(event) => setDraft((prev) => ({ ...prev, nombre: event.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="emp-web">Web</Label>
            <Input
              id="emp-web"
              value={draft.web ?? ""}
              onChange={(event) => setDraft((prev) => ({ ...prev, web: event.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="emp-dir">Dirección</Label>
            <Input
              id="emp-dir"
              value={draft.direccion ?? ""}
              onChange={(event) => setDraft((prev) => ({ ...prev, direccion: event.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="emp-ruc">RUC</Label>
            <Input
              id="emp-ruc"
              value={draft.ruc ?? ""}
              onChange={(event) => setDraft((prev) => ({ ...prev, ruc: event.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={enviando}
            onClick={() => {
              reset()
              onCancel()
            }}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={enviando || draft.nombre.trim() === ""}
            onClick={() => onConfirm(draft)}
          >
            {enviando ? "Creando…" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
