import { useEffect, useState } from "react"
import { toast } from "sonner"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { TarifaModeloMark } from "@/components/tarifas/TarifaModeloMark"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
import { etiquetaCostoTarifa, modeloTarifa } from "@/lib/costo-interno"
import { useAuthStore } from "@/store/auth-store"
import {
  COSTO_TARIFA_CAMPO,
  COSTO_TARIFA_LABELS,
  MODELO_TARIFA_LABELS,
  MODELOS_TARIFA,
  type ModeloTarifa,
  type TarifaInterna,
} from "@/types/tarifa-interna"

type Draft = {
  id?: string
  nombre_rol: string
  modelo: ModeloTarifa
  costo: string
}

const emptyDraft: Draft = { nombre_rol: "", modelo: "por_hora", costo: "" }

const MODELO_AYUDA: Record<ModeloTarifa, string> = {
  por_hora: "La cantidad en el wizard son horas.",
  por_sueldo: "La cantidad en el wizard es % del mes (0–100).",
  por_evento: "La cantidad en el wizard es cuántas veces se ejecuta.",
}

const COSTO_AYUDA: Record<ModeloTarifa, string> = {
  por_hora: "Costo interno por hora en USD. No es el precio al cliente.",
  por_sueldo: "Sueldo interno mensual del rol en USD. El wizard lo prorratea con las horas laborales del mes.",
  por_evento: "Costo interno cada vez que el rol entra en el servicio. No es el precio al cliente.",
}

function costoDeFila(row: TarifaInterna): string {
  const campo = COSTO_TARIFA_CAMPO[modeloTarifa(row)]
  const valor = row[campo]
  return valor == null ? "" : String(valor)
}

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
      modelo: modeloTarifa(row),
      costo: costoDeFila(row),
    })
    setOpen(true)
  }

  async function save() {
    const costo = Number(draft.costo)
    if (!draft.nombre_rol.trim() || Number.isNaN(costo)) {
      toast.error("El nombre del rol y el costo del modelo elegido son obligatorios.")
      return
    }
    const campo = COSTO_TARIFA_CAMPO[draft.modelo]
    await upsertTarifaInterna({
      id: draft.id,
      organizacion_id: perfil?.organizacion_id ?? MOCK_ORGANIZACION_ID,
      nombre_rol: draft.nombre_rol.trim(),
      modelo: draft.modelo,
      costo_hora: campo === "costo_hora" ? costo : null,
      costo_mensual: campo === "costo_mensual" ? costo : null,
      costo_evento: campo === "costo_evento" ? costo : null,
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
        description="Costo interno por rol: por hora, por sueldo o por evento. Nunca se costea por persona nombrada."
        action={<Button onClick={startCreate}>Nueva tarifa</Button>}
      />
      {rows.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Sin tarifas"
          body="El costeo interno usa roles, nunca personas. Creá la primera tarifa y elegí su modelo."
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
              <TableHead>Modelo</TableHead>
              <TableHead>Costo</TableHead>
              <TableHead className="w-40" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-ui-medium">{row.nombre_rol}</TableCell>
                <TableCell>
                  <TarifaModeloMark modelo={modeloTarifa(row)} />
                </TableCell>
                <TableCell className="text-ui tabular-nums">{etiquetaCostoTarifa(row)}</TableCell>
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
              <Label>Modelo</Label>
              <RadioGroup
                value={draft.modelo}
                onValueChange={(value) =>
                  setDraft((prev) => ({ ...prev, modelo: value as ModeloTarifa }))
                }
                className="gap-3"
              >
                {MODELOS_TARIFA.map((value) => (
                  <label key={value} className="flex items-start gap-2 text-ui">
                    <RadioGroupItem value={value} id={`modelo-${value}`} className="mt-0.5" />
                    <span>
                      {MODELO_TARIFA_LABELS[value]}
                      <span className="mt-1 block text-kicker">{MODELO_AYUDA[value]}</span>
                    </span>
                  </label>
                ))}
              </RadioGroup>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="costo_tarifa">{COSTO_TARIFA_LABELS[draft.modelo]}</Label>
              <Input
                id="costo_tarifa"
                type="number"
                min="0"
                step="0.01"
                value={draft.costo}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, costo: event.target.value }))
                }
              />
              <p className="text-kicker">{COSTO_AYUDA[draft.modelo]}</p>
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
