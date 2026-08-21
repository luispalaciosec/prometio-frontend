/**
 * Fachada de cotizaciones. Hoy apunta al mock; cuando exista OpenAPI se cambia este archivo.
 *
 * PDF real (WeasyPrint en backend, no en el frontend):
 *   GET /cotizaciones/{id}/pdf-cliente  → {numero}.pdf
 *   GET /cotizaciones/{id}/pdf-interno  → {numero}-interno.pdf
 */
export {
  abrirPdfCotizacion,
  aprobarPreparacion,
  createCotizacion,
  createLinea,
  deleteLinea,
  enviarCotizacion,
  ejecutarTransicion,
  getCotizacion,
  listCotizaciones,
  listProveedores,
  marcarAprobada,
  marcarRechazada,
  marcarVencida,
  rechazarPreparacion,
  updateLinea,
} from "../mock-cotizacion"
export type { ActualizarLineaInput, CrearLineaInput, PdfCotizacionVariante } from "../mock-cotizacion"
export type { AccionCotizacion } from "../cotizacion-transiciones"
