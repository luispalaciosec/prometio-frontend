import { TimelineEventoMark } from "@/components/timeline/TimelineEventoMark"
import { formatMoney } from "@/lib/costo-interno"
import { formatTimeOnly } from "@/lib/datetime-local"
import { CANAL_LABELS, type CanalConversacion } from "@/types/conversacion"
import { labelTipoTimeline, type TimelineEvento } from "@/types/timeline"

const TV_ACTIVIDAD_MAX = 8

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

/** Una línea corta: entidad + monto/código, sin repetir el tipo de evento. */
function resumenTv(row: TimelineEvento): string | null {
  const partes: string[] = []
  const empresa = textoDetalle(row.detalle, "empresa_nombre")
  const contacto = textoDetalle(row.detalle, "contacto_nombre")
  const numero = textoDetalle(row.detalle, "numero")
  const canal = textoDetalle(row.detalle, "canal")
  const valor = numeroDetalle(row.detalle, "valor")
  const total = numeroDetalle(row.detalle, "total")

  if (empresa) {
    partes.push(empresa)
  } else if (contacto) {
    partes.push(contacto)
  }
  if (numero) {
    partes.push(numero)
  }
  if (valor != null) {
    partes.push(formatMoney(valor))
  } else if (total != null) {
    partes.push(formatMoney(total))
  }
  if (canal) {
    partes.push(esCanal(canal) ? CANAL_LABELS[canal] : canal)
  }

  return partes.length > 0 ? partes.join(" · ") : null
}

function TvActividadItem({ row }: { row: TimelineEvento }) {
  const resumen = resumenTv(row)

  return (
    <div className="flex min-h-0 items-start gap-2.5">
      <TimelineEventoMark row={row} size="sm" showLabel={false} />
      <div className="min-w-0 flex-1">
        <p className="text-ui-medium leading-snug">{labelTipoTimeline(row.tipo_evento)}</p>
        {resumen ? (
          <p className="mt-0.5 break-words text-micro leading-snug text-muted-foreground">{resumen}</p>
        ) : null}
        <p className="mt-0.5 text-micro text-muted-foreground">
          {formatTimeOnly(row.created_at)}
          <span className="mx-1 opacity-40">·</span>
          {row.perfil_nombre}
        </p>
      </div>
    </div>
  )
}

export function TvActividadReciente({ eventos }: { eventos: TimelineEvento[] }) {
  const visibles = eventos.slice(0, TV_ACTIVIDAD_MAX)

  return (
    <aside className="flex min-h-0 w-full shrink-0 flex-col lg:w-[min(19rem,21vw)]">
      <h2 className="mb-3 shrink-0 text-kicker font-medium text-foreground">Actividad reciente</h2>
      {visibles.length === 0 ? (
        <p className="text-micro text-muted-foreground">Sin eventos recientes.</p>
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col justify-between overflow-hidden rounded-xl bg-muted/20 px-3 py-2 ring-1 ring-border">
          {visibles.map((row) => (
            <li
              key={row.id}
              className="min-h-0 border-b border-border/60 py-2.5 last:border-b-0 last:pb-1 first:pt-1"
            >
              <TvActividadItem row={row} />
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
