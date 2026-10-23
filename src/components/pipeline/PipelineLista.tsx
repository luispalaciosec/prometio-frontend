import { MoreHorizontal } from "lucide-react"

import { AlertaEstadoBadge } from "@/components/alertas/AlertaEstadoBadge"
import { LeadScoreBadge } from "@/components/pipeline/LeadScoreBadge"
import { OportunidadValor } from "@/components/pipeline/OportunidadValor"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { oportunidadNombreLibre } from "@/lib/oportunidad-presentacion"
import type { EstadoAlerta } from "@/types/alerta"
import type { EtapaPipeline } from "@/types/etapa-pipeline"
import type { OportunidadKanban } from "@/types/oportunidad"

const DIA_MS = 86_400_000

/**
 * Días sin actividad: desde la última actividad o, si nunca hubo, desde la creación. Es la misma referencia con la que
 * el backend calcula la alerta de estancamiento contra el umbral de la etapa.
 */
function diasSinActividad(row: OportunidadKanban, ahora: number): number | null {
  const referencia = Date.parse(row.fecha_ultima_actividad ?? row.created_at)
  if (Number.isNaN(referencia)) {
    return null
  }
  return Math.max(0, Math.floor((ahora - referencia) / DIA_MS))
}

function textoDias(dias: number | null): string {
  if (dias == null) {
    return "—"
  }
  if (dias === 0) {
    return "Hoy"
  }
  return dias === 1 ? "1 día" : `${dias} días`
}

export function PipelineLista({
  items,
  etapas,
  alertasPorId,
  mostrarEjecutivo,
  mostrarEtapa = true,
  onReasignar,
  onAbrir,
}: {
  items: OportunidadKanban[]
  etapas: EtapaPipeline[]
  alertasPorId?: Map<string, EstadoAlerta>
  mostrarEjecutivo: boolean
  /** Con un filtro de etapa activo, la columna repetiría el mismo valor en todas las filas. */
  mostrarEtapa?: boolean
  onReasignar?: (id: string) => void
  onAbrir: (id: string) => void
}) {
  const nombreEtapa = new Map(etapas.map((etapa) => [etapa.codigo, etapa.nombre]))
  const ahora = Date.now()

  if (items.length === 0) {
    return null
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Oportunidad</TableHead>
          <TableHead>Empresa</TableHead>
          <TableHead className="text-center" title="Lead score de 0 a 100: frescura, seguimiento, respuesta, tamaño y fit">
            Score
          </TableHead>
          <TableHead title="Días desde la última actividad (o desde la creación). Es lo que dispara la alerta de la etapa">
            Sin actividad
          </TableHead>
          {mostrarEtapa ? <TableHead>Etapa</TableHead> : null}
          {mostrarEjecutivo ? <TableHead>Ejecutivo</TableHead> : null}
          <TableHead className="text-right">Valor</TableHead>
          <TableHead className="w-0">
            <span className="sr-only">Acciones</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((row) => {
          const alerta = alertasPorId?.get(row.id)
          const nombreLibre = oportunidadNombreLibre(row.nombre)
          const dias = diasSinActividad(row, ahora)
          return (
            <TableRow key={row.id} className="cursor-pointer" onClick={() => onAbrir(row.id)}>
              <TableCell className="whitespace-normal">
                <p className="text-ui-medium">{nombreLibre ?? row.contacto.nombre_completo}</p>
                {nombreLibre ? (
                  <p className="text-kicker text-muted-foreground">{row.contacto.nombre_completo}</p>
                ) : null}
              </TableCell>
              <TableCell className="whitespace-normal text-ui">{row.empresa.nombre}</TableCell>
              <TableCell className="text-center">
                <LeadScoreBadge score={row.lead_score} />
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-2">
                  <span className={alerta ? "tabular-nums text-ui" : "tabular-nums text-muted-foreground"}>
                    {textoDias(dias)}
                  </span>
                  {alerta ? <AlertaEstadoBadge estado={alerta} /> : null}
                </span>
              </TableCell>
              {mostrarEtapa ? (
                <TableCell className="text-ui">{nombreEtapa.get(row.etapa) ?? row.etapa}</TableCell>
              ) : null}
              {mostrarEjecutivo ? (
                <TableCell className="text-muted-foreground">{row.ejecutivo.nombre_completo}</TableCell>
              ) : null}
              <TableCell className="text-right">
                <OportunidadValor valor_referencial={row.valor_referencial} valor_cotizado={row.valor_cotizado} />
              </TableCell>
              <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" aria-label="Acciones de la oportunidad">
                      <MoreHorizontal className="size-4" strokeWidth={1.75} aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onAbrir(row.id)}>Abrir</DropdownMenuItem>
                    {onReasignar ? (
                      <DropdownMenuItem onSelect={() => onReasignar(row.id)}>Reasignar</DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
