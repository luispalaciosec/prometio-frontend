import { Trophy } from "lucide-react"

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
import { etiquetaEjecutivo } from "@/lib/api/oportunidad"
import { formatPeriodo, hoyEcuador } from "@/lib/contrato-recurrente"
import { formatMoney } from "@/lib/costo-interno"
import { rankingVendedores } from "@/lib/dashboard-comercial"
import { cn } from "@/lib/utils"
import type { MetaVendedor } from "@/types/dashboard"
import type { EtapaPipeline } from "@/types/etapa-pipeline"
import type { Oportunidad } from "@/types/oportunidad"
import type { Perfil } from "@/types/perfil"

export function DashboardRankingVendedores({
  perfil,
  oportunidades,
  etapas,
  metasPorVendedor,
}: {
  perfil: Perfil
  oportunidades: Oportunidad[] | null
  etapas: EtapaPipeline[] | null
  metasPorVendedor: MetaVendedor[]
}) {
  const hoy = hoyEcuador()
  const desde = `${hoy.slice(0, 7)}-01`
  const mes = formatPeriodo(desde, true)
  const metas = new Map(metasPorVendedor.map((row) => [row.perfil_id, row]))
  const filas = oportunidades && etapas ? rankingVendedores(oportunidades, etapas, desde, hoy) : null

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-section">Ranking de vendedores</h2>
        <p className="mt-1 text-kicker text-muted-foreground">
          Ganado en {mes} según el CRM (fecha de cierre), sin IVA. El avance usa el período de la
          meta de cada vendedor.
        </p>
      </div>
      {filas == null ? (
        <TableSkeleton rows={4} />
      ) : filas.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Sin movimiento"
          body="Nadie tiene oportunidades abiertas ni cierres este mes."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-0">#</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead className="text-right">Ganadas</TableHead>
              <TableHead className="text-right">Cerrado</TableHead>
              <TableHead className="text-right">Pipeline ponderado</TableHead>
              <TableHead className="text-right">Avance meta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.map((fila, index) => {
              const meta = metas.get(fila.ejecutivoId)
              return (
                <TableRow key={fila.ejecutivoId}>
                  <TableCell className={cn("tabular-nums text-muted-foreground", index === 0 && fila.cerrado > 0 && "text-warning")}>
                    {index + 1}
                  </TableCell>
                  <TableCell className="text-ui-medium">{etiquetaEjecutivo(fila.ejecutivoId, perfil)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fila.ganadas}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(fila.cerrado)}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatMoney(fila.ponderado)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {meta ? `${meta.avance_pct.toFixed(0)}% de ${formatMoney(meta.monto_meta)}` : "Sin meta"}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </section>
  )
}
