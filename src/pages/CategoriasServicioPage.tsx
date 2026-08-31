import { useEffect, useState } from "react"
import { toast } from "sonner"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { TableSkeleton } from "@/components/skeleton"
import { ApiError } from "@/lib/api-client"
import { FolderTree } from "lucide-react"
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
import {
  MOCK_ORGANIZACION_ID,
  deleteCategoriaServicio,
  listCategoriasServicio,
  upsertCategoriaServicio,
} from "@/lib/config-api"
import { useAuthStore } from "@/store/auth-store"
import type { CategoriaServicio } from "@/types/categoria-servicio"

type Draft = { id?: string; nombre: string }

export function CategoriasServicioPage() {
  const perfil = useAuthStore((state) => state.perfil)
  const [rows, setRows] = useState<CategoriaServicio[] | null>(null)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>({ nombre: "" })

  async function reload() {
    setRows(await listCategoriasServicio())
  }

  useEffect(() => {
    void reload()
  }, [])

  async function save() {
    if (!draft.nombre.trim()) {
      toast.error("El nombre es obligatorio.")
      return
    }
    await upsertCategoriaServicio({
      id: draft.id,
      organizacion_id: perfil?.organizacion_id ?? MOCK_ORGANIZACION_ID,
      nombre: draft.nombre.trim(),
    })
    toast.success("Categoría guardada.")
    setOpen(false)
    await reload()
  }

  async function remove(id: string) {
    try {
      await deleteCategoriaServicio(id)
      toast.success("Categoría eliminada.")
      await reload()
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        toast.error(error.detail)
        return
      }
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar la categoría.")
    }
  }

  return (
    <>
      <PageHeader
        title="Categorías de servicio"
        description="Catálogo para clasificar servicios. No se puede borrar una categoría que ya tenga servicios asignados."
        action={
          <Button
            onClick={() => {
              setDraft({ nombre: "" })
              setOpen(true)
            }}
          >
            Nueva categoría
          </Button>
        }
      />
      {rows == null ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="Sin categorías"
          body="Creá categorías acá y asignalas desde el wizard de cada servicio."
          action={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraft({ nombre: "" })
                setOpen(true)
              }}
            >
              Nueva categoría
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="w-40" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-ui-medium">{row.nombre}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDraft({ id: row.id, nombre: row.nombre })
                      setOpen(true)
                    }}
                  >
                    Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => void remove(row.id)}>
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
            <DialogTitle>{draft.id ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={draft.nombre}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, nombre: event.target.value }))
              }
            />
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
