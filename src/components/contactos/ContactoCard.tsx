import { EntityAvatar } from "@/components/entity-avatar"
import { EtapaCicloBadge } from "@/components/contactos/EtapaCicloBadge"
import { LinkedInLink } from "@/components/linkedin-link"
import type { Contacto } from "@/types/contacto"

export function ContactoCard({
  contacto,
  empresaNombre,
  onOpen,
}: {
  contacto: Contacto
  empresaNombre: string | null
  onOpen: () => void
}) {
  const secundario = contacto.email_trabajo ?? contacto.telefono_movil ?? "—"

  return (
    <button
      type="button"
      onClick={onOpen}
      className="rounded-xl p-4 text-left ring-1 ring-border transition-shadow duration-150 hover:shadow-raised hover:ring-foreground/20"
    >
      <div className="flex items-start gap-3">
        <EntityAvatar
          name={contacto.nombre_completo}
          seed={contacto.id}
          size="md"
          src={contacto.foto_url}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-ui-medium">{contacto.nombre_completo}</p>
            <LinkedInLink href={contacto.linkedin_url} compact />
          </div>
          {contacto.cargo ? <p className="truncate text-kicker">{contacto.cargo}</p> : null}
          <p className="mt-1 truncate text-kicker">{secundario}</p>
          <p className="truncate text-kicker">{empresaNombre ?? "Sin empresa"}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <EtapaCicloBadge etapa={contacto.etapa_ciclo_vida} />
            {!contacto.activo ? <span className="text-kicker">inactivo</span> : null}
          </div>
        </div>
      </div>
    </button>
  )
}
