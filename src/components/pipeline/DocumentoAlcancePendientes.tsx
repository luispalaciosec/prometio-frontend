import { useNavigate } from "react-router-dom"

import { DocumentoAlcanceEstadoBadge } from "@/components/pipeline/DocumentoAlcanceEstadoBadge"
import { Button } from "@/components/ui/button"
import { formatDateTime } from "@/lib/datetime-local"
import type { DocumentoAlcance } from "@/types/documento-alcance"

export type DocumentoAlcancePendienteFila = {
  documento: DocumentoAlcance
  cotizacionNumero: string
  oportunidadId: string
  contactoNombre: string
  empresaNombre: string
}

export function DocumentoAlcancePendientes({ filas }: { filas: DocumentoAlcancePendienteFila[] }) {
  const navigate = useNavigate()
  if (filas.length === 0) {
    return null
  }

  return (
    <section className="mb-8 rounded-xl p-4 ring-1 ring-border">
      <h2 className="text-section">Documentos pendientes de aprobación</h2>
      <p className="mt-1 text-kicker">Alcance en espera de un supervisor o admin.</p>
      <ul className="mt-4 space-y-2">
        {filas.map((fila) => (
          <li
            key={fila.documento.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2 ring-1 ring-border"
          >
            <div className="min-w-0">
              <p className="text-ui-medium">
                {fila.cotizacionNumero}
                <span className="ml-1.5 text-kicker">v{fila.documento.version}</span>
              </p>
              <p className="text-kicker">
                {fila.contactoNombre} · {fila.empresaNombre} · {formatDateTime(fila.documento.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <DocumentoAlcanceEstadoBadge estado={fila.documento.estado} />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  navigate(
                    `/pipeline/${fila.oportunidadId}?cotizacion=${fila.documento.cotizacion_id}&documento=${fila.documento.id}`,
                  )
                }
              >
                Abrir
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
