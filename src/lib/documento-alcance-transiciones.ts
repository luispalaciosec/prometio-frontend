import { generacionEnCurso } from "@/lib/documento-alcance"
import { puedeVerEquipo, puedeVerModuloVentas } from "@/lib/pipeline-acceso"
import type { DocumentoAlcance } from "@/types/documento-alcance"
import type { Perfil } from "@/types/perfil"

export type AccionDocumentoAlcance =
  | "enviar"
  | "aprobar"
  | "rechazar"
  | "reabrir"
  | "nueva_version"
  | "descargar_pdf"

export function puedeEjecutarDocumento(
  accion: AccionDocumentoAlcance,
  perfil: Perfil,
  doc: DocumentoAlcance,
): boolean {
  switch (accion) {
    case "enviar":
      return doc.estado === "borrador" && !generacionEnCurso(doc)
    case "aprobar":
    case "rechazar":
      return doc.estado === "pendiente_aprobacion" && puedeVerEquipo(perfil)
    case "reabrir":
      return doc.estado === "aprobado" && puedeVerModuloVentas(perfil)
    case "nueva_version":
      return documentoUsableParaVersion(doc)
    case "descargar_pdf":
      return doc.estado === "aprobado" && Boolean(doc.pdf_url)
  }
}

function documentoUsableParaVersion(doc: DocumentoAlcance): boolean {
  return !generacionEnCurso(doc) && doc.generacion_ia_estado !== "fallido"
}

export function accionesDocumentoVisibles(
  perfil: Perfil,
  doc: DocumentoAlcance,
): AccionDocumentoAlcance[] {
  const todas: AccionDocumentoAlcance[] = [
    "enviar",
    "aprobar",
    "rechazar",
    "reabrir",
    "nueva_version",
    "descargar_pdf",
  ]
  return todas.filter((accion) => puedeEjecutarDocumento(accion, perfil, doc))
}

export function mensajeSinAccionDocumento(doc: DocumentoAlcance, perfil: Perfil): string {
  if (accionesDocumentoVisibles(perfil, doc).length > 0) {
    return ""
  }
  if (generacionEnCurso(doc)) {
    return "El borrador todavía se está generando."
  }
  if (doc.estado === "pendiente_aprobacion") {
    return "Enviado a aprobación. Solo un supervisor o admin puede aprobar o rechazar."
  }
  return ""
}
