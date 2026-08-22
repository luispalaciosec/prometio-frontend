/**
 * Fachada de catálogos. Lecturas van al backend; escrituras del panel admin
 * siguen en mock hasta el corte de Configuración.
 */
import { ApiError, apiFetch } from "@/lib/api-client"
import type { CausaPerdida } from "@/types/causa-perdida"
import type { ConfiguracionGeneral } from "@/types/configuracion-general"
import type { EtapaPipeline } from "@/types/etapa-pipeline"
import type { Servicio } from "@/types/servicio"
import type { TarifaInterna } from "@/types/tarifa-interna"
import type { TipoDocumento } from "@/types/tipo-documento"

export {
  MOCK_ORGANIZACION_ID,
  activarServicio,
  createConfiguracionGeneral,
  deleteCausaPerdida,
  deleteTarifaInterna,
  deleteTipoDocumento,
  updateConfiguracionGeneral,
  updateEtapaPipeline,
  upsertCausaPerdida,
  upsertServicio,
  upsertTarifaInterna,
  upsertTipoDocumento,
} from "./mock-config"

export function listEtapasPipeline(): Promise<EtapaPipeline[]> {
  return apiFetch("/config/etapas-pipeline")
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

export function listCausasPerdida(): Promise<CausaPerdida[]> {
  return apiFetch("/config/causas-perdida")
}

export function listTarifasInternas(): Promise<TarifaInterna[]> {
  return apiFetch("/config/tarifas-internas")
}

export function listTiposDocumento(): Promise<TipoDocumento[]> {
  return apiFetch("/config/tipos-documento")
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
