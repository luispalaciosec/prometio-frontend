import { useState } from "react"

import { TableSkeleton } from "@/components/skeleton"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatMoney } from "@/lib/costo-interno"
import { listHistorialPrecios, type HistorialPreciosResponse } from "@/lib/config-api"
import { ApiError } from "@/lib/api-client"

export function HistorialPreciosDialog({
  servicioId,
  servicioNombre,
  mapeado,
}: {
  servicioId: string
  servicioNombre: string
  mapeado: boolean
}) {
  const [open, setOpen] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [data, setData] = useState<HistorialPreciosResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function abrir() {
    setOpen(true)
    setError(null)
    if (!mapeado) {
      setCargando(false)
      setData(null)
      return
    }
    setCargando(true)
    setData(null)
    try {
      setData(await listHistorialPrecios(servicioId))
    } catch (err) {
      const mensaje =
        err instanceof ApiError
          ? err.detail
          : err instanceof Error
            ? err.message
            : "No se pudo cargar el histórico."
      setError(mensaje)
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => void abrir()}>
        Ver histórico de precios
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl shadow-modal sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Histórico Contífico · {servicioNombre}</DialogTitle>
          </DialogHeader>
          {mapeado ? null : (
            <p className="rounded-md bg-warning/15 px-3 py-2 text-ui text-warning">
              Este servicio no tiene un producto de Contífico mapeado. Un admin lo carga en el
              catálogo de Servicios. Sin ese vínculo no se puede consultar el histórico.
            </p>
          )}
          {mapeado && data?.cuenta_verificada === false ? (
            <p className="rounded-md bg-warning/15 px-3 py-2 text-ui text-warning">
              Fuente de datos sin verificar, no usar como precio de referencia confiable.
            </p>
          ) : null}
          {!mapeado ? null : cargando ? (
            <TableSkeleton rows={4} />
          ) : error ? (
            <div className="rounded-xl bg-destructive/10 px-4 py-3 ring-1 ring-destructive/20">
              <p className="text-ui-medium text-destructive">No se pudo consultar Contífico</p>
              <p className="mt-1 text-kicker text-destructive/90">{error}</p>
            </div>
          ) : data == null ? null : data.resultados.length === 0 ? (
            <p className="text-kicker">No hay documentos recientes para este producto.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Cant.</TableHead>
                  <TableHead>Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.resultados.map((row, index) => (
                  <TableRow key={`${row.fecha_emision}-${index}`}>
                    <TableCell>{row.fecha_emision}</TableCell>
                    <TableCell>{row.cliente ?? "—"}</TableCell>
                    <TableCell>{row.cantidad}</TableCell>
                    <TableCell>{formatMoney(row.precio)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
