import { useEffect, useState } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import { Repeat } from "lucide-react"
import { toast } from "sonner"

import type { ContratosOutletContext } from "@/components/contratos/ContratosLayout"
import { ContratoVigenciaBadge } from "@/components/contratos/ContratoVigenciaBadge"
import { EmptyState } from "@/components/empty-state"
import { TableSkeleton } from "@/components/skeleton"
import { Badge } from "@/components/ui/badge"
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
import { listContratos } from "@/lib/api/contrato-recurrente"
import { textoDiasParaVencer } from "@/lib/contrato-recurrente"
import { formatMoney } from "@/lib/costo-interno"
import { formatDateOnly } from "@/lib/datetime-local"
import type { ContratoRecurrente } from "@/types/contrato-recurrente"

type FiltroVigencia = "todos" | "vigentes" | "no_vigentes"
type FiltroActivo = "activos" | "inactivos"

export function ContratosPage() {
  const navigate = useNavigate()
  const { version } = useOutletContext<ContratosOutletContext>()
  const [rows, setRows] = useState<ContratoRecurrente[] | null>(null)
  const [busqueda, setBusqueda] = useState("")
  const [qDebounced, setQDebounced] = useState("")
  const [vigencia, setVigencia] = useState<FiltroVigencia>("todos")
  const [activo, setActivo] = useState<FiltroActivo>("activos")

  useEffect(() => {
    const t = window.setTimeout(() => setQDebounced(busqueda), 300)
    return () => window.clearTimeout(t)
  }, [busqueda])

  useEffect(() => {
    let cancelled = false
    setRows(null)
    void listContratos({
      q: qDebounced,
      vigente: vigencia === "todos" ? null : vigencia === "vigentes",
      activo: activo === "activos",
    })
      .then((data) => {
        if (!cancelled) {
          setRows(data)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "No se pudieron cargar los contratos.")
          setRows([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [qDebounced, vigencia, activo, version])

  const hayFiltro = Boolean(qDebounced.trim()) || vigencia !== "todos" || activo !== "activos"

  return (
    <>
      <div className="filter-bar">
        <div className="filter-field sm:min-w-56 sm:flex-1">
          <Label htmlFor="contratos-busqueda">Buscar</Label>
          <Input
            id="contratos-busqueda"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Contrato o empresa"
          />
        </div>
        <div className="filter-field">
          <Label htmlFor="contratos-vigencia">Vigencia</Label>
          <Select value={vigencia} onValueChange={(value) => setVigencia(value as FiltroVigencia)}>
            <SelectTrigger id="contratos-vigencia">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="vigentes">Vigentes</SelectItem>
              <SelectItem value="no_vigentes">No vigentes</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="filter-field">
          <Label htmlFor="contratos-activo">Estado</Label>
          <Select value={activo} onValueChange={(value) => setActivo(value as FiltroActivo)}>
            <SelectTrigger id="contratos-activo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="activos">Activos</SelectItem>
              <SelectItem value="inactivos">Desactivados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {rows == null ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title={hayFiltro ? "Nada coincide" : "Sin contratos"}
          body={
            hayFiltro
              ? "Ningún contrato pasa esos filtros."
              : "Cuando cargues un fee recurrente con «Nuevo contrato», aparece acá."
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contrato</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Vigencia</TableHead>
              <TableHead>Fin</TableHead>
              <TableHead className="text-right">Subtotal mensual</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer"
                onClick={() => navigate(`/contratos/${row.id}`)}
              >
                <TableCell className="whitespace-normal">
                  <p className="text-ui-medium">{row.nombre}</p>
                  <p className="text-kicker text-muted-foreground">{row.empresa_nombre ?? "—"}</p>
                </TableCell>
                <TableCell className="text-muted-foreground">{row.contacto_nombre ?? "—"}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5">
                    <ContratoVigenciaBadge vigencia={row.vigencia} />
                    {row.activo ? null : <Badge variant="outline">Desactivado</Badge>}
                  </span>
                </TableCell>
                <TableCell>
                  <p className="text-ui">{formatDateOnly(row.fecha_fin)}</p>
                  {row.vigencia === "por_renovar" || row.vigencia === "vencido" ? (
                    <p className="text-kicker text-muted-foreground">
                      {textoDiasParaVencer(row.dias_para_vencer)}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell className="text-right tabular-nums text-ui">
                  {formatMoney(row.monto_mensual_total)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  )
}
