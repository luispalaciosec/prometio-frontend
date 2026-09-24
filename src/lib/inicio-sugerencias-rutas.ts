import { getDocumentoAlcance } from "@/lib/api/documento-alcance"
import { rutaConstructorCotizacion } from "@/lib/cotizacion-rutas"
import type { EnlaceSugerencia } from "@/types/inicio-sugerencias"

export function rutaEnlaceSugerencia(enlace: EnlaceSugerencia): string {
  switch (enlace.tipo) {
    case "oportunidad":
      return `/pipeline/${enlace.id}`
    case "cotizacion":
      return `/cotizaciones/${enlace.id}`
    case "actividad":
      return `/agenda/actividades?actividad=${encodeURIComponent(enlace.id)}`
    case "meta":
      return "/dashboard"
    default:
      return "/"
  }
}

/** Documento de alcance vive en la cotización; resolvemos cotización antes de navegar. */
export async function rutaEnlaceSugerenciaAsync(enlace: EnlaceSugerencia): Promise<string> {
  if (enlace.tipo !== "documento_alcance") {
    return rutaEnlaceSugerencia(enlace)
  }
  const doc = await getDocumentoAlcance(enlace.id)
  return rutaConstructorCotizacion(doc.cotizacion_id, enlace.id)
}
