import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
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
import {
  etiquetaContacto,
  etiquetaEmpresa,
  listOportunidadesLookup,
} from "@/lib/api/oportunidad"

export function DuplicarCotizacionDialog({
  open,
  enviando,
  onConfirm,
  onCancel,
}: {
  open: boolean
  enviando: boolean
  onConfirm: (oportunidadIdDestino: string) => void
  onCancel: () => void
}) {
  const [opciones, setOpciones] = useState<{ id: string; label: string }[]>([])
  const [destinoId, setDestinoId] = useState("")

  useEffect(() => {
    if (!open) {
      setDestinoId("")
      return
    }
    void listOportunidadesLookup()
      .then((rows) => {
        setOpciones(
          rows
            .filter((row) => row.activo)
            .map((row) => ({
              id: row.id,
              label: `${etiquetaContacto(row.contacto_id)} · ${etiquetaEmpresa(row.empresa_id)}`,
            })),
        )
      })
      .catch(() => setOpciones([]))
  }, [open])

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !enviando && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Duplicar como plantilla</DialogTitle>
        </DialogHeader>
        <p className="text-kicker">
          Copia todas las líneas a una cotización nueva en borrador sobre otra oportunidad. No es
          una nueva versión de la misma negociación.
        </p>
        <div className="flex flex-col gap-2">
          <Label htmlFor="dup-opp">Oportunidad destino</Label>
          <Select value={destinoId || undefined} onValueChange={setDestinoId}>
            <SelectTrigger id="dup-opp">
              <SelectValue placeholder="Elegí oportunidad" />
            </SelectTrigger>
            <SelectContent>
              {opciones.map((row) => (
                <SelectItem key={row.id} value={row.id}>
                  {row.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={enviando} onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!destinoId || enviando}
            onClick={() => onConfirm(destinoId)}
          >
            {enviando ? "Duplicando…" : "Duplicar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
