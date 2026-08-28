/**
 * Fachada de catálogos y panel de Configuración. Apunta al backend real.
 */
import { ApiError, apiFetch } from "@/lib/api-client"
import type { CausaPerdida } from "@/types/causa-perdida"
import type { ConfiguracionGeneral } from "@/types/configuracion-general"
import type { EtapaPipeline } from "@/types/etapa-pipeline"
import type { Servicio } from "@/types/servicio"
import type { TarifaInterna } from "@/types/tarifa-interna"
import type { TipoDocumento } from "@/types/tipo-documento"

export { MOCK_ORGANIZACION_ID } from "./mock-config"

export type HistorialPrecioContifico = {
  fecha_emision: string
  cliente: string | null
  cantidad: number
  precio: number
}

export type HistorialPreciosResponse = {
  cuenta_verificada: boolean
  resultados: HistorialPrecioContifico[]
}

export function listEtapasPipeline(): Promise<EtapaPipeline[]> {
  return apiFetch("/config/etapas-pipeline")
}

export function updateEtapaPipeline(
  id: string,
  patch: Pick<EtapaPipeline, "probabilidad_cierre_default_pct" | "umbral_alerta_horas">,
): Promise<EtapaPipeline> {
  return apiFetch(`/config/etapas-pipeline/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  })
}

export function listServicios(): Promise<Servicio[]> {
  return apiFetch("/servicios")
}

export async function getServicio(id: string): Promise<Servicio | null> {
  try {
    return await apiFetch(`/servicios/${id}`)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null
    }
    throw error
  }
}

function cuerpoServicio(
  input: Omit<Servicio, "id" | "created_at"> & { id?: string; created_at?: string },
) {
  const estimacion = input.estimacion_interna_por_rol
  return {
    nombre: input.nombre,
    descripcion: input.descripcion ?? null,
    categoria: input.categoria ?? null,
    modelo_cobro: input.modelo_cobro,
    tiene_fases: input.tiene_fases,
    precio_base_cliente: input.precio_base_cliente ?? null,
    estimacion_interna_por_rol:
      estimacion && Object.keys(estimacion).length > 0 ? estimacion : null,
    fases: input.fases ?? null,
    config_fee: input.config_fee ?? null,
    margen_default_pct: input.margen_default_pct ?? null,
    comision_sugerida_min_pct: input.comision_sugerida_min_pct ?? null,
    comision_sugerida_max_pct: input.comision_sugerida_max_pct ?? null,
    tipos_documento_requeridos: input.tipos_documento_requeridos ?? null,
  }
}

export function upsertServicio(
  input: Omit<Servicio, "id" | "created_at"> & { id?: string; created_at?: string },
): Promise<Servicio> {
  const body = cuerpoServicio(input)
  if (input.id) {
    return apiFetch(`/servicios/${input.id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    })
  }
  return apiFetch("/servicios", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export function activarServicio(id: string): Promise<Servicio> {
  return apiFetch(`/servicios/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ estado: "activo" }),
  })
}

export function listHistorialPrecios(
  servicioId: string,
  meses = 6,
): Promise<HistorialPreciosResponse> {
  return apiFetch(`/servicios/${servicioId}/historial-precios?meses=${meses}`)
}

export function listCausasPerdida(): Promise<CausaPerdida[]> {
  return apiFetch("/config/causas-perdida")
}

export function upsertCausaPerdida(
  input: Omit<CausaPerdida, "id"> & { id?: string },
): Promise<CausaPerdida> {
  if (input.id) {
    return apiFetch(`/config/causas-perdida/${input.id}`, {
      method: "PATCH",
      body: JSON.stringify({ nombre: input.nombre }),
    })
  }
  return apiFetch("/config/causas-perdida", {
    method: "POST",
    body: JSON.stringify({ nombre: input.nombre }),
  })
}

export function deleteCausaPerdida(id: string): Promise<void> {
  return apiFetch(`/config/causas-perdida/${id}`, { method: "DELETE" })
}

export function listTarifasInternas(): Promise<TarifaInterna[]> {
  return apiFetch("/config/tarifas-internas")
}

function cuerpoTarifa(input: Pick<TarifaInterna, "nombre_rol" | "modelo" | "costo_hora" | "costo_mensual" | "costo_evento">) {
  const modelo = input.modelo
  return {
    nombre_rol: input.nombre_rol,
    modelo,
    costo_hora: modelo === "por_hora" ? input.costo_hora : null,
    costo_mensual: modelo === "por_sueldo" ? input.costo_mensual : null,
    costo_evento: modelo === "por_evento" ? input.costo_evento : null,
  }
}

export function upsertTarifaInterna(
  input: Omit<TarifaInterna, "id"> & { id?: string },
): Promise<TarifaInterna> {
  const body = cuerpoTarifa(input)
  if (input.id) {
    return apiFetch(`/config/tarifas-internas/${input.id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    })
  }
  return apiFetch("/config/tarifas-internas", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export function deleteTarifaInterna(id: string): Promise<void> {
  return apiFetch(`/config/tarifas-internas/${id}`, { method: "DELETE" })
}

export function listTiposDocumento(): Promise<TipoDocumento[]> {
  return apiFetch("/config/tipos-documento")
}

export function upsertTipoDocumento(
  input: Omit<TipoDocumento, "id"> & { id?: string },
): Promise<TipoDocumento> {
  const body = { nombre: input.nombre, plantilla_base: input.plantilla_base ?? null }
  if (input.id) {
    return apiFetch(`/config/tipos-documento/${input.id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    })
  }
  return apiFetch("/config/tipos-documento", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export function deleteTipoDocumento(id: string): Promise<void> {
  return apiFetch(`/config/tipos-documento/${id}`, { method: "DELETE" })
}

export async function getConfiguracionGeneral(): Promise<ConfiguracionGeneral | null> {
  try {
    return await apiFetch("/config/general")
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null
    }
    throw error
  }
}

type ConfiguracionGeneralWrite = {
  organizacion_id?: string
  tasa_impuesto_pct?: number
  margen_agencia_default_pct?: number
  comision_agencia_default_min_pct?: number
  comision_agencia_default_max_pct?: number
  umbral_descuento_aprobacion_pct?: number
  multiplicador_escalamiento_supervisor?: number
  horas_laborales_mes?: number
}

function cuerpoConfig(input: ConfiguracionGeneralWrite) {
  const body: Record<string, number> = {}
  if (input.tasa_impuesto_pct !== undefined) {
    body.tasa_impuesto_pct = input.tasa_impuesto_pct
  }
  if (input.margen_agencia_default_pct !== undefined) {
    body.margen_agencia_default_pct = input.margen_agencia_default_pct
  }
  if (input.comision_agencia_default_min_pct !== undefined) {
    body.comision_agencia_default_min_pct = input.comision_agencia_default_min_pct
  }
  if (input.comision_agencia_default_max_pct !== undefined) {
    body.comision_agencia_default_max_pct = input.comision_agencia_default_max_pct
  }
  if (input.umbral_descuento_aprobacion_pct !== undefined) {
    body.umbral_descuento_aprobacion_pct = input.umbral_descuento_aprobacion_pct
  }
  if (input.multiplicador_escalamiento_supervisor !== undefined) {
    body.multiplicador_escalamiento_supervisor = input.multiplicador_escalamiento_supervisor
  }
  if (input.horas_laborales_mes !== undefined) {
    body.horas_laborales_mes = input.horas_laborales_mes
  }
  return body
}

export function createConfiguracionGeneral(
  input: ConfiguracionGeneralWrite,
): Promise<ConfiguracionGeneral> {
  return apiFetch("/config/general", {
    method: "POST",
    body: JSON.stringify(cuerpoConfig(input)),
  })
}

export function updateConfiguracionGeneral(
  patch: Omit<ConfiguracionGeneralWrite, "organizacion_id">,
): Promise<ConfiguracionGeneral> {
  return apiFetch("/config/general", {
    method: "PATCH",
    body: JSON.stringify(cuerpoConfig(patch)),
  })
}
