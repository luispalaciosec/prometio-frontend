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
import { createProveedor } from "@/lib/api/proveedor"
import type { Proveedor } from "@/types/proveedor"

export function ProveedorQuickCreateDialog({
  open,
  nombreInicial,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  nombreInicial: string
  onOpenChange: (open: boolean) => void
  onCreated: (proveedor: Proveedor) => void
}) {
  const [nombre, setNombre] = useState(nombreInicial)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (open) {
      setNombre(nombreInicial)
    }
  }, [open, nombreInicial])

  async function submit() {
    const trimmed = nombre.trim()
    if (!trimmed) {
      toast.error("El nombre es obligatorio.")
      return
    }
    setGuardando(true)
    try {
      const row = await createProveedor({ nombre: trimmed })
      toast.success("Proveedor creado.")
      onCreated(row)
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el proveedor.")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo proveedor</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="proveedor-rapido-nombre">Nombre</Label>
          <Input
            id="proveedor-rapido-nombre"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                void submit()
              }
            }}
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled={guardando} onClick={() => void submit()}>
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
