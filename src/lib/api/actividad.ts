/**
 * Fachada de actividades. Hoy apunta al mock; cuando exista OpenAPI se cambia este archivo.
 */
export {
  createActividad,
  deleteActividad,
  getActividad,
  listActividades,
  reportarActividad,
  updateActividad,
} from "../mock-actividad"
export type {
  ActualizarActividadInput,
  CrearActividadInput,
  ListActividadesQuery,
} from "../mock-actividad"
