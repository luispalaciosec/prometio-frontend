import { useEffect, useState } from "react"
import { toast } from "sonner"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { FileText } from "lucide-react"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  MOCK_ORGANIZACION_ID,
  deleteTipoDocumento,
  listTiposDocumento,
  upsertTipoDocumento,
} from "@/lib/config-api"
import { useAuthStore } from "@/store/auth-store"
import type { TipoDocumento } from "@/types/tipo-documento"

type Draft = { id?: string; nombre: string; plantilla_base: string }

export function TiposDocumentoPage() {
  const perfil = useAuthStore((state) => state.perfil)
  const [rows, setRows] = useState<TipoDocumento[]>([])
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>({ nombre: "", plantilla_base: "" })

  async function reload() {
    setRows(await listTiposDocumento())
  }

  useEffect(() => {
    void reload()
  }, [])

  async function save() {
    if (!draft.nombre.trim()) {
      toast.error("nombre es obligatorio.")
      return
    }
    await upsertTipoDocumento({
      id: draft.id,
      organizacion_id: perfil?.organizacion_id ?? MOCK_ORGANIZACION_ID,
      nombre: draft.nombre.trim(),
      plantilla_base: draft.plantilla_base.trim() || null,
    })
    toast.success("Tipo de documento guardado.")
    setOpen(false)
    await reload()
  }

  return (
    <>
      <PageHeader
        title="Tipos de documento"
        description="Catálogo abierto. El wizard de servicio puede crear uno nuevo sin salir."
        action={
          <Button
            onClick={() => {
              setDraft({ nombre: "", plantilla_base: "" })
              setOpen(true)
            }}
          >
            Nuevo tipo
          </Button>
        }
      />
      {rows.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Sin tipos"
          body="El wizard de servicio puede crear uno nuevo sin salir. También se cargan acá."
          action={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraft({ nombre: "", plantilla_base: "" })
                setOpen(true)
              }}
            >
              Nuevo tipo
            </Button>
          }
        />
      ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>nombre</TableHead>
            <TableHead>plantilla_base</TableHead>
            <TableHead className="w-40" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="text-ui-medium">{row.nombre}</TableCell>
              <TableCell className="text-muted-foreground">
                {row.plantilla_base ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDraft({
                      id: row.id,
                      nombre: row.nombre,
                      plantilla_base: row.plantilla_base ?? "",
                    })
                    setOpen(true)
                  }}
                >
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void deleteTipoDocumento(row.id).then(async () => {
                      toast.success("Tipo eliminado.")
                      await reload()
                    })
                  }}
                >
                  Eliminar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft.id ? "Editar tipo" : "Nuevo tipo"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nombre">nombre</Label>
              <Input
                id="nombre"
                value={draft.nombre}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, nombre: event.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="plantilla_base">plantilla_base</Label>
              <Textarea
                id="plantilla_base"
                value={draft.plantilla_base}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, plantilla_base: event.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void save()}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
