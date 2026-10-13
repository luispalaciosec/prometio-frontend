/**
 * Contratos de fee recurrente (GET/POST /contratos-recurrentes). Montos sin IVA.
 */
import { apiFetch } from "@/lib/api-client"
import type {
  ContratoLineaInput,
  ContratoRecurrente,
  ContratoRecurrenteCreate,
  ContratoRecurrenteDetalle,
  ContratoRecurrenteUpdate,
  ContratoRenovacion,
  GenerarMesResultado,
  ListContratosQuery,
  ProyeccionMes,
  ProyeccionQuery,
} from "@/types/contrato-recurrente"

const BASE = "/contratos-recurrentes"

function serializarLineas(lineas: ContratoLineaInput[]): ContratoLineaInput[] {
  return lineas.map((linea) => ({
    servicio_id: linea.servicio_id,
    categoria_servicio_id: linea.servicio_id ? null : linea.categoria_servicio_id,
    descripcion: linea.descripcion.trim(),
    monto_mensual: linea.monto_mensual,
  }))
}

export function listContratos(query: ListContratosQuery = {}): Promise<ContratoRecurrente[]> {
  const params = new URLSearchParams()
  if (query.vigente != null) {
    params.set("vigente", String(query.vigente))
  }
  if (query.activo != null) {
    params.set("activo", String(query.activo))
  }
  if (query.empresa_id) {
    params.set("empresa_id", query.empresa_id)
  }
  const q = query.q?.trim()
  if (q) {
    params.set("q", q)
  }
  const qs = params.toString()
  return apiFetch(`${BASE}${qs ? `?${qs}` : ""}`)
}

export function getContrato(id: string): Promise<ContratoRecurrenteDetalle> {
  return apiFetch(`${BASE}/${id}`)
}

export function createContrato(input: ContratoRecurrenteCreate): Promise<ContratoRecurrenteDetalle> {
  return apiFetch(BASE, {
    method: "POST",
    body: JSON.stringify({
      ...input,
      nombre: input.nombre.trim(),
      oportunidad_id: input.oportunidad_id || null,
      notas: input.notas?.trim() || null,
      lineas: serializarLineas(input.lineas),
    }),
  })
}

export function updateContrato(
  id: string,
  input: ContratoRecurrenteUpdate,
): Promise<ContratoRecurrenteDetalle> {
  return apiFetch(`${BASE}/${id}`, { method: "PATCH", body: JSON.stringify(input) })
}

/** Solo afecta a los meses que todavía no se generaron. */
export function reemplazarLineasContrato(
  id: string,
  lineas: ContratoLineaInput[],
): Promise<ContratoRecurrenteDetalle> {
  return apiFetch(`${BASE}/${id}/lineas`, {
    method: "PUT",
    body: JSON.stringify({ lineas: serializarLineas(lineas) }),
  })
}

export function renovarContrato(
  id: string,
  input: { fecha_fin_nueva: string; lineas?: ContratoLineaInput[] | null },
): Promise<ContratoRecurrenteDetalle> {
  return apiFetch(`${BASE}/${id}/renovar`, {
    method: "POST",
    body: JSON.stringify({
      fecha_fin_nueva: input.fecha_fin_nueva,
      ...(input.lineas ? { lineas: serializarLineas(input.lineas) } : {}),
    }),
  })
}

export function desactivarContrato(id: string): Promise<ContratoRecurrenteDetalle> {
  return apiFetch(`${BASE}/${id}/desactivar`, { method: "POST" })
}

export function reactivarContrato(id: string): Promise<ContratoRecurrenteDetalle> {
  return apiFetch(`${BASE}/${id}/reactivar`, { method: "POST" })
}

/** Sin `dias` usa el aviso del Panel de Configuración. Incluye vencidos sin renovar. */
export function listRenovaciones(dias?: number | null): Promise<ContratoRenovacion[]> {
  return apiFetch(`${BASE}/renovaciones${dias ? `?dias=${dias}` : ""}`)
}

export async function getProyeccion(query: ProyeccionQuery = {}): Promise<ProyeccionMes[]> {
  const params = new URLSearchParams()
  if (query.meses != null) {
    params.set("meses", String(query.meses))
  }
  if (query.meses_atras != null) {
    params.set("meses_atras", String(query.meses_atras))
  }
  if (query.incluir_contifico) {
    params.set("incluir_contifico", "true")
  }
  const qs = params.toString()
  const data = await apiFetch<{ meses: ProyeccionMes[] }>(
    `${BASE}/proyeccion${qs ? `?${qs}` : ""}`,
  )
  return data.meses
}

/** Idempotente. `periodo`: cualquier día del mes (`YYYY-MM-DD`); sin él, el mes en curso. */
export function generarMes(periodo?: string | null): Promise<GenerarMesResultado> {
  return apiFetch(`${BASE}/generar-mes`, {
    method: "POST",
    body: JSON.stringify(periodo ? { periodo } : {}),
  })
}
