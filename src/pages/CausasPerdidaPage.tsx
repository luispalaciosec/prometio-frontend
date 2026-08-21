import { useEffect, useState } from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
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
  deleteCausaPerdida,
  listCausasPerdida,
  upsertCausaPerdida,
} from "@/lib/config-api"
import { useAuthStore } from "@/store/auth-store"
import type { CausaPerdida } from "@/types/causa-perdida"

type Draft = { id?: string; nombre: string }

export function CausasPerdidaPage() {
  const perfil = useAuthStore((state) => state.perfil)
  const [rows, setRows] = useState<CausaPerdida[]>([])
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>({ nombre: "" })

  async function reload() {
    setRows(await listCausasPerdida())
  }

  useEffect(() => {
    void reload()
  }, [])

  async function save() {
    if (!draft.nombre.trim()) {
      toast.error("nombre es obligatorio.")
      return
    }
    await upsertCausaPerdida({
      id: draft.id,
      organizacion_id: perfil?.organizacion_id ?? MOCK_ORGANIZACION_ID,
      nombre: draft.nombre.trim(),
    })
    toast.success("Causa guardada.")
    setOpen(false)
    await reload()
  }

  return (
    <>
      <PageHeader
        title="Causas de pérdida"
        description="Catálogo para Cierre Perdido (principal + secundaria). «Competencia» habilita competidor_mencionado."
        action={
          <Button
            onClick={() => {
              setDraft({ nombre: "" })
              setOpen(true)
            }}
          >
            Nueva causa
          </Button>
        }
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>nombre</TableHead>
            <TableHead className="w-40" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.nombre}</TableCell>
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void deleteCausaPerdida(row.id).then(async () => {
                      toast.success("Causa eliminada.")
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft.id ? "Editar causa" : "Nueva causa"}</DialogTitle>
          </DialogHeader>
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
