import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Search } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { TableSkeleton } from "@/components/skeleton"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
  createLinkedinCriterioBusqueda,
  deleteLinkedinCriterioBusqueda,
  listLinkedinCriteriosBusqueda,
  updateLinkedinCriterioBusqueda,
} from "@/lib/api/linkedin-criterios"
import { ApiError } from "@/lib/api-client"
import type { LinkedinCriterioBusqueda } from "@/types/linkedin-criterio"

export function LinkedInCriteriosPage({ sinEncabezado = false }: { sinEncabezado?: boolean }) {
  const [rows, setRows] = useState<LinkedinCriterioBusqueda[] | null>(null)
  const [nuevoTexto, setNuevoTexto] = useState("")
  const [guardandoId, setGuardandoId] = useState<string | null>(null)
  const [agregando, setAgregando] = useState(false)

  async function reload() {
    setRows(await listLinkedinCriteriosBusqueda())
  }

  useEffect(() => {
    void reload().catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar los criterios.")
      setRows([])
    })
  }, [])

  async function agregar() {
    const texto = nuevoTexto.trim()
    if (!texto) {
      toast.error("Escribí el criterio de búsqueda.")
      return
    }
    setAgregando(true)
    try {
      await createLinkedinCriterioBusqueda({ texto, activo: true })
      setNuevoTexto("")
      toast.success("Criterio agregado.")
      await reload()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "No se pudo agregar.")
    } finally {
      setAgregando(false)
    }
  }

  async function guardarTexto(row: LinkedinCriterioBusqueda, texto: string) {
    const next = texto.trim()
    if (!next || next === row.texto) {
      return
    }
    setGuardandoId(row.id)
    try {
      await updateLinkedinCriterioBusqueda(row.id, { texto: next })
      await reload()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "No se pudo guardar.")
    } finally {
      setGuardandoId(null)
    }
  }

  async function toggleActivo(row: LinkedinCriterioBusqueda, activo: boolean) {
    setGuardandoId(row.id)
    try {
      await updateLinkedinCriterioBusqueda(row.id, { activo })
      setRows((prev) =>
        prev?.map((item) => (item.id === row.id ? { ...item, activo } : item)) ?? prev,
      )
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "No se pudo actualizar.")
    } finally {
      setGuardandoId(null)
    }
  }

  async function eliminar(row: LinkedinCriterioBusqueda) {
    if (!window.confirm(`¿Eliminar «${row.texto}»?`)) {
      return
    }
    setGuardandoId(row.id)
    try {
      await deleteLinkedinCriterioBusqueda(row.id)
      toast.success("Criterio eliminado.")
      await reload()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "No se pudo eliminar.")
    } finally {
      setGuardandoId(null)
    }
  }

  return (
    <>
      {sinEncabezado ? null : (
        <PageHeader
          title="Criterios LinkedIn"
          description="Cargos y palabras clave que Apify usa al buscar perfiles. Solo los activos entran en la corrida."
        />
      )}
      <div className="surface-card mb-6 space-y-3 p-4">
        <Label htmlFor="criterio-nuevo">Agregar criterio</Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            id="criterio-nuevo"
            value={nuevoTexto}
            onChange={(event) => setNuevoTexto(event.target.value)}
            placeholder='Ej. "director de marketing", "gerente comercial"'
            disabled={agregando}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void agregar()
              }
            }}
          />
          <Button type="button" disabled={agregando} onClick={() => void agregar()}>
            {agregando ? "Guardando…" : "Agregar"}
          </Button>
        </div>
      </div>
      {rows == null ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Sin criterios"
          body="Agregá al menos uno activo para habilitar «Buscar ahora» en Prospección LinkedIn."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Texto</TableHead>
              <TableHead className="w-28">Activo</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Input
                    key={`${row.id}-${row.texto}`}
                    className="h-9"
                    defaultValue={row.texto}
                    disabled={guardandoId === row.id}
                    onBlur={(event) => void guardarTexto(row, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.currentTarget.blur()
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  <label className="flex items-center gap-2 text-kicker">
                    <Checkbox
                      checked={row.activo}
                      disabled={guardandoId === row.id}
                      onCheckedChange={(checked) =>
                        void toggleActivo(row, checked === true)
                      }
                    />
                    {row.activo ? "Sí" : "No"}
                  </label>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={guardandoId === row.id}
                    onClick={() => void eliminar(row)}
                  >
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <p className="mt-6 text-kicker text-muted-foreground">
        Los cambios aplican en la próxima búsqueda manual (cooldown de 6 h entre corridas).
      </p>
    </>
  )
}
