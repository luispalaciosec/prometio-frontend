import { useEffect, useState } from "react"
import { Receipt, TriangleAlert } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { TableSkeleton } from "@/components/skeleton"
import { ApiError } from "@/lib/api-client"
import { listFacturas } from "@/lib/api/factura"
import { formatMoney } from "@/lib/costo-interno"
import type { FacturaContifico } from "@/types/factura"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

export function FacturasPage() {
  const [meses, setMeses] = useState<number>(6)
  const [rows, setRows] = useState<FacturaContifico[] | null>(null)
  const [cuentaVerificada, setCuentaVerificada] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setRows(null)
    setError(null)
    void listFacturas(meses)
      .then((data) => {
        setCuentaVerificada(data.cuenta_verificada)
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
  }, [meses])

  return (
    <>
      <PageHeader
        title="Facturas"
        description="Facturas electrónicas (FAC) emitidas en Contífico. Solo lectura — la emisión desde prometIO sigue diferida."
      />

      <div className="filter-bar mb-4">
        <div className="filter-field sm:max-w-xs">
          <Label htmlFor="facturas-meses">Período</Label>
          <Select value={String(meses)} onValueChange={(value) => setMeses(Number(value))}>
            <SelectTrigger id="facturas-meses">
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
      ) : rows!.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Sin facturas"
          body={`No hay facturas FAC en Contífico en los últimos ${meses} meses.`}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Documento</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${row.numero}-${row.fecha_emision}`}>
                <TableCell className="text-ui-medium">{row.numero}</TableCell>
                <TableCell className="text-muted-foreground">{row.fecha_emision}</TableCell>
                <TableCell>{row.cliente ?? "—"}</TableCell>
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
      )}
    </>
  )
}
