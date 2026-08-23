import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Target } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
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
  createMetaComercial,
  deleteMetaComercial,
  listMetasComerciales,
  updateMetaComercial,
} from "@/lib/api/meta-comercial"
import { listPerfilesElegiblesEjecutivo } from "@/lib/api/perfiles"
import { formatMoney } from "@/lib/costo-interno"
import { formatDateOnly } from "@/lib/datetime-local"
import { esMetaVigente, etiquetaPeriodo, periodoVigenteHoy, rangoMensual, rangoTrimestral } from "@/lib/meta-comercial"
import type { MetaComercial, PeriodoTipo } from "@/types/meta-comercial"
import type { Perfil } from "@/types/perfil"

const AGENCIA = "agencia"
const defaults = periodoVigenteHoy()

type DraftAlta = {
  alcance: string
  periodo_tipo: PeriodoTipo
  mes: string
  anio: string
  trimestre: "1" | "2" | "3" | "4"
  monto: string
}

const emptyAlta = (): DraftAlta => ({
  alcance: AGENCIA,
  periodo_tipo: "mensual",
  mes: defaults.mes,
  anio: defaults.anio,
  trimestre: defaults.trimestre,
  monto: "",
})

export function MetaComercialPage() {
  const [rows, setRows] = useState<MetaComercial[] | null>(null)
  const [vendedores, setVendedores] = useState<Perfil[]>([])
  const [alta, setAlta] = useState<DraftAlta | null>(null)
  const [editando, setEditando] = useState<{ id: string; monto: string } | null>(null)
  const [guardando, setGuardando] = useState(false)

  async function reload() {
    const [metas, perfiles] = await Promise.all([listMetasComerciales(), listPerfilesElegiblesEjecutivo()])
    setRows(metas)
    setVendedores(perfiles)
  }

  useEffect(() => {
    void reload().catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar las metas.")
      setRows([])
    })
  }, [])

  function nombreAlcance(perfilId: string | null): string {
    if (!perfilId) {
      return "Agencia"
    }
    return vendedores.find((row) => row.id === perfilId)?.nombre_completo ?? "Vendedor"
  }

  async function crear() {
    if (!alta) {
      return
    }
    const monto = Number(alta.monto)
    if (!Number.isFinite(monto) || monto <= 0) {
      toast.error("El monto tiene que ser un número mayor a cero.")
      return
    }
    let rango: { fecha_inicio: string; fecha_fin: string }
    try {
      if (alta.periodo_tipo === "mensual") {
        rango = rangoMensual(alta.mes)
      } else {
        const anio = Number(alta.anio)
        const trimestre = Number(alta.trimestre)
        if (!Number.isInteger(anio) || anio < 2020 || anio > 2100 || ![1, 2, 3, 4].includes(trimestre)) {
          throw new Error("período inválido")
        }
        rango = rangoTrimestral(anio, trimestre as 1 | 2 | 3 | 4)
      }
    } catch {
      toast.error("El período no es válido.")
      return
    }
    setGuardando(true)
    try {
      await createMetaComercial({
        perfil_id: alta.alcance === AGENCIA ? null : alta.alcance,
        periodo_tipo: alta.periodo_tipo,
        fecha_inicio: rango.fecha_inicio,
        fecha_fin: rango.fecha_fin,
        monto,
      })
      toast.success("Meta creada.")
      setAlta(null)
      await reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear la meta.")
    } finally {
      setGuardando(false)
    }
  }

  async function guardarMonto() {
    if (!editando) {
      return
    }
    const monto = Number(editando.monto)
    if (!Number.isFinite(monto) || monto <= 0) {
      toast.error("El monto tiene que ser un número mayor a cero.")
      return
    }
    setGuardando(true)
    try {
      await updateMetaComercial(editando.id, monto)
      toast.success("Monto actualizado.")
      setEditando(null)
      await reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar.")
    } finally {
      setGuardando(false)
    }
  }

  async function borrar(id: string) {
    try {
      await deleteMetaComercial(id)
      toast.success("Meta eliminada.")
      await reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar.")
    }
  }

  return (
    <>
      <PageHeader
        title="Meta comercial"
        description="Meta de la agencia y por vendedor. Después de creada solo se edita el monto; si el período está mal, se borra y se crea de nuevo."
        action={
          <Button
            type="button"
            onClick={() => {
              setEditando(null)
              setAlta(emptyAlta())
            }}
          >
            Nueva meta
          </Button>
        }
      />
      {rows == null ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Sin metas"
          body="Cargá la meta total de la agencia y, si hace falta, una individual por vendedor. El dashboard muestra el avance del período vigente."
          action={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditando(null)
                setAlta(emptyAlta())
              }}
            >
              Nueva meta
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Alcance</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Desde</TableHead>
              <TableHead>Hasta</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="w-40" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-ui-medium">{nombreAlcance(row.perfil_id)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-ui">{etiquetaPeriodo(row.periodo_tipo)}</span>
                    {esMetaVigente(row) ? <Badge variant="success">Vigente</Badge> : null}
                  </div>
                </TableCell>
                <TableCell className="text-ui">{formatDateOnly(row.fecha_inicio)}</TableCell>
                <TableCell className="text-ui">{formatDateOnly(row.fecha_fin)}</TableCell>
                <TableCell className="text-right tabular-nums text-ui">{formatMoney(row.monto)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAlta(null)
                      setEditando({ id: row.id, monto: String(row.monto) })
                    }}
                  >
                    Editar
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => void borrar(row.id)}>
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={alta != null} onOpenChange={(open) => !open && setAlta(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva meta</DialogTitle>
          </DialogHeader>
          {alta ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="meta-alcance">Alcance</Label>
                <Select
                  value={alta.alcance}
                  onValueChange={(value) => setAlta((prev) => (prev ? { ...prev, alcance: value } : prev))}
                >
                  <SelectTrigger id="meta-alcance">
                    <SelectValue placeholder="Agencia o vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AGENCIA}>Agencia</SelectItem>
                    {vendedores.map((row) => (
                      <SelectItem key={row.id} value={row.id}>
                        {row.nombre_completo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="meta-periodo">Período</Label>
                <Select
                  value={alta.periodo_tipo}
                  onValueChange={(value) =>
                    setAlta((prev) => (prev ? { ...prev, periodo_tipo: value as PeriodoTipo } : prev))
                  }
                >
                  <SelectTrigger id="meta-periodo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensual">Mensual</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {alta.periodo_tipo === "mensual" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="meta-mes">Mes</Label>
                  <Input
                    id="meta-mes"
                    type="month"
                    value={alta.mes}
                    onChange={(event) => setAlta((prev) => (prev ? { ...prev, mes: event.target.value } : prev))}
                  />
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="meta-anio">Año</Label>
                    <Input
                      id="meta-anio"
                      type="number"
                      min={2020}
                      max={2100}
                      value={alta.anio}
                      onChange={(event) => setAlta((prev) => (prev ? { ...prev, anio: event.target.value } : prev))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="meta-trimestre">Trimestre</Label>
                    <Select
                      value={alta.trimestre}
                      onValueChange={(value) =>
                        setAlta((prev) =>
                          prev ? { ...prev, trimestre: value as DraftAlta["trimestre"] } : prev,
                        )
                      }
                    >
                      <SelectTrigger id="meta-trimestre">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">T1 · ene–mar</SelectItem>
                        <SelectItem value="2">T2 · abr–jun</SelectItem>
                        <SelectItem value="3">T3 · jul–sep</SelectItem>
                        <SelectItem value="4">T4 · oct–dic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="meta-monto">Monto</Label>
                <Input
                  id="meta-monto"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={alta.monto}
                  onChange={(event) => setAlta((prev) => (prev ? { ...prev, monto: event.target.value } : prev))}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAlta(null)}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void crear()} disabled={guardando}>
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editando != null} onOpenChange={(open) => !open && setEditando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar monto</DialogTitle>
          </DialogHeader>
          {editando ? (
            <div className="space-y-1.5">
              <Label htmlFor="meta-editar-monto">Monto</Label>
              <Input
                id="meta-editar-monto"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={editando.monto}
                onChange={(event) => setEditando((prev) => (prev ? { ...prev, monto: event.target.value } : prev))}
              />
              <p className="text-kicker">El período no se edita. Si está mal, eliminá esta meta y creá otra.</p>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditando(null)}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void guardarMonto()} disabled={guardando}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
