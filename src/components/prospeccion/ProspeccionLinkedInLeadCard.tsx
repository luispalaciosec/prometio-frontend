import { ExternalLink, MapPin } from "lucide-react"

import { LinkedInLink } from "@/components/linkedin-link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDateTime } from "@/lib/datetime-local"
import type { ProspeccionLinkedinLead } from "@/types/prospeccion-linkedin"

export function ProspeccionLinkedInLeadCard({
  lead,
  busy,
  onRevisado,
  onDescartar,
  onConvertir,
}: {
  lead: ProspeccionLinkedinLead
  busy: boolean
  onRevisado: () => void
  onDescartar: () => void
  onConvertir: () => void
}) {
  const postExtracto =
    lead.post_texto && lead.post_texto.length > 280
      ? `${lead.post_texto.slice(0, 280).trim()}…`
      : lead.post_texto

  return (
    <article className="surface-card space-y-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-ui-medium">{lead.nombre}</p>
            <LinkedInLink href={lead.linkedin_url} compact />
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
        </div>
        {lead.criterio_busqueda_texto ? (
          <Badge variant="outline" className="max-w-[min(100%,14rem)] truncate">
            {lead.criterio_busqueda_texto}
          </Badge>
        ) : null}
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
      {lead.estado === "nuevo" ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onRevisado}>
            Revisado
          </Button>
          <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={onDescartar}>
            Descartar
          </Button>
          <Button type="button" size="sm" disabled={busy} onClick={onConvertir}>
            Convertir a contacto
          </Button>
        </div>
      ) : null}
    </article>
  )
}
