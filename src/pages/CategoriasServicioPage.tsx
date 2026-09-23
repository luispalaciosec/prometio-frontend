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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { PILAR_LABELS, type Pilar } from "@/types/servicio"

const PILARES: Pilar[] = ["marca", "crecimiento", "transformacion", "transversal"]

const SIN_PILAR = "__sin_pilar__"

type Draft = { id?: string; nombre: string; pilar: Pilar | null }

function etiquetaPilar(pilar: Pilar | null): string {
  return pilar ? PILAR_LABELS[pilar] : "Sin pilar"
}

export function CategoriasServicioPage() {
  const perfil = useAuthStore((state) => state.perfil)
  const [rows, setRows] = useState<CategoriaServicio[] | null>(null)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>({ nombre: "", pilar: null })

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
    if (!draft.id && draft.pilar == null) {
      toast.error("Elegí un pilar para la categoría nueva.")
      return
    }
    try {
      await upsertCategoriaServicio({
        id: draft.id,
        organizacion_id: perfil?.organizacion_id ?? MOCK_ORGANIZACION_ID,
        nombre: draft.nombre.trim(),
        pilar: draft.pilar,
      })
      toast.success("Categoría guardada.")
      setOpen(false)
      await reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la categoría.")
    }
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
        description="Catálogo comercial para servicios, líneas a medida y oportunidades. Cada categoría pertenece a un pilar de negocio."
        action={
          <Button
            onClick={() => {
              setDraft({ nombre: "", pilar: null })
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
                setDraft({ nombre: "", pilar: null })
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
              <TableHead>Pilar</TableHead>
              <TableHead className="w-40" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-ui-medium">{row.nombre}</TableCell>
                <TableCell className="text-ui text-muted-foreground">
                  {etiquetaPilar(row.pilar)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDraft({ id: row.id, nombre: row.nombre, pilar: row.pilar })
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
          <div className="flex flex-col gap-4">
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="pilar">
                Pilar{draft.id ? "" : " (obligatorio)"}
              </Label>
              <Select
                value={draft.pilar ?? SIN_PILAR}
                onValueChange={(value) =>
                  setDraft((prev) => ({
                    ...prev,
                    pilar: value === SIN_PILAR ? null : (value as Pilar),
                  }))
                }
              >
                <SelectTrigger id="pilar">
                  <SelectValue placeholder="Elegir pilar" />
                </SelectTrigger>
                <SelectContent>
                  {draft.id ? (
                    <SelectItem value={SIN_PILAR}>Sin pilar</SelectItem>
                  ) : null}
                  {PILARES.map((pilar) => (
                    <SelectItem key={pilar} value={pilar}>
                      {PILAR_LABELS[pilar]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {draft.id ? (
                <p className="text-kicker text-muted-foreground">
                  Las categorías heredadas pueden mostrar «Sin pilar» hasta que las clasifiques acá.
                </p>
              ) : null}
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
