import { Link } from "react-router-dom"

import { TipoActividadMark } from "@/components/pipeline/TipoActividadMark"
import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/costo-interno"
import { formatDateTime } from "@/lib/datetime-local"
import { TIPOS_ACTIVIDAD, type TipoActividad } from "@/types/actividad"
import { CANAL_LABELS, type CanalConversacion } from "@/types/conversacion"
import {
  TIPO_TIMELINE_LABELS,
  esTipoTimeline,
  type TimelineEvento,
  type TipoTimeline,
} from "@/types/timeline"

const BADGE_VARIANTE: Record<TipoTimeline, "success" | "destructive" | "outline"> = {
  actividad_reportada: "success",
  oportunidad_cierre_ganado: "success",
  oportunidad_cierre_perdido: "destructive",
  cotizacion_aprobada: "success",
  lead_convertido: "outline",
}

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

function tipoActividadDe(row: TimelineEvento): TipoActividad | null {
  const raw = textoDetalle(row.detalle, "tipo_actividad")
  return esTipoActividad(raw) ? raw : null
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
  const tipo = esTipoTimeline(row.tipo_evento) ? row.tipo_evento : null
  const actividad = tipoActividadDe(row)
  const dest = destinoEvento(row)
  const resumen = resumenDetalle(row)
  const etiqueta = tipo ? TIPO_TIMELINE_LABELS[tipo] : row.tipo_evento

  const cuerpo = (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          {actividad ? <TipoActividadMark tipo={actividad} size="md" /> : null}
          <Badge variant={tipo ? BADGE_VARIANTE[tipo] : "outline"}>
            {tipo === "actividad_reportada" ? "reportada" : etiqueta}
          </Badge>
        </div>
        {resumen ? <p className="text-ui">{resumen}</p> : null}
        <p className="text-kicker">
          {row.perfil_nombre} · {formatDateTime(row.created_at)}
        </p>
      </div>
    </div>
  )

  if (dest) {
    return (
      <li>
        <Link
          to={dest}
          className="block rounded-xl p-3 ring-1 ring-border transition-colors hover:bg-muted/50"
        >
          {cuerpo}
        </Link>
      </li>
    )
  }

  return <li className="rounded-xl p-3 ring-1 ring-border">{cuerpo}</li>
}
