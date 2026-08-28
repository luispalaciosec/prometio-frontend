/**
 * Fachada de cotizaciones. Apunta al backend real (GET/POST /cotizaciones).
 */
import { getOportunidad } from "@/lib/api/oportunidad"
import { apiFetch, apiFetchBlob } from "@/lib/api-client"
import type { AccionCotizacion } from "@/lib/cotizacion-transiciones"
import { puedeVerDesgloseCotizacion } from "@/lib/pipeline-acceso"
import type { CotizacionConLineas } from "@/types/cotizacion"
import type { LineaCotizacionCalculada } from "@/types/linea-cotizacion"
import type { Perfil } from "@/types/perfil"
import type { Proveedor } from "@/types/proveedor"

export type { AccionCotizacion } from "@/lib/cotizacion-transiciones"

export type CrearLineaInput = {
  perfil: Perfil
  cotizacion_id: string
  servicio_id: string
  proveedor_id?: string | null
  costo_proveedor?: number | null
  margen_pct?: number | null
  comision_agencia_pct?: number | null
  cantidad?: number
  descripcion?: string | null
}

export type ActualizarLineaInput = {
  perfil: Perfil
  cotizacion_id: string
  id: string
  proveedor_id?: string | null
  costo_proveedor?: number
  margen_pct?: number
  comision_agencia_pct?: number
  cantidad?: number
  descripcion?: string | null
}

export type PdfCotizacionVariante = "cliente" | "interno"

const TRANSICION_PATH: Record<AccionCotizacion, string> = {
  enviar: "enviar",
  aprobar_preparacion: "aprobar-preparacion",
  rechazar_preparacion: "rechazar-preparacion",
  marcar_aprobada: "marcar-aprobada",
  marcar_rechazada: "marcar-rechazada",
  marcar_vencida: "marcar-vencida",
}

export function listProveedores(): Promise<Proveedor[]> {
  return apiFetch("/proveedores")
}

export function listCotizaciones(
  oportunidad_id: string,
  _perfil: Perfil,
): Promise<CotizacionConLineas[]> {
  return apiFetch(`/cotizaciones?oportunidad_id=${encodeURIComponent(oportunidad_id)}`)
}

export function getCotizacion(id: string, _perfil: Perfil): Promise<CotizacionConLineas> {
  return apiFetch(`/cotizaciones/${id}`)
}

export function createCotizacion(
  oportunidad_id: string,
  _perfil: Perfil,
): Promise<CotizacionConLineas> {
  return apiFetch("/cotizaciones", {
    method: "POST",
    body: JSON.stringify({ oportunidad_id }),
  })
}

export function createLinea(input: CrearLineaInput): Promise<LineaCotizacionCalculada> {
  return apiFetch(`/cotizaciones/${input.cotizacion_id}/lineas`, {
    method: "POST",
    body: JSON.stringify({
      servicio_id: input.servicio_id,
      proveedor_id: input.proveedor_id ?? null,
      costo_proveedor: input.costo_proveedor ?? null,
      margen_pct: input.margen_pct ?? null,
      comision_agencia_pct: input.comision_agencia_pct ?? null,
      cantidad: input.cantidad ?? 1,
      descripcion: input.descripcion ?? null,
    }),
  })
}

export function updateLinea(input: ActualizarLineaInput): Promise<LineaCotizacionCalculada> {
  const body: Record<string, unknown> = {}
  if ("proveedor_id" in input) {
    body.proveedor_id = input.proveedor_id ?? null
  }
  if (input.costo_proveedor !== undefined) {
    body.costo_proveedor = input.costo_proveedor
  }
  if (input.margen_pct !== undefined) {
    body.margen_pct = input.margen_pct
  }
  if (input.comision_agencia_pct !== undefined) {
    body.comision_agencia_pct = input.comision_agencia_pct
  }
  if (input.cantidad !== undefined) {
    body.cantidad = input.cantidad
  }
  if ("descripcion" in input) {
    body.descripcion = input.descripcion ?? null
  }
  return apiFetch(`/cotizaciones/${input.cotizacion_id}/lineas/${input.id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export function deleteLinea(input: {
  perfil: Perfil
  cotizacion_id: string
  id: string
}): Promise<void> {
  return apiFetch(`/cotizaciones/${input.cotizacion_id}/lineas/${input.id}`, { method: "DELETE" })
}

export function enviarCotizacion(id: string, _perfil: Perfil): Promise<CotizacionConLineas> {
  return apiFetch(`/cotizaciones/${id}/enviar`, { method: "POST" })
}

export function aprobarPreparacion(id: string, _perfil: Perfil): Promise<CotizacionConLineas> {
  return apiFetch(`/cotizaciones/${id}/aprobar-preparacion`, { method: "POST" })
}

export function rechazarPreparacion(id: string, _perfil: Perfil): Promise<CotizacionConLineas> {
  return apiFetch(`/cotizaciones/${id}/rechazar-preparacion`, { method: "POST" })
}

export function marcarAprobada(id: string, _perfil: Perfil): Promise<CotizacionConLineas> {
  return apiFetch(`/cotizaciones/${id}/marcar-aprobada`, { method: "POST" })
}

export function marcarRechazada(id: string, _perfil: Perfil): Promise<CotizacionConLineas> {
  return apiFetch(`/cotizaciones/${id}/marcar-rechazada`, { method: "POST" })
}

export function marcarVencida(id: string, _perfil: Perfil): Promise<CotizacionConLineas> {
  return apiFetch(`/cotizaciones/${id}/marcar-vencida`, { method: "POST" })
}

export function ejecutarTransicion(
  id: string,
  _perfil: Perfil,
  accion: AccionCotizacion,
): Promise<CotizacionConLineas> {
  return apiFetch(`/cotizaciones/${id}/${TRANSICION_PATH[accion]}`, { method: "POST" })
}

function abrirBlob(blob: Blob, filename: string, modo: "descargar" | "ver") {
  const url = URL.createObjectURL(blob)
  if (modo === "descargar") {
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
    return
  }
  window.open(url, "_blank", "noopener")
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export async function abrirPdfCotizacion(input: {
  id: string
  perfil: Perfil
  variante: PdfCotizacionVariante
}): Promise<void> {
  const cotizacion = await getCotizacion(input.id, input.perfil)
  const oportunidad = await getOportunidad(cotizacion.oportunidad_id, input.perfil)
  if (input.variante === "interno" && !puedeVerDesgloseCotizacion(input.perfil, oportunidad.ejecutivo_id)) {
    throw new Error("No tienes permiso para ver el PDF interno")
  }
  const path =
    input.variante === "interno"
      ? `/cotizaciones/${input.id}/pdf-interno`
      : `/cotizaciones/${input.id}/pdf-cliente`
  const { blob, filename } = await apiFetchBlob(path)
  const fallback = input.variante === "interno" ? `${cotizacion.numero}-interno.pdf` : `${cotizacion.numero}.pdf`
  abrirBlob(blob, filename ?? fallback, input.variante === "interno" ? "ver" : "descargar")
}
