import { EntityAvatar } from "@/components/entity-avatar"
import { LinkedInLink } from "@/components/linkedin-link"
import { Badge } from "@/components/ui/badge"
import { puedeEnriquecer, type Empresa } from "@/types/empresa"

export function EmpresaCard({ empresa, onOpen }: { empresa: Empresa; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="surface-interactive block p-4 text-left"
    >
      <div className="flex items-start gap-3">
        <EntityAvatar
          name={empresa.nombre}
          seed={empresa.id}
          kind="empresa"
          size="md"
          src={empresa.logo_url}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-ui-medium">{empresa.nombre}</p>
            <LinkedInLink href={empresa.linkedin_url} compact />
          </div>
          <p className="mt-1 truncate text-kicker">{empresa.web ?? "Sin web"}</p>
          <p className="truncate text-kicker">{empresa.ruc ?? "Sin RUC"}</p>
          <div className="mt-2">
            {puedeEnriquecer(empresa) ? (
              <Badge variant="outline">No enriquecida</Badge>
            ) : (
              <Badge variant="success">Enriquecida</Badge>
            )}
            {empresa.activo === false ? <span className="text-kicker">inactiva</span> : null}
          </div>
        </div>
      </div>
    </button>
  )
}
