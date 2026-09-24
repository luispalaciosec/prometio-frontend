import { apiFetch, apiFetchBlob } from "@/lib/api-client"
import type {
  AuditoriaIaResultado,
  DocumentoAlcance,
  DocumentoAlcanceUpdate,
  RegenerarSeccionBody,
  RegenerarSeccionResponse,
} from "@/types/documento-alcance"

export function listDocumentosAlcance(cotizacionId: string): Promise<DocumentoAlcance[]> {
  return apiFetch(`/cotizaciones/${cotizacionId}/documentos-alcance`)
}

export function crearDocumentoAlcance(
  cotizacionId: string,
  opts?: { generarIa?: boolean },
): Promise<DocumentoAlcance> {
  const generarIa = opts?.generarIa ?? true
  const query = generarIa ? "" : "?generar_ia=false"
  return apiFetch(`/cotizaciones/${cotizacionId}/documentos-alcance${query}`, { method: "POST" })
}

export function getDocumentoAlcance(id: string): Promise<DocumentoAlcance> {
  return apiFetch(`/documentos-alcance/${id}`)
}

export function updateDocumentoAlcance(
  id: string,
  patch: DocumentoAlcanceUpdate,
): Promise<DocumentoAlcance> {
  return apiFetch(`/documentos-alcance/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  })
}

export function enviarAprobacionDocumento(id: string): Promise<DocumentoAlcance> {
  return apiFetch(`/documentos-alcance/${id}/enviar-aprobacion`, { method: "POST" })
}

export function aprobarDocumentoAlcance(id: string): Promise<DocumentoAlcance> {
  return apiFetch(`/documentos-alcance/${id}/aprobar`, { method: "POST" })
}

export function rechazarDocumentoAlcance(id: string): Promise<DocumentoAlcance> {
  return apiFetch(`/documentos-alcance/${id}/rechazar`, { method: "POST" })
}

export function reabrirDocumentoAlcance(id: string): Promise<DocumentoAlcance> {
  return apiFetch(`/documentos-alcance/${id}/reabrir`, { method: "POST" })
}

export function crearNuevaVersionDocumento(id: string): Promise<DocumentoAlcance> {
  return apiFetch(`/documentos-alcance/${id}/nueva-version`, { method: "POST" })
}

export async function descargarPdfDocumentoAlcance(id: string): Promise<void> {
  const { blob, filename } = await apiFetchBlob(`/documentos-alcance/${id}/pdf`)
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename ?? "documento-alcance.pdf"
  link.click()
  URL.revokeObjectURL(url)
}

export async function descargarDocxDocumentoAlcance(id: string): Promise<void> {
  const { blob, filename } = await apiFetchBlob(`/documentos-alcance/${id}/docx`)
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename ?? "documento-alcance.docx"
  link.click()
  URL.revokeObjectURL(url)
}

export function subirDocxDocumentoAlcance(id: string, file: File): Promise<DocumentoAlcance> {
  const body = new FormData()
  body.append("file", file)
  return apiFetch(`/documentos-alcance/${id}/subir-docx`, { method: "POST", body })
}

export function auditarDocumentoAlcance(id: string): Promise<AuditoriaIaResultado> {
  return apiFetch(`/documentos-alcance/${id}/auditar`, { method: "POST" })
}

export function regenerarSeccionDocumento(
  id: string,
  body: RegenerarSeccionBody,
): Promise<RegenerarSeccionResponse> {
  return apiFetch(`/documentos-alcance/${id}/regenerar-seccion`, {
    method: "POST",
    body: JSON.stringify(body),
  })
}
