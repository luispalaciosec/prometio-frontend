import { puedeVerDesgloseCotizacion, puedeVerEquipo } from "@/lib/pipeline-acceso"
import type { CotizacionEstado } from "@/types/cotizacion"
import type { Perfil } from "@/types/perfil"

export type AccionCotizacion =
  | "enviar"
  | "aprobar_preparacion"
  | "rechazar_preparacion"
  | "marcar_aprobada"
  | "marcar_rechazada"
  | "marcar_vencida"

/** Matriz estado × rol. UI oculta; mock vuelve a chequear. */
export function puedeEjecutarTransicion(
  accion: AccionCotizacion,
  perfil: Perfil,
  estado: CotizacionEstado,
  ejecutivoId: string,
): boolean {
  switch (accion) {
    case "enviar":
      return estado === "borrador" && puedeVerDesgloseCotizacion(perfil, ejecutivoId)
    case "aprobar_preparacion":
    case "rechazar_preparacion":
      return estado === "preparacion" && puedeVerEquipo(perfil)
    case "marcar_aprobada":
    case "marcar_rechazada":
    case "marcar_vencida":
      return estado === "enviada" && puedeVerDesgloseCotizacion(perfil, ejecutivoId)
  }
}

export function accionesVisibles(
  perfil: Perfil,
  estado: CotizacionEstado,
  ejecutivoId: string,
): AccionCotizacion[] {
  const todas: AccionCotizacion[] = [
    "enviar",
    "aprobar_preparacion",
    "rechazar_preparacion",
    "marcar_aprobada",
    "marcar_rechazada",
    "marcar_vencida",
  ]
  return todas.filter((accion) => puedeEjecutarTransicion(accion, perfil, estado, ejecutivoId))
}

/** Copy cuando no hay botones: el flujo existe, pero este rol/estado no desbloquea nada. */
export function mensajeSinTransicion(
  perfil: Perfil,
  estado: CotizacionEstado,
  ejecutivoId: string,
): string {
  if (accionesVisibles(perfil, estado, ejecutivoId).length > 0) {
    return ""
  }
  switch (estado) {
    case "borrador":
      return "Para enviarla tenés que ser el dueño de la oportunidad, o un supervisor/admin."
    case "preparacion":
      return "Hay un descuento que pide aprobación. Solo un supervisor o admin puede aprobar o rechazar."
    case "enviada":
      return "Cuando el cliente responde, el dueño o un supervisor marca aprobada, rechazada o vencida."
    case "aprobada":
    case "rechazada":
    case "vencida":
      return "Esta cotización ya está cerrada. No hay más cambios de estado."
  }
}
