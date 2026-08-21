/**
 * Fachada de datos del Panel de Configuración y del wizard de Servicio.
 * Hoy apunta al mock; cuando exista OpenAPI se cambia este archivo, no los componentes.
 */
export {
  MOCK_ORGANIZACION_ID,
  activarServicio,
  deleteCausaPerdida,
  deleteTarifaInterna,
  deleteTipoDocumento,
  createConfiguracionGeneral,
  getConfiguracionGeneral,
  getServicio,
  listCausasPerdida,
  listEtapasPipeline,
  listServicios,
  listTarifasInternas,
  listTiposDocumento,
  updateConfiguracionGeneral,
  updateEtapaPipeline,
  upsertCausaPerdida,
  upsertServicio,
  upsertTarifaInterna,
  upsertTipoDocumento,
} from "./mock-config"
