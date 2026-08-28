import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Truck } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { CalificacionEstrellas } from "@/components/proveedores/CalificacionEstrellas"
import { ServiciosTagsInput } from "@/components/proveedores/ServiciosTagsInput"
import { TableSkeleton } from "@/components/skeleton"
import { Badge } from "@/components/ui/badge"
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
  createProveedor,
  deleteProveedor,
  listProveedores,
  updateProveedor,
} from "@/lib/api/proveedor"
import type { Proveedor } from "@/types/proveedor"

type Draft = {
  id?: string
  nombre: string
  contacto_nombre: string
  ruc: string
  telefono: string
  email: string
  calificacion: number | null
  servicios: string[]
}

const emptyDraft: Draft = {
  nombre: "",
  contacto_nombre: "",
  ruc: "",
  telefono: "",
  email: "",
  calificacion: null,
  servicios: [],
}

function textoOpcional(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

function draftDe(row: Proveedor): Draft {
  return {
    id: row.id,
    nombre: row.nombre,
    contacto_nombre: row.contacto_nombre ?? "",
    ruc: row.ruc ?? "",
    telefono: row.telefono ?? "",
    email: row.email ?? "",
    calificacion: row.calificacion == null ? null : Math.round(row.calificacion),
    servicios: row.servicios ?? [],
  }
}

export function ProveedoresPage() {
  const [rows, setRows] = useState<Proveedor[] | null>(null)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(emptyDraft)

  async function reload() {
    setRows(await listProveedores())
  }

  useEffect(() => {
    void reload().catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar los proveedores.")
      setRows([])
    })
  }, [])

  const sugerencias = useMemo(() => {
    const seen = new Set<string>()
    const tags: string[] = []
    for (const row of rows ?? []) {
      for (const tag of row.servicios ?? []) {
        const clave = tag.toLocaleLowerCase("es")
        if (seen.has(clave)) {
          continue
        }
        seen.add(clave)
        tags.push(tag)
      }
    }
    return tags.sort((a, b) => a.localeCompare(b, "es"))
  }, [rows])

  function startCreate() {
    setDraft(emptyDraft)
    setOpen(true)
  }

  function startEdit(row: Proveedor) {
    setDraft(draftDe(row))
    setOpen(true)
  }

  async function save() {
    if (!draft.nombre.trim()) {
      toast.error("El nombre es obligatorio.")
      return
    }
    const payload = {
      nombre: draft.nombre.trim(),
      contacto_nombre: textoOpcional(draft.contacto_nombre),
      ruc: textoOpcional(draft.ruc),
      telefono: textoOpcional(draft.telefono),
      email: textoOpcional(draft.email),
      calificacion: draft.calificacion,
      servicios: draft.servicios,
    }
    try {
      if (draft.id) {
        await updateProveedor(draft.id, payload)
      } else {
        await createProveedor(payload)
      }
      toast.success("Proveedor guardado.")
      setOpen(false)
      await reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el proveedor.")
    }
  }

  async function remove(id: string) {
    try {
      await deleteProveedor(id)
      toast.success("Proveedor eliminado.")
      await reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el proveedor.")
    }
  }

  return (
    <>
      <PageHeader
        title="Proveedores"
        description="Quién entra como costo en una línea de cotización. Los servicios son tags libres, no un catálogo aparte."
        action={<Button onClick={startCreate}>Nuevo proveedor</Button>}
      />
      {rows == null ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="Sin proveedores"
          body="El cotizador los pide al armar una línea con costo. Creá el primero."
          action={
            <Button type="button" variant="ghost" size="sm" onClick={startCreate}>
              Nuevo proveedor
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>RUC</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Calificación</TableHead>
              <TableHead>Servicios</TableHead>
              <TableHead className="w-40" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-ui-medium">{row.nombre}</TableCell>
                <TableCell className="text-ui">{row.contacto_nombre ?? "—"}</TableCell>
                <TableCell className="text-ui">{row.ruc ?? "—"}</TableCell>
                <TableCell className="text-ui">{row.telefono ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{row.email ?? "—"}</TableCell>
                <TableCell>
                  <CalificacionEstrellas value={row.calificacion == null ? null : Math.round(row.calificacion)} />
                </TableCell>
                <TableCell className="whitespace-normal">
                  {(row.servicios ?? []).length === 0 ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {(row.servicios ?? []).map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </TableCell>
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Editar proveedor" : "Nuevo proveedor"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="proveedor-nombre">Nombre</Label>
              <Input
                id="proveedor-nombre"
                value={draft.nombre}
                onChange={(event) => setDraft((prev) => ({ ...prev, nombre: event.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="proveedor-contacto">Contacto</Label>
              <Input
                id="proveedor-contacto"
                value={draft.contacto_nombre}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, contacto_nombre: event.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="proveedor-ruc">RUC</Label>
              <Input
                id="proveedor-ruc"
                value={draft.ruc}
                onChange={(event) => setDraft((prev) => ({ ...prev, ruc: event.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="proveedor-telefono">Teléfono</Label>
              <Input
                id="proveedor-telefono"
                value={draft.telefono}
                onChange={(event) => setDraft((prev) => ({ ...prev, telefono: event.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="proveedor-email">Email</Label>
              <Input
                id="proveedor-email"
                type="email"
                value={draft.email}
                onChange={(event) => setDraft((prev) => ({ ...prev, email: event.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Calificación</Label>
              <CalificacionEstrellas
                value={draft.calificacion}
                onChange={(calificacion) => setDraft((prev) => ({ ...prev, calificacion }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="proveedor-servicios">Servicios</Label>
              <ServiciosTagsInput
                value={draft.servicios}
                sugerencias={sugerencias}
                onChange={(servicios) => setDraft((prev) => ({ ...prev, servicios }))}
              />
              <p className="text-kicker">Tags libres. Enter o Agregar; no se escriben separados por comas.</p>
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
