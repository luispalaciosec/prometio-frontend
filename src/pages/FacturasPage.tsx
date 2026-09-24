import { useEffect, useRef, useState } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, Receipt, Settings2, TriangleAlert } from "lucide-react"
import { toast } from "sonner"

import { ClientesMediosDialog } from "@/components/facturas/ClientesMediosDialog"
import { FacturasResumenPanel } from "@/components/facturas/FacturasResumenPanel"
import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { TableSkeleton } from "@/components/skeleton"
import { ApiError } from "@/lib/api-client"
import {
  FACTURAS_PAGE_SIZE,
  facturasPeriodoBounds,
  getFacturasResumen,
  listFacturas,
} from "@/lib/api/factura"
import { createClienteMedios, listClientesMedios } from "@/lib/config-api"
import { formatMoney } from "@/lib/costo-interno"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"
import type {
  FacturaContifico,
  FacturaOrdenDireccion,
  FacturaOrdenPor,
  FacturasResumen,
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
  const perfil = useAuthStore((state) => state.perfil)
  const esAdmin = perfil?.equipo === "administrativo"

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

  const [resumen, setResumen] = useState<FacturasResumen | null>(null)
  const [resumenError, setResumenError] = useState<string | null>(null)
  const [mediosRucs, setMediosRucs] = useState<Set<string>>(new Set())
  const [marcandoRuc, setMarcandoRuc] = useState<string | null>(null)
  const [mediosDialogOpen, setMediosDialogOpen] = useState(false)

  const modoRango = Boolean(desde && hasta)
  const periodoSig = modoRango ? `rango|${desde}|${hasta}` : `meses|${meses}`
  const filterSig = `${periodoSig}|${clienteDebounced}|${ordenPor}|${ordenDireccion}`
  const prevFilterSig = useRef(filterSig)

  const bounds = facturasPeriodoBounds(modoRango ? { desde, hasta } : { meses })

  useEffect(() => {
    setResumen(null)
    setResumenError(null)
    void getFacturasResumen(bounds)
      .then((data) => {
        setResumen(data)
        setCuentaVerificada(data.cuenta_verificada)
      })
      .catch((err: unknown) => {
        const mensaje =
          err instanceof ApiError
            ? err.detail
            : err instanceof Error
              ? err.message
              : "No se pudo cargar el resumen."
        setResumenError(mensaje)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodoSig])

  useEffect(() => {
    void listClientesMedios()
      .then((items) => setMediosRucs(new Set(items.map((row) => row.ruc))))
      .catch(() => setMediosRucs(new Set()))
  }, [resumen?.clientes_medios_configurados, mediosDialogOpen])

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

  async function marcarComoMedios(row: FacturaContifico) {
    if (!row.cliente_ruc?.trim()) {
      toast.error("Esta factura no trae RUC del cliente.")
      return
    }
    setMarcandoRuc(row.cliente_ruc)
    try {
      await createClienteMedios({
        ruc: row.cliente_ruc.trim(),
        nombre: (row.cliente ?? row.cliente_ruc).trim(),
      })
      toast.success("Cliente marcado como medios.")
      setMediosRucs((prev) => new Set(prev).add(row.cliente_ruc!.trim()))
      void getFacturasResumen(bounds).then(setResumen)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "No se pudo marcar como medios.")
    } finally {
      setMarcandoRuc(null)
    }
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

  const avisoMediosSinConfig = (resumen?.clientes_medios_configurados ?? 0) === 0

  return (
    <>
      <PageHeader
        title="Facturas"
        description="Facturas electrónicas (FAC) emitidas en Contífico. Montos sin IVA. Solo lectura — la emisión desde prometIO sigue diferida."
        action={
          esAdmin ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setMediosDialogOpen(true)}>
              <Settings2 className="size-4" strokeWidth={1.75} />
              Clientes de medios
            </Button>
          ) : null
        }
      />

      <div className="filter-bar mb-4">
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
            Si elegís fechas, el rango por meses no aplica. El resumen y la lista usan el mismo rango.
          </p>
        ) : null}
        {!cuentaVerificada ? (
          <p className="text-kicker text-warning sm:basis-full">
            La cuenta de Contífico todavía no fue verificada como la de Geeks.
          </p>
        ) : null}
      </div>

      {resumen ? (
        <FacturasResumenPanel resumen={resumen} avisoMediosSinConfig={avisoMediosSinConfig} />
      ) : resumenError ? (
        <div className="mb-6 flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
          <TriangleAlert className="size-5 shrink-0 text-destructive" strokeWidth={1.75} />
          <p className="text-kicker">{resumenError}</p>
        </div>
      ) : (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((key) => (
            <div key={key} className="surface-card h-28 animate-pulse bg-muted/40" />
          ))}
        </div>
      )}

      <h2 className="text-section mb-3">Detalle de facturas</h2>
      <div className="filter-bar mb-4">
        <div className="filter-field min-w-0 flex-1 sm:max-w-md">
          <Label htmlFor="facturas-cliente">Filtrar por cliente</Label>
          <Input
            id="facturas-cliente"
            value={cliente}
            onChange={(event) => setCliente(event.target.value)}
            placeholder="Nombre o razón social"
            className="h-9"
          />
        </div>
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
        <EmptyState icon={Receipt} title="Sin facturas" body={emptyBody()} />
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
                  label="Subtotal"
                  active={ordenPor === "valor"}
                  direction={ordenDireccion}
                  align="right"
                  onClick={() => toggleSort("valor")}
                />
                <TableHead>Estado</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows!.map((row) => {
                const ruc = row.cliente_ruc?.trim() ?? ""
                const yaMedios = ruc !== "" && mediosRucs.has(ruc)
                return (
                  <TableRow key={`${row.numero}-${row.fecha_emision}`}>
                    <TableCell className="text-ui-medium">{row.numero}</TableCell>
                    <TableCell className="text-muted-foreground">{row.fecha_emision}</TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <p>{row.cliente ?? "—"}</p>
                        {ruc ? <p className="text-micro text-muted-foreground">{ruc}</p> : null}
                      </div>
                    </TableCell>
                    <TableCell
                      className="max-w-[240px] truncate text-kicker"
                      title={row.resumen_productos ?? undefined}
                    >
                      {row.resumen_productos ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(row.subtotal)}</TableCell>
                    <TableCell>
                      <Badge variant={row.anulado ? "destructive" : "success"}>
                        {row.anulado ? "Anulada" : "Vigente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        {esAdmin && ruc && !yaMedios ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            disabled={marcandoRuc === ruc}
                            onClick={() => void marcarComoMedios(row)}
                          >
                            {marcandoRuc === ruc ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              "Marcar medios"
                            )}
                          </Button>
                        ) : null}
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
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
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

      {esAdmin ? (
        <ClientesMediosDialog
          open={mediosDialogOpen}
          onOpenChange={setMediosDialogOpen}
          onChange={() => {
            void getFacturasResumen(bounds).then(setResumen)
            void listClientesMedios().then((items) => setMediosRucs(new Set(items.map((row) => row.ruc))))
          }}
        />
      ) : null}
    </>
  )
}
