import { Link } from "react-router-dom"

import { TimelineEventoMark } from "@/components/timeline/TimelineEventoMark"
import { formatMoney } from "@/lib/costo-interno"
import { formatTimeOnly } from "@/lib/datetime-local"
import { TIPOS_ACTIVIDAD, type TipoActividad } from "@/types/actividad"
import { CANAL_LABELS, type CanalConversacion } from "@/types/conversacion"
import type { TimelineEvento } from "@/types/timeline"

function textoDetalle(detalle: Record<string, unknown>, key: string): string | null {
  const value = detalle[key]
  return typeof value === "string" && value.trim() !== "" ? value : null
}

function numeroDetalle(detalle: Record<string, unknown>, key: string): number | null {
  const value = detalle[key]
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function esTipoActividad(value: string | null): value is TipoActividad {
  return value != null && (TIPOS_ACTIVIDAD as readonly string[]).includes(value)
}

function esCanal(value: string | null): value is CanalConversacion {
  return value != null && value in CANAL_LABELS
}

function destinoEvento(row: TimelineEvento): string | null {
  if (row.entidad_tipo === "oportunidad") {
    return `/pipeline/${row.entidad_id}`
  }
  if (row.entidad_tipo === "contacto") {
    return `/contactos/${row.entidad_id}`
  }
  return null
}

function resumenDetalle(row: TimelineEvento): string | null {
  const partes: string[] = []
  const empresa = textoDetalle(row.detalle, "empresa_nombre")
  const contacto = textoDetalle(row.detalle, "contacto_nombre")
  const numero = textoDetalle(row.detalle, "numero")
  const canal = textoDetalle(row.detalle, "canal")
  const tipo = textoDetalle(row.detalle, "tipo_actividad")
  const valor = numeroDetalle(row.detalle, "valor")
  const total = numeroDetalle(row.detalle, "total")

  if (empresa) {
    partes.push(empresa)
  }
  if (contacto) {
    partes.push(contacto)
  }
  if (numero) {
    partes.push(numero)
  }
  if (canal) {
    partes.push(esCanal(canal) ? CANAL_LABELS[canal] : canal)
  }
  if (tipo && !esTipoActividad(tipo)) {
    partes.push(tipo)
  }
  if (valor != null) {
    partes.push(formatMoney(valor))
  }
  if (total != null) {
    partes.push(formatMoney(total))
  }
  return partes.length > 0 ? partes.join(" · ") : null
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
        className="block cursor-pointer rounded-xl p-3 ring-1 ring-border transition-colors hover:bg-muted/50"
      >
        {cuerpo}
      </Link>
    )
  }

  return <div className="rounded-xl p-3 ring-1 ring-border">{cuerpo}</div>
}
