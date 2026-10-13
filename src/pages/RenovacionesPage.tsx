import { useEffect, useState } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import { CalendarCheck } from "lucide-react"
import { toast } from "sonner"

import type { ContratosOutletContext } from "@/components/contratos/ContratosLayout"
import { ContratoRenovarDialog } from "@/components/contratos/ContratoRenovarDialog"
import { EmptyState } from "@/components/empty-state"
import { TableSkeleton } from "@/components/skeleton"
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
import { getContrato, listRenovaciones } from "@/lib/api/contrato-recurrente"
import { textoDiasParaVencer } from "@/lib/contrato-recurrente"
import { formatMoney } from "@/lib/costo-interno"
import { formatDateOnly } from "@/lib/datetime-local"
import type { ContratoRecurrente, ContratoRenovacion } from "@/types/contrato-recurrente"

const VENTANAS = ["config", "30", "60", "90", "180"] as const
type Ventana = (typeof VENTANAS)[number]

export function RenovacionesPage() {
  const navigate = useNavigate()
  const { servicios, categorias, version, recargar } = useOutletContext<ContratosOutletContext>()
  const [rows, setRows] = useState<ContratoRenovacion[] | null>(null)
  const [ventana, setVentana] = useState<Ventana>("config")
  const [abriendoId, setAbriendoId] = useState<string | null>(null)
  const [renovando, setRenovando] = useState<ContratoRecurrente | null>(null)

  useEffect(() => {
    let cancelled = false
    setRows(null)
    void listRenovaciones(ventana === "config" ? null : Number(ventana))
      .then((data) => {
        if (!cancelled) {
          setRows(data)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "No se pudieron cargar las renovaciones.")
          setRows([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [ventana, version])

  async function abrirRenovar(contratoId: string) {
    setAbriendoId(contratoId)
    try {
      setRenovando(await getContrato(contratoId))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo abrir el contrato.")
    } finally {
      setAbriendoId(null)
    }
  }

  return (
    <>
      <div className="filter-bar">
        <div className="filter-field">
          <Label htmlFor="renovaciones-ventana">Vencen dentro de</Label>
          <Select value={ventana} onValueChange={(value) => setVentana(value as Ventana)}>
            <SelectTrigger id="renovaciones-ventana">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="config">El aviso configurado</SelectItem>
              <SelectItem value="30">30 días</SelectItem>
              <SelectItem value="60">60 días</SelectItem>
              <SelectItem value="90">90 días</SelectItem>
              <SelectItem value="180">180 días</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-kicker max-w-xl">
          Incluye los que ya vencieron sin renovar (hasta 90 días atrás). Ordenados por fecha de fin.
        </p>
      </div>
      {rows == null ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="Nada por renovar"
          body="Ningún contrato vence en esa ventana ni quedó vencido sin renovar."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contrato</TableHead>
              <TableHead>Fin</TableHead>
              <TableHead>Plazo</TableHead>
              <TableHead className="text-right">Subtotal mensual</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.contrato_id}
                className="cursor-pointer"
                onClick={() => navigate(`/contratos/${row.contrato_id}`)}
              >
                <TableCell className="whitespace-normal">
                  <p className="text-ui-medium">{row.nombre}</p>
                  <p className="text-kicker text-muted-foreground">{row.empresa_nombre ?? "—"}</p>
                </TableCell>
                <TableCell className="text-ui">{formatDateOnly(row.fecha_fin)}</TableCell>
                <TableCell>
                  <Badge variant={row.dias_para_vencer < 0 ? "destructive" : "warning"}>
                    {textoDiasParaVencer(row.dias_para_vencer)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums text-ui">
                  {formatMoney(row.monto_mensual_total)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={abriendoId === row.contrato_id}
                    onClick={(event) => {
                      event.stopPropagation()
                      void abrirRenovar(row.contrato_id)
                    }}
                  >
                    Renovar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <ContratoRenovarDialog
        contrato={renovando}
        servicios={servicios}
        categorias={categorias}
        onCancel={() => setRenovando(null)}
        onRenovado={() => {
          setRenovando(null)
          recargar()
        }}
      />
    </>
  )
}
