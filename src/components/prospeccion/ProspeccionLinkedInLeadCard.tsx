import { useEffect, useState } from "react"
import { ChevronDown, ExternalLink, Loader2, MapPin } from "lucide-react"

import { LinkedInLink } from "@/components/linkedin-link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDateOnly, formatDateTime } from "@/lib/datetime-local"
import { cn } from "@/lib/utils"
import {
  PROSPECCION_PRIORIDAD_ALTA_MIN,
  type ProspeccionLinkedinLead,
} from "@/types/prospeccion-linkedin"

function leadTieneInvestigacion(lead: ProspeccionLinkedinLead): boolean {
  return lead.investigado_en != null
}

export function ProspeccionLinkedInLeadCard({
  lead,
  busy,
  investigando,
  onRevisado,
  onDescartar,
  onConvertir,
  onInvestigar,
}: {
  lead: ProspeccionLinkedinLead
  busy: boolean
  investigando: boolean
  onRevisado: () => void
  onDescartar: () => void
  onConvertir: () => void
  onInvestigar: () => void
}) {
  const [iaAbierta, setIaAbierta] = useState(() => leadTieneInvestigacion(lead))

  useEffect(() => {
    if (leadTieneInvestigacion(lead)) {
      setIaAbierta(true)
    }
  }, [lead.investigado_en, lead.id])

  const postExtracto =
    lead.post_texto && lead.post_texto.length > 280
      ? `${lead.post_texto.slice(0, 280).trim()}…`
      : lead.post_texto

  const prioridad = lead.prioridad ?? 0
  const prioridadAlta = prioridad >= PROSPECCION_PRIORIDAD_ALTA_MIN
  const tieneIa = leadTieneInvestigacion(lead)

  return (
    <article className="surface-card space-y-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-ui-medium">{lead.nombre}</p>
            <LinkedInLink href={lead.linkedin_url} compact />
            {prioridadAlta ? (
              <Badge variant="warning">Alta prioridad</Badge>
            ) : null}
          </div>
          {lead.headline ? (
            <p className="text-kicker text-muted-foreground">{lead.headline}</p>
          ) : null}
          {lead.ubicacion ? (
            <p className="flex items-center gap-1 text-kicker text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
              {lead.ubicacion}
            </p>
          ) : null}
          {lead.empresa_actual ? (
            <p className="text-kicker">
              Empresa actual: <span className="text-ui">{lead.empresa_actual}</span>
            </p>
          ) : null}
          {lead.fecha_inicio_cargo ? (
            <p className="text-kicker text-muted-foreground">
              En el cargo desde {formatDateOnly(lead.fecha_inicio_cargo)}
            </p>
          ) : null}
          {lead.categoria_servicio_nombre ? (
            <p className="text-kicker">
              Categoría:{" "}
              <span className="text-ui text-muted-foreground">{lead.categoria_servicio_nombre}</span>
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-1">
          {lead.criterio_busqueda_texto ? (
            <Badge variant="outline" className="max-w-[min(100%,14rem)] truncate">
              {lead.criterio_busqueda_texto}
            </Badge>
          ) : null}
          {!prioridadAlta && prioridad > 0 ? (
            <span className="text-micro tabular-nums text-muted-foreground">
              Prioridad {prioridad}
            </span>
          ) : null}
        </div>
      </div>
      {postExtracto ? (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-kicker whitespace-pre-wrap">{postExtracto}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-micro text-muted-foreground">
            {lead.post_fecha ? <span>{formatDateTime(lead.post_fecha)}</span> : null}
            {lead.post_url ? (
              <a
                href={lead.post_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
              >
                Ver post original
                <ExternalLink className="size-3" strokeWidth={1.75} aria-hidden />
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      {tieneIa ? (
        <div className="rounded-lg border border-border">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
            onClick={() => setIaAbierta((prev) => !prev)}
          >
            <span className="text-ui-medium">Investigación con IA</span>
            <ChevronDown
              className={cn("size-4 shrink-0 transition-transform", iaAbierta && "rotate-180")}
              strokeWidth={1.75}
              aria-hidden
            />
          </button>
          {iaAbierta ? (
            <div className="space-y-3 border-t border-border px-3 py-3">
              {(lead.empresa_industria || lead.empresa_tamano || lead.empresa_sitio_web) && (
                <dl className="grid gap-2 sm:grid-cols-2">
                  {lead.empresa_industria ? (
                    <div>
                      <dt className="text-micro text-muted-foreground">Industria</dt>
                      <dd className="text-kicker">{lead.empresa_industria}</dd>
                    </div>
                  ) : null}
                  {lead.empresa_tamano ? (
                    <div>
                      <dt className="text-micro text-muted-foreground">Tamaño</dt>
                      <dd className="text-kicker">{lead.empresa_tamano}</dd>
                    </div>
                  ) : null}
                  {lead.empresa_sitio_web ? (
                    <div className="sm:col-span-2">
                      <dt className="text-micro text-muted-foreground">Sitio web</dt>
                      <dd className="text-kicker">
                        <a
                          href={lead.empresa_sitio_web}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {lead.empresa_sitio_web}
                        </a>
                      </dd>
                    </div>
                  ) : null}
                </dl>
              )}
              {lead.resumen_ia ? (
                <div>
                  <p className="text-micro text-muted-foreground">Por qué contactarlo ahora</p>
                  <p className="mt-1 text-kicker whitespace-pre-wrap">{lead.resumen_ia}</p>
                </div>
              ) : null}
              {lead.mensaje_sugerido_ia ? (
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-micro text-muted-foreground">Mensaje sugerido</p>
                  <p className="mt-1 text-kicker whitespace-pre-wrap">{lead.mensaje_sugerido_ia}</p>
                </div>
              ) : null}
              {lead.investigado_en ? (
                <p className="text-micro text-muted-foreground">
                  Investigado {formatDateTime(lead.investigado_en)}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy || investigando}
          onClick={onInvestigar}
        >
          {investigando ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" strokeWidth={1.75} aria-hidden />
              Investigando…
            </span>
          ) : tieneIa ? (
            "Volver a investigar"
          ) : (
            "Investigar con IA"
          )}
        </Button>
        {lead.estado === "nuevo" ? (
          <>
            <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onRevisado}>
              Revisado
            </Button>
            <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={onDescartar}>
              Descartar
            </Button>
            <Button type="button" size="sm" disabled={busy} onClick={onConvertir}>
              Convertir a contacto
            </Button>
          </>
        ) : null}
      </div>
    </article>
  )
}
