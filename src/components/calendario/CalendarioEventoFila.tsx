import { Link } from "react-router-dom"

import { CalendarioEventoMark } from "@/components/calendario/CalendarioEventoMark"
import { Badge } from "@/components/ui/badge"
import { destinoCalendario, tituloEvento } from "@/lib/calendario-rango"
import { formatMoney } from "@/lib/costo-interno"
import { cn } from "@/lib/utils"
import type { EventoCalendario } from "@/types/calendario"

function detalle(evento: EventoCalendario): string | null {
  if (evento.tipo === "cumpleanos") {
    return evento.nombre_completo
  }
  if (evento.tipo === "vencimiento_cotizacion") {
    return `${evento.numero} · ${formatMoney(evento.total)}`
  }
  return null
}

export function CalendarioEventoFila({ evento }: { evento: EventoCalendario }) {
  const dest = destinoCalendario(evento)
  const extra = detalle(evento)
  const cuerpo = (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <CalendarioEventoMark evento={evento} size="md" />
      {evento.tipo === "actividad" ? (
        <Badge variant={evento.reportada ? "success" : "warning"}>
          {evento.reportada ? "reportada" : "programada"}
        </Badge>
      ) : extra ? (
        <p className="min-w-0 truncate text-ui">{extra}</p>
      ) : null}
    </div>
  )

  if (dest) {
    return (
      <Link to={dest} className="block rounded-xl p-3 ring-1 ring-border transition-colors hover:bg-muted/50">
        {cuerpo}
      </Link>
    )
  }

  return <div className="rounded-xl p-3 ring-1 ring-border">{cuerpo}</div>
}

export function CalendarioEventoChip({ evento }: { evento: EventoCalendario }) {
  const dest = destinoCalendario(evento)
  const className = cn(
    "flex min-w-0 items-center gap-1.5 rounded-md px-1 py-0.5",
    dest && "cursor-pointer hover:bg-muted/80",
  )
  const inner = (
    <>
      <CalendarioEventoMark evento={evento} size="sm" showLabel={false} />
      <span className="min-w-0 truncate text-micro text-foreground">{tituloEvento(evento)}</span>
    </>
  )
  if (dest) {
    return (
      <Link to={dest} className={className}>
        {inner}
      </Link>
    )
  }
  return <div className={className}>{inner}</div>
}
