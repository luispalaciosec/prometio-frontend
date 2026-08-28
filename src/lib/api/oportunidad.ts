/**
 * Fachada del pipeline de Oportunidad. Apunta al backend real (GET/PATCH /oportunidades).
 */
import { listContactos } from "@/lib/api/contacto"
import { listEmpresas } from "@/lib/api/empresa"
import { listPerfiles } from "@/lib/api/perfiles"
import { ApiError, apiFetch } from "@/lib/api-client"
import { puedeVerEquipo, scopeEfectivo } from "@/lib/pipeline-acceso"
import type { EtapaPipelineCodigo } from "@/types/etapa-pipeline"
import type {
  Oportunidad,
  OportunidadCreate,
  OportunidadKanban,
  OportunidadUpdate,
  PipelineScope,
} from "@/types/oportunidad"
import type { Perfil } from "@/types/perfil"

export {
  esPerfilElegibleEjecutivo,
  esSoloLoPropio,
  puedeVerDesgloseCotizacion,
  puedeVerEquipo,
  puedeVerModuloVentas,
  scopeEfectivo,
} from "../pipeline-acceso"

export class OportunidadNotFoundError extends Error {
  constructor() {
    super("oportunidad no encontrada")
    this.name = "OportunidadNotFoundError"
  }
}

export class OportunidadFueraDeAlcanceError extends Error {
  constructor() {
    super("oportunidad fuera de alcance")
    this.name = "OportunidadFueraDeAlcanceError"
  }
}

const nombresContacto = new Map<string, string>()
const nombresEmpresa = new Map<string, string>()
const nombresEjecutivo = new Map<string, string>()

function normalizar(row: Oportunidad): Oportunidad {
  return {
    ...row,
    servicios_ids: row.servicios_ids ?? [],
    activo: row.activo !== false,
  }
}

function mapearError(error: unknown): never {
  if (error instanceof ApiError && error.status === 404) {
    throw new OportunidadNotFoundError()
  }
  if (error instanceof ApiError && error.status === 403) {
    throw new OportunidadFueraDeAlcanceError()
  }
  throw error
}

export async function refrescarEtiquetasOportunidad() {
  const [contactos, empresas, perfiles] = await Promise.all([
    listContactos({ incluir_inactivos: true }),
    listEmpresas(),
    listPerfiles(),
  ])
  nombresContacto.clear()
  nombresEmpresa.clear()
  nombresEjecutivo.clear()
  for (const row of contactos) {
    nombresContacto.set(row.id, row.nombre_completo)
  }
  for (const row of empresas) {
    nombresEmpresa.set(row.id, row.nombre)
  }
  for (const row of perfiles) {
    nombresEjecutivo.set(row.id, row.nombre_completo)
  }
}

function toKanban(item: Oportunidad, perfil: Perfil): OportunidadKanban {
  const row = normalizar(item)
  return {
    ...row,
    contacto: {
      id: row.contacto_id,
      nombre_completo: nombresContacto.get(row.contacto_id) ?? "Contacto",
    },
    empresa: {
      id: row.empresa_id,
      nombre: nombresEmpresa.get(row.empresa_id) ?? "Empresa",
    },
    ejecutivo: {
      id: row.ejecutivo_id,
      nombre_completo:
        row.ejecutivo_id === perfil.id
          ? perfil.nombre_completo
          : (nombresEjecutivo.get(row.ejecutivo_id) ?? "Ejecutivo"),
    },
  }
}

export function etiquetaContacto(id: string): string {
  return nombresContacto.get(id) ?? id
}

export function etiquetaEmpresa(id: string): string {
  return nombresEmpresa.get(id) ?? id
}

export function etiquetaEjecutivo(id: string, perfil: Perfil): string {
  if (id === perfil.id) {
    return perfil.nombre_completo
  }
  return nombresEjecutivo.get(id) ?? id
}

export type ListOportunidadesQuery = {
  perfil: Perfil
  scope?: PipelineScope
  servicio_id?: string | null
}

/** Lista cruda, incluye inactivas. Para etiquetar cotizaciones u otras entidades ligadas. */
export async function listOportunidadesLookup(): Promise<Oportunidad[]> {
  const [rows] = await Promise.all([
    apiFetch<Oportunidad[]>("/oportunidades?incluir_inactivas=true"),
    refrescarEtiquetasOportunidad(),
  ])
  return rows.map(normalizar)
}

