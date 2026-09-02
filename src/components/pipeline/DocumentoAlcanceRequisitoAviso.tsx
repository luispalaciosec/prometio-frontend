import { CheckCircle2, ScrollText } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { DocumentoAlcance } from "@/types/documento-alcance"

function documentoAlcanceAprobado(documentos: DocumentoAlcance[] | undefined): boolean {
  return documentos?.some((row) => row.estado === "aprobado") === true
}

export function DocumentoAlcanceRequisitoAviso({
  requiereDocumento,
  documentos,
}: {
  requiereDocumento: boolean
  documentos: DocumentoAlcance[] | undefined
}) {
  if (!requiereDocumento) {
    return null
  }

  const aprobado = documentoAlcanceAprobado(documentos)

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl px-4 py-3 ring-1",
        aprobado ? "bg-success/10 ring-success/30" : "bg-warning/10 ring-warning/30",
      )}
      role="status"
    >
      <span
        className={cn(
          "inline-flex size-11 shrink-0 items-center justify-center rounded-xl",
          aprobado ? "bg-success/15 text-success" : "bg-warning/15 text-warning",
        )}
      >
        {aprobado ? (
          <CheckCircle2 className="size-5" strokeWidth={1.75} />
        ) : (
          <ScrollText className="size-5" strokeWidth={1.75} />
        )}
      </span>
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={aprobado ? "success" : "warning"}>
            {aprobado ? "Alcance aprobado" : "Alcance requerido"}
          </Badge>
        </div>
        <p className="text-kicker">
          {aprobado
            ? "Documento de Alcance aprobado — esta cotización cumple el requisito para enviarse."
            : "Esta cotización necesita un Documento de Alcance aprobado antes de poder enviarse."}
        </p>
      </div>
    </div>
  )
}
