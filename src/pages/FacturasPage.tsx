import { useEffect, useRef, useState } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown, Receipt, TriangleAlert } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { TableSkeleton } from "@/components/skeleton"
import { ApiError } from "@/lib/api-client"
import { FACTURAS_PAGE_SIZE, listFacturas } from "@/lib/api/factura"
import { formatMoney } from "@/lib/costo-interno"
import { cn } from "@/lib/utils"
import type {
  FacturaContifico,
  FacturaOrdenDireccion,
  FacturaOrdenPor,
} from "@/types/factura"
import { Badge } from "@/components/ui/badge"
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

const MESES_OPCIONES = [3, 6, 12, 24] as const

function SortableHead({
  label,
  active,
  direction,
  align = "left",
  onClick,
}: {
  label: string
  active: boolean
  direction: FacturaOrdenDireccion
  align?: "left" | "right"
  onClick: () => void
}) {
  const Icon = active ? (direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown

  return (
    <TableHead className={align === "right" ? "text-right" : undefined}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "-ml-2 h-8 gap-1 px-2 text-kicker font-medium",
          align === "right" && "ml-auto -mr-2",
          !active && "text-muted-foreground",
        )}
        onClick={onClick}
      >
        {label}
        <Icon className={cn("size-3.5", !active && "opacity-50")} aria-hidden />
      </Button>
    </TableHead>
  )
}

