import { Link } from "react-router-dom"

import { TimelineEventoMark } from "@/components/timeline/TimelineEventoMark"
import { formatTimeOnly } from "@/lib/datetime-local"
import { resumenDetalle } from "@/lib/timeline-detalle"
import type { TimelineEvento } from "@/types/timeline"

function destinoEvento(row: TimelineEvento): string | null {
  if (row.entidad_tipo === "oportunidad") {
    return `/pipeline/${row.entidad_id}`
  }
  if (row.entidad_tipo === "contacto") {
    return `/contactos/${row.entidad_id}`
  }
  return null
}

export function TimelineEventoFila({ row }: { row: TimelineEvento }) {
  const dest = destinoEvento(row)
  const resumen = resumenDetalle(row)
  const cuerpo = (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <TimelineEventoMark row={row} size="md" />
      </div>
      {resumen ? <p className="pl-10 text-ui">{resumen}</p> : null}
      <p className="pl-10 text-kicker">
        {row.perfil_nombre} · {formatTimeOnly(row.created_at)}
      </p>
    </div>
  )

  if (dest) {
    return (
      <Link
        to={dest}
        className="block cursor-pointer surface-card p-3 transition-colors hover:bg-muted/50"
      >
        {cuerpo}
      </Link>
    )
  }

  return <div className="surface-card p-3">{cuerpo}</div>
}
