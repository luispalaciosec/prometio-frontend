/**
 * Fachada del pipeline de Oportunidad.
 * Hoy apunta al mock; cuando exista OpenAPI se cambia este archivo, no el Kanban.
 */
export {
  etiquetaContacto,
  etiquetaEmpresa,
  etiquetaEjecutivo,
  listOportunidades,
  getOportunidad,
  moverOportunidad,
  reasignarOportunidad,
  OportunidadFueraDeAlcanceError,
  OportunidadNotFoundError,
  type ListOportunidadesQuery,
  type MoverOportunidadInput,
  type ReasignarOportunidadInput,
} from "../mock-oportunidad"
export {
  esPerfilElegibleEjecutivo,
  esSoloLoPropio,
  puedeVerDesgloseCotizacion,
  puedeVerEquipo,
  puedeVerModuloVentas,
  scopeEfectivo,
} from "../pipeline-acceso"
