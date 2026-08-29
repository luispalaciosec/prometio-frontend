import { Badge } from "@/components/ui/badge"
import { documentoVigente, generacionEnCurso } from "@/lib/documento-alcance"
import {
  DOCUMENTO_ALCANCE_ESTADO_LABELS,
  type DocumentoAlcance,
  type DocumentoAlcanceEstado,
} from "@/types/documento-alcance"

const VARIANTS: Record<DocumentoAlcanceEstado, "outline" | "warning" | "success" | "destructive"> = {
  borrador: "outline",
  pendiente_aprobacion: "warning",
  aprobado: "success",
  rechazado: "destructive",
}

export function DocumentoAlcanceEstadoBadge({ estado }: { estado: DocumentoAlcanceEstado }) {
  return <Badge variant={VARIANTS[estado]}>{DOCUMENTO_ALCANCE_ESTADO_LABELS[estado]}</Badge>
}

export function DocumentoAlcanceIndicador({ docs }: { docs: DocumentoAlcance[] | undefined }) {
  if (docs == null) {
    return <span className="text-kicker">…</span>
  }
  const cabecera = documentoVigente(docs)
  if (!cabecera) {
    return <span className="text-kicker">Sin alcance</span>
  }
  if (generacionEnCurso(cabecera)) {
    return <Badge variant="warning">Generando…</Badge>
  }
  return <DocumentoAlcanceEstadoBadge estado={cabecera.estado} />
}
