import { useState } from "react"
import { toast } from "sonner"

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
}: {
  servicioId: string
  servicioNombre: string
}) {
  const [open, setOpen] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [data, setData] = useState<HistorialPreciosResponse | null>(null)

  async function abrir() {
    setOpen(true)
    setCargando(true)
    setData(null)
    try {
      setData(await listHistorialPrecios(servicioId))
    } catch (error) {
      const mensaje =
        error instanceof ApiError
          ? error.detail
          : error instanceof Error
            ? error.message
            : "No se pudo cargar el histórico."
      toast.error(mensaje)
      setOpen(false)
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
          {data?.cuenta_verificada === false ? (
            <p className="rounded-md bg-warning/15 px-3 py-2 text-sm text-warning">
              Fuente de datos sin verificar, no usar como precio de referencia confiable.
            </p>
          ) : null}
          {cargando ? (
            <TableSkeleton rows={4} />
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
