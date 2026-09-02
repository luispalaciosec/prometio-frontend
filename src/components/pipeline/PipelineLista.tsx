import { AlertaEstadoBadge } from "@/components/alertas/AlertaEstadoBadge"
import { LeadScoreBadge } from "@/components/pipeline/LeadScoreBadge"
import { OportunidadValor } from "@/components/pipeline/OportunidadValor"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { EstadoAlerta } from "@/types/alerta"
import type { EtapaPipeline } from "@/types/etapa-pipeline"
import type { OportunidadKanban } from "@/types/oportunidad"

export function PipelineLista({
  items,
  etapas,
  alertasPorId,
  mostrarEjecutivo,
  onReasignar,
  onAbrir,
}: {
  items: OportunidadKanban[]
  etapas: EtapaPipeline[]
  alertasPorId?: Map<string, EstadoAlerta>
  mostrarEjecutivo: boolean
  onReasignar?: (id: string) => void
  onAbrir: (id: string) => void
}) {
  const nombreEtapa = new Map(etapas.map((etapa) => [etapa.codigo, etapa.nombre]))

  if (items.length === 0) {
    return null
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Contacto</TableHead>
          <TableHead>Empresa</TableHead>
          <TableHead>Etapa</TableHead>
          {mostrarEjecutivo ? <TableHead>Ejecutivo</TableHead> : null}
          <TableHead>Valor</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((row) => {
          const alerta = alertasPorId?.get(row.id)
          return (
            <TableRow
              key={row.id}
              className="cursor-pointer"
              onClick={() => onAbrir(row.id)}
            >
              <TableCell className="text-ui-medium">
                <span className="inline-flex items-center gap-2">
                  {row.contacto.nombre_completo}
                  <LeadScoreBadge score={row.lead_score} />
                  {alerta ? <AlertaEstadoBadge estado={alerta} /> : null}
                </span>
              </TableCell>
              <TableCell className="text-ui">{row.empresa.nombre}</TableCell>
              <TableCell className="text-ui">{nombreEtapa.get(row.etapa) ?? row.etapa}</TableCell>
              {mostrarEjecutivo ? (
                <TableCell className="text-ui">{row.ejecutivo.nombre_completo}</TableCell>
              ) : null}
              <TableCell>
                <OportunidadValor
                  valor_referencial={row.valor_referencial}
                  valor_cotizado={row.valor_cotizado}
                />
              </TableCell>
              <TableCell className="text-right">
                {onReasignar ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation()
                      onReasignar(row.id)
                    }}
                  >
                    Reasignar
                  </Button>
                ) : null}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
