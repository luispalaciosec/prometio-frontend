/**
 * Exportación con pantalla previa: GET /exportar/opciones arma el panel y GET /exportar/{recurso} devuelve la vista
 * previa (formato=vista) o el archivo (xlsx | pdf). La descarga va por fetch con el JWT: un <a href> no manda el header.
 */
import { apiFetch, apiFetchBlob } from "@/lib/api-client"
import { hoyEcuador } from "@/lib/contrato-recurrente"
import { useAuthStore } from "@/store/auth-store"
import type {
  FormatoArchivo,
  OpcionesExportacion,
  RecursoExportable,
  SeleccionExportacion,
  VistaPreviaExportacion,
} from "@/types/exportar"

let opcionesCache: { perfilId: string; promesa: Promise<OpcionesExportacion> } | null = null

/** Se pide una vez por sesión de usuario: los filtros dependen del rol, así que la caché va atada al perfil. */
export function getOpcionesExportacion(): Promise<OpcionesExportacion> {
  const perfilId = useAuthStore.getState().perfil?.id ?? ""
  if (opcionesCache?.perfilId !== perfilId) {
    const promesa = apiFetch<OpcionesExportacion>("/exportar/opciones")
    promesa.catch(() => {
      if (opcionesCache?.promesa === promesa) {
        opcionesCache = null
      }
    })
    opcionesCache = { perfilId, promesa }
  }
  return opcionesCache.promesa
}

/** Querystring sin vacíos: el backend no recibe `null` ni cadenas vacías. */
export function parametrosExportacion(seleccion: SeleccionExportacion): URLSearchParams {
  const params = new URLSearchParams()
  for (const [nombre, valor] of Object.entries(seleccion.filtros)) {
    if (valor.trim() !== "") {
      params.set(nombre, valor.trim())
    }
  }
  params.set("columnas", seleccion.columnas.join(","))
  if (seleccion.ordenPor) {
    params.set("orden_por", seleccion.ordenPor)
    params.set("orden", seleccion.orden)
  }
  if (seleccion.agruparPor) {
    params.set("agrupar_por", seleccion.agruparPor)
    params.set("orden_grupos", seleccion.ordenGrupos)
  }
  return params
}

export function getVistaPrevia(
  recurso: RecursoExportable,
  params: URLSearchParams,
  signal: AbortSignal,
): Promise<VistaPreviaExportacion> {
  const qs = new URLSearchParams(params)
  qs.set("formato", "vista")
  return apiFetch(`/exportar/${recurso}?${qs.toString()}`, { signal, cache: "no-store" })
}

export async function descargarExportacion(
  recurso: RecursoExportable,
  formato: FormatoArchivo,
  params: URLSearchParams,
): Promise<void> {
  const qs = new URLSearchParams(params)
  qs.set("formato", formato)
  const { blob, filename } = await apiFetchBlob(`/exportar/${recurso}?${qs.toString()}`, { cache: "no-store" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename ?? `prometio-${recurso}-${hoyEcuador()}.${formato}`
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Revocar en el mismo tick puede cortar la descarga en Safari y Firefox.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