export function FacturasPage() {
  const [meses, setMeses] = useState<number>(6)
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [cliente, setCliente] = useState("")
  const [clienteDebounced, setClienteDebounced] = useState("")
  const [ordenPor, setOrdenPor] = useState<FacturaOrdenPor>("fecha")
  const [ordenDireccion, setOrdenDireccion] = useState<FacturaOrdenDireccion>("desc")
  const [offset, setOffset] = useState(0)
  const [rows, setRows] = useState<FacturaContifico[] | null>(null)
  const [total, setTotal] = useState(0)
  const [cuentaVerificada, setCuentaVerificada] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const modoRango = Boolean(desde && hasta)
  const periodoSig = modoRango ? `rango|${desde}|${hasta}` : `meses|${meses}`
  const filterSig = `${periodoSig}|${clienteDebounced}|${ordenPor}|${ordenDireccion}`
  const prevFilterSig = useRef(filterSig)

  useEffect(() => {
    const filtrosCambiaron = prevFilterSig.current !== filterSig
    if (filtrosCambiaron) {
      prevFilterSig.current = filterSig
      setOffset(0)
    }

    const fetchOffset = filtrosCambiaron ? 0 : offset

    setRows(null)
    setError(null)
    void listFacturas({
      ...(modoRango ? { desde, hasta } : { meses }),
      cliente: clienteDebounced || undefined,
      orden_por: ordenPor,
      orden_direccion: ordenDireccion,
      limit: FACTURAS_PAGE_SIZE,
      offset: fetchOffset,
    })
      .then((data) => {
        setCuentaVerificada(data.cuenta_verificada)
        setTotal(data.total)
        setRows(data.resultados)
      })
      .catch((err: unknown) => {
        const mensaje =
          err instanceof ApiError
            ? err.detail
            : err instanceof Error
              ? err.message
              : "No se pudieron cargar las facturas."
        setError(mensaje)
      })
  }, [filterSig, offset])

  useEffect(() => {
    const t = window.setTimeout(() => setClienteDebounced(cliente), 300)
    return () => window.clearTimeout(t)
  }, [cliente])

  function toggleSort(campo: FacturaOrdenPor) {
    if (ordenPor === campo) {
      setOrdenDireccion((actual) => (actual === "asc" ? "desc" : "asc"))
      return
    }
    setOrdenPor(campo)
    setOrdenDireccion(campo === "cliente" ? "asc" : "desc")
  }

  const hayFiltroCliente = clienteDebounced.trim().length > 0
  const paginaDesde = total === 0 ? 0 : offset + 1
  const paginaHasta = Math.min(offset + FACTURAS_PAGE_SIZE, total)
  const puedeAnterior = offset > 0
  const puedeSiguiente = offset + FACTURAS_PAGE_SIZE < total

  function emptyBody(): string {
    if (hayFiltroCliente && modoRango) {
      return "Ninguna factura FAC coincide con el cliente buscado en el rango seleccionado."
    }
    if (hayFiltroCliente) {
      return "Ninguna factura FAC coincide con el cliente buscado en el período seleccionado."
    }
    if (modoRango) {
      return `No hay facturas FAC en Contífico entre ${desde} y ${hasta}.`
    }
    return `No hay facturas FAC en Contífico en los últimos ${meses} meses.`
  }

  return (
    <>
      <PageHeader
        title="Facturas"
        description="Facturas electrónicas (FAC) emitidas en Contífico. Solo lectura — la emisión desde prometIO sigue diferida."
      />

      <div className="filter-bar mb-4">
        <div className="filter-field sm:min-w-56 sm:flex-1">
          <Label htmlFor="facturas-cliente">Cliente</Label>
          <Input
            id="facturas-cliente"
            value={cliente}
            onChange={(event) => setCliente(event.target.value)}
            placeholder="Nombre o razón social"
            className="h-9"
          />
        </div>
        <div className="filter-field sm:max-w-xs">
          <Label htmlFor="facturas-meses">Período</Label>
          <Select
            value={String(meses)}
            disabled={modoRango}
            onValueChange={(value) => {
              setDesde("")
              setHasta("")
              setMeses(Number(value))
            }}
          >
            <SelectTrigger id="facturas-meses" className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MESES_OPCIONES.map((item) => (
                <SelectItem key={item} value={String(item)}>
                  Últimos {item} meses
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="filter-field">
          <Label htmlFor="facturas-desde">Desde</Label>
          <Input
            id="facturas-desde"
            type="date"
            value={desde}
            onChange={(event) => setDesde(event.target.value)}
            className="h-9"
          />
        </div>
        <div className="filter-field">
          <Label htmlFor="facturas-hasta">Hasta</Label>
          <Input
            id="facturas-hasta"
            type="date"
            value={hasta}
            onChange={(event) => setHasta(event.target.value)}
            className="h-9"
          />
        </div>
        {modoRango ? (
          <p className="text-kicker text-muted-foreground sm:basis-full">
            Si elegís fechas, el rango por meses no aplica.
          </p>
        ) : null}
        {!cuentaVerificada ? (
          <p className="text-kicker text-warning">
            La cuenta de Contífico todavía no fue verificada como la de Geeks.
          </p>
        ) : null}
      </div>

      {rows == null && !error ? (
        <TableSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center px-4 py-10 text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <TriangleAlert className="size-5" strokeWidth={1.75} aria-hidden />
          </span>
          <p className="mt-4 text-section">No se pudo consultar Contífico</p>
          <p className="mt-1 max-w-lg text-kicker">{error}</p>
        </div>
      ) : total === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Sin facturas"
          body={emptyBody()}
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <SortableHead
                  label="Fecha"
                  active={ordenPor === "fecha"}
                  direction={ordenDireccion}
                  onClick={() => toggleSort("fecha")}
                />
                <SortableHead
                  label="Cliente"
                  active={ordenPor === "cliente"}
                  direction={ordenDireccion}
                  onClick={() => toggleSort("cliente")}
                />
                <TableHead>Qué se vendió</TableHead>
                <SortableHead
                  label="Total"
                  active={ordenPor === "valor"}
                  direction={ordenDireccion}
                  align="right"
                  onClick={() => toggleSort("valor")}
                />
                <TableHead>Estado</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows!.map((row) => (
                <TableRow key={`${row.numero}-${row.fecha_emision}`}>
                  <TableCell className="text-ui-medium">{row.numero}</TableCell>
                  <TableCell className="text-muted-foreground">{row.fecha_emision}</TableCell>
                  <TableCell>{row.cliente ?? "—"}</TableCell>
                  <TableCell
                    className="max-w-[240px] truncate text-kicker"
                    title={row.resumen_productos ?? undefined}
                  >
                    {row.resumen_productos ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(row.total)}</TableCell>
                  <TableCell>
                    <Badge variant={row.anulado ? "destructive" : "success"}>
                      {row.anulado ? "Anulada" : "Vigente"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {row.url_ride ? (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={row.url_ride} target="_blank" rel="noreferrer">
                          RIDE
                        </a>
                      </Button>
                    ) : null}
                    {row.url_xml ? (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={row.url_xml} target="_blank" rel="noreferrer">
                          XML
                        </a>
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-kicker">
              Mostrando {paginaDesde}–{paginaHasta} de {total} facturas
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!puedeAnterior}
                onClick={() => setOffset((actual) => Math.max(0, actual - FACTURAS_PAGE_SIZE))}
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!puedeSiguiente}
                onClick={() => setOffset((actual) => actual + FACTURAS_PAGE_SIZE)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
