import { TimelineEventoMark } from "@/components/timeline/TimelineEventoMark"
import { formatMoney } from "@/lib/costo-interno"
import { formatTimeOnly } from "@/lib/datetime-local"
import { cn } from "@/lib/utils"
import { CANAL_LABELS, type CanalConversacion } from "@/types/conversacion"
import { TIPO_TIMELINE_LABELS, esTipoTimeline, type TimelineEvento } from "@/types/timeline"

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

function esCanal(value: string | null): value is CanalConversacion {
  return value != null && value in CANAL_LABELS
}

function resumenDetalle(row: TimelineEvento): string | null {
  const partes: string[] = []
  const empresa = textoDetalle(row.detalle, "empresa_nombre")
  const contacto = textoDetalle(row.detalle, "contacto_nombre")
  const numero = textoDetalle(row.detalle, "numero")
  const canal = textoDetalle(row.detalle, "canal")
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
  if (valor != null) {
    partes.push(formatMoney(valor))
  }
  if (total != null) {
    partes.push(formatMoney(total))
  }
  return partes.length > 0 ? partes.join(" · ") : null
}

export function TvTimelineFila({ row, compact = false }: { row: TimelineEvento; compact?: boolean }) {
  const resumen = resumenDetalle(row)
  const tipo = esTipoTimeline(row.tipo_evento) ? TIPO_TIMELINE_LABELS[row.tipo_evento] : row.tipo_evento

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-lg ring-1 ring-border/80",
        compact ? "p-2" : "gap-3 rounded-xl p-3",
      )}
    >
      <TimelineEventoMark row={row} size={compact ? "sm" : "md"} />
      <div className="min-w-0 flex-1">
        <p className={cn("truncate", compact ? "text-micro font-medium text-foreground" : "text-ui-medium")}>
          {tipo}
        </p>
        {resumen ? (
          <p
            className={cn(
              "mt-0.5 text-muted-foreground",
              compact ? "line-clamp-2 text-micro" : "text-ui",
            )}
          >
            {resumen}
          </p>
        ) : null}
        <p className={cn("mt-0.5 text-muted-foreground", compact ? "truncate text-micro" : "mt-1 text-kicker")}>
          {row.perfil_nombre} · {formatTimeOnly(row.created_at)}
        </p>
      </div>
    </div>
  )
}
