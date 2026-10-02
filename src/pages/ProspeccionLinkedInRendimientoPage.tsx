import { useEffect, useState } from "react"
import { toast } from "sonner"
import { BarChart3 } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { TableSkeleton } from "@/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { listProspeccionLinkedinCriteriosResumen } from "@/lib/api/prospeccion-linkedin"
import type { ProspeccionLinkedinCriterioResumen } from "@/types/prospeccion-linkedin"

export function ProspeccionLinkedInRendimientoPage() {
  const [rows, setRows] = useState<ProspeccionLinkedinCriterioResumen[] | null>(null)

  useEffect(() => {
    void listProspeccionLinkedinCriteriosResumen()
      .then(setRows)
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "No se pudo cargar el resumen.")
        setRows([])
      })
  }, [])

  if (rows == null) {
    return <TableSkeleton rows={5} />
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Sin datos de criterios"
        body="Cuando haya leads asociados a criterios de búsqueda, acá verás volumen y conversión por criterio."
      />
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Criterio</TableHead>
            <TableHead className="text-right">Total leads</TableHead>
            <TableHead className="text-right">Convertidos</TableHead>
            <TableHead className="text-right">Tasa conversión</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.criterio_busqueda_id}>
              <TableCell className="text-ui-medium max-w-md">{row.criterio_busqueda_texto}</TableCell>
              <TableCell className="text-ui text-right tabular-nums">{row.total_leads}</TableCell>
              <TableCell className="text-ui text-right tabular-nums">{row.convertidos}</TableCell>
              <TableCell className="text-ui text-right tabular-nums">
                {row.tasa_conversion_pct.toFixed(1)} %
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
