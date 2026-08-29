import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Truck } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { CalificacionEstrellas } from "@/components/proveedores/CalificacionEstrellas"
import {
  mismoServicio,
  ProveedorCard,
  ServicioTagChip,
} from "@/components/proveedores/ProveedorCard"
import { ServiciosTagsInput } from "@/components/proveedores/ServiciosTagsInput"
import { TableSkeleton, TilesSkeleton } from "@/components/skeleton"
import { VistaToggle } from "@/components/vista-toggle"
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
  createProveedor,
  deleteProveedor,
  listProveedores,
  updateProveedor,
} from "@/lib/api/proveedor"
import { coincideTexto } from "@/lib/lista-filtros"
import {
  guardarVistaLocal,
  leerVistaLocal,
  VISTA_LISTA_CUADRICULA,
  type VistaListaCuadricula,
} from "@/lib/vista-preferida"
import type { Proveedor } from "@/types/proveedor"

const VISTA_KEY = "prometio-proveedores-vista"

function tieneServicio(row: Proveedor, tag: string): boolean {
  const needle = tag.toLocaleLowerCase("es")
  return (row.servicios ?? []).some((item) => item.toLocaleLowerCase("es") === needle)
}

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
  const [busqueda, setBusqueda] = useState("")
  const [servicio, setServicio] = useState<string | null>(null)
  const [vista, setVista] = useState<VistaListaCuadricula>(() =>
    leerVistaLocal(VISTA_KEY, VISTA_LISTA_CUADRICULA, "lista"),
  )
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(emptyDraft)

  function cambiarVista(next: VistaListaCuadricula) {
    setVista(next)
    guardarVistaLocal(VISTA_KEY, next)
  }

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

  const filtrados = useMemo(() => {
    if (!rows) {
      return []
    }
    return rows.filter((row) => {
      if (!coincideTexto(busqueda, row.nombre, row.contacto_nombre ?? "", row.ruc ?? "")) {
        return false
      }
      if (servicio && !tieneServicio(row, servicio)) {
        return false
      }
      return true
    })
  }, [rows, busqueda, servicio])

  function filtrarServicio(tag: string) {
    const canonico = sugerencias.find((item) => mismoServicio(item, tag)) ?? tag
    setServicio((prev) => (mismoServicio(prev, canonico) ? null : canonico))
  }

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
      <div className="filter-bar">
        <div className="filter-field sm:min-w-56 sm:max-w-sm sm:flex-1">
          <Label htmlFor="proveedor-busqueda">Buscar</Label>
          <Input
            id="proveedor-busqueda"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Nombre, contacto o RUC"
          />
        </div>
        {sugerencias.length > 0 ? (
          <div className="filter-field">
            <Label htmlFor="proveedor-servicio">Servicio</Label>
            <Select
              value={servicio ?? "all"}
              onValueChange={(value) => setServicio(value === "all" ? null : value)}
            >
              <SelectTrigger id="proveedor-servicio">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {sugerencias.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <VistaToggle
          value={vista}
          onChange={cambiarVista}
          opciones={[
            { value: "lista", label: "Lista" },
            { value: "cuadricula", label: "Cuadrícula" },
          ]}
        />
      </div>
      {rows == null ? (
        vista === "cuadricula" ? (
          <TilesSkeleton count={6} className="lg:grid-cols-3" />
        ) : (
          <TableSkeleton />
        )
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon={Truck}
          title={rows.length === 0 ? "Sin proveedores" : "Nada coincide"}
          body={
            rows.length === 0
              ? "El cotizador los pide al armar una línea con costo. Creá el primero."
              : "Ningún proveedor pasa esa búsqueda o servicio."
          }
          action={
            rows.length === 0 ? (
              <Button type="button" variant="ghost" size="sm" onClick={startCreate}>
                Nuevo proveedor
              </Button>
            ) : null
          }
        />
      ) : vista === "cuadricula" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((row) => (
            <ProveedorCard
              key={row.id}
              proveedor={row}
              servicioFiltro={servicio}
              onOpen={() => startEdit(row)}
              onEliminar={() => void remove(row.id)}
              onFiltrarServicio={filtrarServicio}
            />
          ))}
        </div>
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
            {filtrados.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-ui-medium">{row.nombre}</TableCell>
                <TableCell className="text-ui">{row.contacto_nombre ?? "—"}</TableCell>
                <TableCell className="text-ui">{row.ruc ?? "—"}</TableCell>
                <TableCell className="text-ui">{row.telefono ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{row.email ?? "—"}</TableCell>
                <TableCell>
                  <CalificacionEstrellas
                    value={row.calificacion == null ? null : Math.round(row.calificacion)}
                  />
                </TableCell>
                <TableCell className="whitespace-normal">
                  {(row.servicios ?? []).length === 0 ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {(row.servicios ?? []).map((tag) => (
                        <ServicioTagChip
                          key={tag}
                          tag={tag}
                          selected={mismoServicio(servicio, tag)}
                          onSelect={filtrarServicio}
                        />
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