export async function listOportunidades(query: ListOportunidadesQuery): Promise<OportunidadKanban[]> {
  try {
    const [rows] = await Promise.all([
      apiFetch<Oportunidad[]>("/oportunidades"),
      refrescarEtiquetasOportunidad(),
    ])
    const scope = scopeEfectivo(query.perfil, query.scope)
    return rows
      .map(normalizar)
      .filter((item) => item.activo)
      .filter((item) => (scope === "mio" ? item.ejecutivo_id === query.perfil.id : true))
      .filter((item) => (query.servicio_id ? item.servicios_ids.includes(query.servicio_id) : true))
      .map((item) => toKanban(item, query.perfil))
  } catch (error) {
    mapearError(error)
  }
}

export async function createOportunidad(input: OportunidadCreate): Promise<Oportunidad> {
  const servicios = input.servicios_ids?.filter(Boolean) ?? []
  return apiFetch("/oportunidades", {
    method: "POST",
    body: JSON.stringify({
      contacto_id: input.contacto_id,
      empresa_id: input.empresa_id,
      valor_referencial: input.valor_referencial ?? null,
      servicios_ids: servicios.length > 0 ? servicios : null,
    }),
  })
}

export async function updateOportunidad(
  id: string,
  input: OportunidadUpdate,
  perfil: Perfil,
): Promise<OportunidadKanban> {
  const body: Record<string, unknown> = {}
  if (input.contacto_id !== undefined) {
    body.contacto_id = input.contacto_id
  }
  if (input.empresa_id !== undefined) {
    body.empresa_id = input.empresa_id
  }
  if (input.valor_referencial !== undefined) {
    body.valor_referencial = input.valor_referencial
  }
  if (input.servicios_ids !== undefined) {
    body.servicios_ids = input.servicios_ids
  }
  try {
    const row = await apiFetch<Oportunidad>(`/oportunidades/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    })
    await refrescarEtiquetasOportunidad()
    return toKanban(normalizar(row), perfil)
  } catch (error) {
    mapearError(error)
  }
}

export async function getOportunidad(id: string, perfil: Perfil): Promise<OportunidadKanban> {
  try {
    const [row] = await Promise.all([
      apiFetch<Oportunidad>(`/oportunidades/${id}`),
      refrescarEtiquetasOportunidad(),
    ])
    return toKanban(normalizar(row), perfil)
  } catch (error) {
    mapearError(error)
  }
}

export type MoverOportunidadInput = {
  perfil: Perfil
  id: string
  etapa: EtapaPipelineCodigo
  causa_perdida_principal_id?: string
  causa_perdida_secundaria_id?: string
}

export async function moverOportunidad(input: MoverOportunidadInput): Promise<OportunidadKanban> {
  const body: Record<string, string | null> = { etapa: input.etapa }
  if (input.etapa === "cierre_perdido") {
    body.causa_perdida_principal_id = input.causa_perdida_principal_id ?? null
    const secundaria = input.causa_perdida_secundaria_id?.trim() ?? ""
    body.causa_perdida_secundaria_id = secundaria === "" ? null : secundaria
  }
  try {
    const row = await apiFetch<Oportunidad>(`/oportunidades/${input.id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    })
    await refrescarEtiquetasOportunidad()
    return toKanban(normalizar(row), input.perfil)
  } catch (error) {
    mapearError(error)
  }
}

export type ReasignarOportunidadInput = {
  perfil: Perfil
  id: string
  nuevo_ejecutivo_id: string
}

export async function desactivarOportunidad(id: string, perfil: Perfil): Promise<OportunidadKanban> {
  try {
    const row = await apiFetch<Oportunidad>(`/oportunidades/${id}/desactivar`, { method: "POST" })
    await refrescarEtiquetasOportunidad()
    return toKanban(normalizar(row), perfil)
  } catch (error) {
    mapearError(error)
  }
}

export async function reactivarOportunidad(id: string, perfil: Perfil): Promise<OportunidadKanban> {
  try {
    const row = await apiFetch<Oportunidad>(`/oportunidades/${id}/reactivar`, { method: "POST" })
    await refrescarEtiquetasOportunidad()
    return toKanban(normalizar(row), perfil)
  } catch (error) {
    mapearError(error)
  }
}

export async function reasignarOportunidad(input: ReasignarOportunidadInput): Promise<OportunidadKanban> {
  if (!puedeVerEquipo(input.perfil)) {
    throw new Error("solo administrativo o ventas-supervisor puede reasignar")
  }
  try {
    const row = await apiFetch<Oportunidad>(`/oportunidades/${input.id}/reasignar`, {
      method: "POST",
      body: JSON.stringify({ nuevo_ejecutivo_id: input.nuevo_ejecutivo_id }),
    })
    await refrescarEtiquetasOportunidad()
    return toKanban(normalizar(row), input.perfil)
  } catch (error) {
    mapearError(error)
  }
}
