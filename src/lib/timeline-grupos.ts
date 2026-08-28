import type { TimelineEvento } from "@/types/timeline"
import { formatDateOnly } from "@/lib/datetime-local"

export type GrupoTimeline = {
  clave: string
  label: string
  eventos: TimelineEvento[]
}

function claveDiaLocal(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return "sin-fecha"
  }
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Conserva el orden del API (típicamente más reciente primero). */
export function agruparTimelinePorDia(rows: TimelineEvento[]): GrupoTimeline[] {
  const grupos = new Map<string, GrupoTimeline>()
  for (const row of rows) {
    const clave = claveDiaLocal(row.created_at)
    const existente = grupos.get(clave)
    if (existente) {
      existente.eventos.push(row)
      continue
    }
    grupos.set(clave, {
      clave,
      label: clave === "sin-fecha" ? "Sin fecha" : formatDateOnly(clave),
      eventos: [row],
    })
  }
  return [...grupos.values()]
}
