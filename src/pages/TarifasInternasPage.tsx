import { useEffect, useState } from "react"
import { toast } from "sonner"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { Clock } from "lucide-react"
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
  deleteTarifaInterna,
  listTarifasInternas,
  upsertTarifaInterna,
} from "@/lib/config-api"
import { formatMoney } from "@/lib/costo-interno"
import { useAuthStore } from "@/store/auth-store"
import type { TarifaInterna } from "@/types/tarifa-interna"

type Draft = { id?: string; nombre_rol: string; costo_hora: string }

const emptyDraft: Draft = { nombre_rol: "", costo_hora: "" }

export function TarifasInternasPage() {
  const perfil = useAuthStore((state) => state.perfil)
  const [rows, setRows] = useState<TarifaInterna[]>([])
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(emptyDraft)

  async function reload() {
    setRows(await listTarifasInternas())
  }

  useEffect(() => {
    void reload()
  }, [])

  function startCreate() {
    setDraft(emptyDraft)
    setOpen(true)
  }

  function startEdit(row: TarifaInterna) {
    setDraft({
      id: row.id,
      nombre_rol: row.nombre_rol,
      costo_hora: String(row.costo_hora),
    })
    setOpen(true)
  }

  async function save() {
    const costo_hora = Number(draft.costo_hora)
    if (!draft.nombre_rol.trim() || Number.isNaN(costo_hora)) {
      toast.error("El nombre del rol y el costo por hora son obligatorios.")
      return
    }
    await upsertTarifaInterna({
      id: draft.id,
      organizacion_id: perfil?.organizacion_id ?? MOCK_ORGANIZACION_ID,
      nombre_rol: draft.nombre_rol.trim(),
      costo_hora,
    })
    toast.success("Tarifa guardada.")
    setOpen(false)
    await reload()
  }

  async function remove(id: string) {
    await deleteTarifaInterna(id)
    toast.success("Tarifa eliminada.")
    await reload()
  }

  return (
    <>
      <PageHeader
        title="Tarifas internas"
        description="Costo por hora de cada rol. Nunca se costea por persona nombrada."
        action={<Button onClick={startCreate}>Nueva tarifa</Button>}
      />
      {rows.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Sin tarifas"
          body="El costeo interno usa roles, nunca personas. Creá la primera tarifa por hora."
          action={
            <Button type="button" variant="ghost" size="sm" onClick={startCreate}>
              Nueva tarifa
            </Button>
          }
        />
      ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rol</TableHead>
            <TableHead>Costo por hora</TableHead>
            <TableHead className="w-40" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="text-ui-medium">{row.nombre_rol}</TableCell>
              <TableCell>{formatMoney(row.costo_hora)}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => startEdit(row)}>
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
            <DialogTitle>{draft.id ? "Editar tarifa" : "Nueva tarifa"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nombre_rol">Nombre del rol</Label>
              <Input
                id="nombre_rol"
                value={draft.nombre_rol}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, nombre_rol: event.target.value }))
                }
              />
              <p className="text-kicker">Se costea por rol (ej. Diseñador), nunca por una persona.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="costo_hora">Costo por hora</Label>
              <Input
                id="costo_hora"
                type="number"
                min="0"
                step="0.01"
                value={draft.costo_hora}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, costo_hora: event.target.value }))
                }
              />
              <p className="text-kicker">Costo interno en USD. No es el precio al cliente.</p>
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
