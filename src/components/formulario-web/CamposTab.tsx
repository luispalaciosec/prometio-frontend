import { useEffect, useState } from "react"
import { ArrowDown, ArrowUp, FormInput } from "lucide-react"
import { toast } from "sonner"

import { EmptyState } from "@/components/empty-state"
import { TableSkeleton } from "@/components/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Textarea } from "@/components/ui/textarea"
import {
  createFormularioCampo,
  deleteFormularioCampo,
  listFormularioCampos,
  updateFormularioCampo,
} from "@/lib/api/formulario-config"
import type { FormularioCampo, TipoCampoFormulario } from "@/types/formulario-campo"

const CLAVE_RESERVADA = "nombre_completo"
const CLAVE_RE = /^[a-z][a-z0-9_]*$/

const TIPO_LABELS: Record<TipoCampoFormulario, string> = {
  texto: "Texto",
  email: "Email",
  telefono: "Teléfono",
  select: "Select",
  textarea: "Textarea",
}

type Draft = {
  id?: string
  clave: string
  tipo: TipoCampoFormulario
  etiqueta: string
  placeholder: string
  requerido: boolean
  activo: boolean
  opcionesTexto: string
  orden: string
}

function draftVacio(orden = 1): Draft {
  return {
    clave: "",
    tipo: "texto",
    etiqueta: "",
    placeholder: "",
    requerido: false,
    activo: true,
    opcionesTexto: "",
    orden: String(orden),
  }
}

function draftDesdeRow(row: FormularioCampo): Draft {
  return {
    id: row.id,
    clave: row.clave,
    tipo: row.tipo,
    etiqueta: row.etiqueta,
    placeholder: row.placeholder ?? "",
    requerido: row.requerido,
    activo: row.activo,
    opcionesTexto: row.opciones?.join("\n") ?? "",
    orden: String(row.orden),
  }
}

function parseOpciones(texto: string): string[] | null {
  const lineas = texto
    .split("\n")
    .map((linea) => linea.trim())
    .filter(Boolean)
  return lineas.length > 0 ? lineas : null
}

