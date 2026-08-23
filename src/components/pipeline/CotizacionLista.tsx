import { useMemo, useState } from "react"
import { FileText } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { Skeleton } from "@/components/skeleton"
import { CotizacionEstadoBadge } from "@/components/pipeline/CotizacionEstadoBadge"
import { formatMoney } from "@/lib/costo-interno"
import { coincideTexto } from "@/lib/lista-filtros"
import { Button } from "@/components/ui/button"
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
  COTIZACION_ESTADOS,
  type CotizacionConLineas,
  type CotizacionEstado,
} from "@/types/cotizacion"

export function CotizacionLista({
  cotizaciones,
  abiertaId,
  onAbrir,
  onNueva,
  cargando = false,
}: {
  cotizaciones: CotizacionConLineas[]
  abiertaId: string | null
  onAbrir: (id: string) => void
  onNueva?: () => void
  cargando?: boolean
}) {
  const [busqueda, setBusqueda] = useState("")
  const [estado, setEstado] = useState<CotizacionEstado | null>(null)

  const filtradas = useMemo(() => {
    return cotizaciones.filter((row) => {
      if (estado && row.estado !== estado) {
        return false
      }
      return coincideTexto(busqueda, row.numero)
    })
  }, [cotizaciones, estado, busqueda])

  if (cargando) {
    return (
      <div className="space-y-2" aria-hidden>
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    )
  }

  if (cotizaciones.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Sin cotizaciones"
        body="El constructor vive acá. La primera cotización arranca en borrador."
        action={
          onNueva ? (
            <Button type="button" variant="ghost" size="sm" onClick={onNueva}>
              Nueva cotización
            </Button>
          ) : null
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="filter-bar mb-0">
        <div className="filter-field sm:flex-1">
          <Label htmlFor="cotizacion-busqueda">Buscar</Label>
          <Input
            id="cotizacion-busqueda"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Número"
          />
        </div>
        <div className="filter-field">
          <Label htmlFor="cotizacion-estado">Estado</Label>
          <Select
            value={estado ?? "all"}
            onValueChange={(value) =>
              setEstado(value === "all" ? null : (value as CotizacionEstado))
            }
          >
            <SelectTrigger id="cotizacion-estado">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {COTIZACION_ESTADOS.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {filtradas.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nada coincide"
          body="Ninguna cotización pasa esos filtros."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.map((row) => (
              <TableRow key={row.id} data-state={row.id === abiertaId ? "selected" : undefined}>
                <TableCell className="text-ui-medium">{row.numero}</TableCell>
                <TableCell>
                  <CotizacionEstadoBadge estado={row.estado} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(row.total_cotizacion)}
                </TableCell>
                <TableCell className="text-right">
                  <Button type="button" variant="ghost" size="sm" onClick={() => onAbrir(row.id)}>
                    {row.estado === "borrador" ? "Armar" : "Ver"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
