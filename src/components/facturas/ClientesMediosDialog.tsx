import { useEffect, useState } from "react"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiError } from "@/lib/api-client"
import { createClienteMedios, deleteClienteMedios, listClientesMedios } from "@/lib/config-api"
import type { ClienteMedios } from "@/types/cliente-medios"

export function ClientesMediosDialog({
  open,
  onOpenChange,
  onChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onChange?: () => void
}) {
  const [rows, setRows] = useState<ClienteMedios[] | null>(null)
  const [ruc, setRuc] = useState("")
  const [nombre, setNombre] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)

  async function reload() {
    setRows(await listClientesMedios())
  }

  useEffect(() => {
    if (!open) {
      return
    }
    setRows(null)
    void reload().catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar los clientes de medios.")
    })
  }, [open])

  async function agregar(event: React.FormEvent) {
    event.preventDefault()
    setGuardando(true)
    try {
      await createClienteMedios({ ruc: ruc.trim(), nombre: nombre.trim() })
      setRuc("")
      setNombre("")
      await reload()
      onChange?.()
      toast.success("Cliente de medios agregado.")
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "No se pudo agregar.")
    } finally {
      setGuardando(false)
    }
  }

  async function quitar(id: string) {
    setEliminandoId(id)
    try {
      await deleteClienteMedios(id)
      await reload()
      onChange?.()
      toast.success("Cliente quitado de medios.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar.")
    } finally {
      setEliminandoId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Clientes de medios</DialogTitle>
          <DialogDescription>
            Facturas emitidas a estos RUC se suman en “Facturación medios”. Hoy solo Audela debería estar acá.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-3 border-b border-border pb-4" onSubmit={(event) => void agregar(event)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="medios-ruc">RUC</Label>
              <Input
                id="medios-ruc"
                value={ruc}
                onChange={(event) => setRuc(event.target.value)}
                placeholder="099…"
                className="h-9"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="medios-nombre">Nombre</Label>
              <Input
                id="medios-nombre"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Razón social"
                className="h-9"
                required
              />
            </div>
          </div>
          <Button type="submit" size="sm" disabled={guardando}>
            {guardando ? <Loader2 className="size-4 animate-spin" /> : null}
            Agregar
          </Button>
        </form>

        {rows == null ? (
          <p className="text-kicker text-muted-foreground">Cargando…</p>
        ) : rows.length === 0 ? (
          <p className="text-kicker text-muted-foreground">Todavía no hay clientes de medios.</p>
        ) : (
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-ui-medium">{row.nombre}</p>
                  <p className="text-micro text-muted-foreground">{row.ruc}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={eliminandoId === row.id}
                  aria-label={`Quitar ${row.nombre}`}
                  onClick={() => void quitar(row.id)}
                >
                  {eliminandoId === row.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" strokeWidth={1.75} />
                  )}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