export function CamposTab() {
  const [rows, setRows] = useState<FormularioCampo[] | null>(null)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(() => draftVacio())
  const [guardando, setGuardando] = useState(false)
  const [reordenando, setReordenando] = useState(false)

  const campos = rows?.filter((row) => row.clave !== CLAVE_RESERVADA).sort((a, b) => a.orden - b.orden) ?? []

  async function reload() {
    setRows(await listFormularioCampos())
  }

  useEffect(() => {
    void reload()
  }, [])

  function abrirNuevo() {
    const nextOrden = campos.length > 0 ? Math.max(...campos.map((row) => row.orden)) + 1 : 1
    setDraft(draftVacio(nextOrden))
    setOpen(true)
  }

  async function save() {
    const clave = draft.clave.trim().toLowerCase()
    const etiqueta = draft.etiqueta.trim()
    const orden = Number(draft.orden)

    if (!draft.id) {
      if (!clave) {
        toast.error("La clave es obligatoria.")
        return
      }
      if (clave === CLAVE_RESERVADA) {
        toast.error(`"${CLAVE_RESERVADA}" está reservada para el campo fijo de nombre.`)
        return
      }
      if (!CLAVE_RE.test(clave)) {
        toast.error("La clave usa minúsculas, números y guión bajo (ej. producto_interes).")
        return
      }
    }

    if (!etiqueta) {
      toast.error("La etiqueta es obligatoria.")
      return
    }

    if (!Number.isFinite(orden) || orden < 1) {
      toast.error("El orden debe ser un número positivo.")
      return
    }

    const opciones = draft.tipo === "select" ? parseOpciones(draft.opcionesTexto) : null
    if (draft.tipo === "select" && !opciones) {
      toast.error("Agregá al menos una opción para el select.")
      return
    }

    setGuardando(true)
    try {
      if (draft.id) {
        await updateFormularioCampo(draft.id, {
          tipo: draft.tipo,
          etiqueta,
          placeholder: draft.placeholder.trim() || null,
          requerido: draft.requerido,
          activo: draft.activo,
          opciones,
          orden,
        })
        toast.success("Campo actualizado.")
      } else {
        await createFormularioCampo({
          clave,
          tipo: draft.tipo,
          etiqueta,
          placeholder: draft.placeholder.trim() || null,
          requerido: draft.requerido,
          activo: draft.activo,
          opciones,
          orden,
        })
        toast.success("Campo creado.")
      }
      setOpen(false)
      await reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el campo.")
    } finally {
      setGuardando(false)
    }
  }

  async function remove(id: string) {
    try {
      await deleteFormularioCampo(id)
      toast.success("Campo eliminado.")
      await reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el campo.")
    }
  }

  async function mover(id: string, direction: "up" | "down") {
    if (reordenando) {
      return
    }
    const sorted = [...campos]
    const idx = sorted.findIndex((row) => row.id === id)
    if (idx < 0) {
      return
    }
    const swapIdx = direction === "up" ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) {
      return
    }

    const actual = sorted[idx]
    const vecino = sorted[swapIdx]
    setReordenando(true)
    try {
      await Promise.all([
        updateFormularioCampo(actual.id, { orden: vecino.orden }),
        updateFormularioCampo(vecino.id, { orden: actual.orden }),
      ])
      await reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo reordenar.")
    } finally {
      setReordenando(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-prose text-kicker">
          <span className="text-ui-medium">Nombre completo</span> es fijo en el widget (siempre
          requerido). El resto lo define acá y lo consume{" "}
          <span className="font-mono text-micro">GET /formulario/campos</span>.
        </p>
        <Button type="button" onClick={abrirNuevo}>
          Agregar campo
        </Button>
      </div>

      {rows == null ? (
        <TableSkeleton />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Orden</TableHead>
              <TableHead>Etiqueta</TableHead>
              <TableHead>Clave</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Req.</TableHead>
              <TableHead>Activo</TableHead>
              <TableHead className="w-48 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-muted/30">
              <TableCell className="text-ui text-muted-foreground">—</TableCell>
              <TableCell className="text-ui-medium">Nombre completo</TableCell>
              <TableCell className="font-mono text-ui">{CLAVE_RESERVADA}</TableCell>
              <TableCell className="text-ui">Texto</TableCell>
              <TableCell>
                <Badge variant="warning">Sí</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">Fijo</Badge>
              </TableCell>
              <TableCell />
            </TableRow>
            {campos.map((row, index) => (
              <TableRow key={row.id}>
                <TableCell className="text-ui">{row.orden}</TableCell>
                <TableCell className="text-ui-medium">{row.etiqueta}</TableCell>
                <TableCell className="font-mono text-ui">{row.clave}</TableCell>
                <TableCell className="text-ui">{TIPO_LABELS[row.tipo]}</TableCell>
                <TableCell>
                  <Badge variant={row.requerido ? "warning" : "outline"}>
                    {row.requerido ? "Sí" : "No"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={row.activo ? "success" : "outline"}>
                    {row.activo ? "Sí" : "No"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={index === 0 || reordenando}
                      aria-label="Subir"
                      onClick={() => void mover(row.id, "up")}
                    >
                      <ArrowUp className="size-4" strokeWidth={1.75} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={index === campos.length - 1 || reordenando}
                      aria-label="Bajar"
                      onClick={() => void mover(row.id, "down")}
                    >
                      <ArrowDown className="size-4" strokeWidth={1.75} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDraft(draftDesdeRow(row))
                        setOpen(true)
                      }}
                    >
                      Editar
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => void remove(row.id)}>
                      Eliminar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {rows != null && campos.length === 0 ? (
        <EmptyState
          icon={FormInput}
          title="Sin campos configurables"
          body="Solo el nombre completo fijo se mostrará en el widget hasta que agregues campos acá."
          action={
            <Button type="button" variant="ghost" size="sm" onClick={abrirNuevo}>
              Agregar campo
            </Button>
          }
        />
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Editar campo" : "Nuevo campo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!draft.id ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="campo-clave">Clave</Label>
                <Input
                  id="campo-clave"
                  value={draft.clave}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, clave: event.target.value.toLowerCase() }))
                  }
                  placeholder="producto_interes"
                  className="font-mono"
                />
                <p className="text-kicker text-muted-foreground">
                  Minúsculas y guión bajo. No uses {CLAVE_RESERVADA}.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <Label>Clave</Label>
                <p className="font-mono text-ui">{draft.clave}</p>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="campo-etiqueta">Etiqueta</Label>
              <Input
                id="campo-etiqueta"
                value={draft.etiqueta}
                onChange={(event) => setDraft((prev) => ({ ...prev, etiqueta: event.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="campo-tipo">Tipo</Label>
              <Select
                value={draft.tipo}
                onValueChange={(value) =>
                  setDraft((prev) => ({ ...prev, tipo: value as TipoCampoFormulario }))
                }
              >
                <SelectTrigger id="campo-tipo" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TIPO_LABELS) as TipoCampoFormulario[]).map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {TIPO_LABELS[tipo]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="campo-placeholder">Placeholder</Label>
              <Input
                id="campo-placeholder"
                value={draft.placeholder}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, placeholder: event.target.value }))
                }
              />
            </div>
            {draft.tipo === "select" ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="campo-opciones">Opciones (una por línea)</Label>
                <Textarea
                  id="campo-opciones"
                  rows={4}
                  value={draft.opcionesTexto}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, opcionesTexto: event.target.value }))
                  }
                />
              </div>
            ) : null}
            <div className="flex flex-col gap-2">
              <Label htmlFor="campo-orden">Orden</Label>
              <Input
                id="campo-orden"
                type="number"
                min={1}
                value={draft.orden}
                onChange={(event) => setDraft((prev) => ({ ...prev, orden: event.target.value }))}
              />
            </div>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-kicker">
                <Checkbox
                  checked={draft.requerido}
                  onCheckedChange={(checked) =>
                    setDraft((prev) => ({ ...prev, requerido: checked === true }))
                  }
                />
                Obligatorio
              </label>
              <label className="flex items-center gap-2 text-kicker">
                <Checkbox
                  checked={draft.activo}
                  onCheckedChange={(checked) =>
                    setDraft((prev) => ({ ...prev, activo: checked === true }))
                  }
                />
                Activo
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" disabled={guardando} onClick={() => void save()}>
              {guardando ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
