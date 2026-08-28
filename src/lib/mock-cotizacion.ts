/**
 * Mock de cotización / líneas / proveedores.
 * Mutaciones de líneas solo en estado borrador. Sin cambio de camino en PATCH.
 */
import {
  calcularLineaConProveedor,
  calcularLineaSinProveedor,
} from "@/lib/calculo-cotizacion"
import { puedeEjecutarTransicion, type AccionCotizacion } from "@/lib/cotizacion-transiciones"
import { MOCK_ORGANIZACION_ID, getConfiguracionGeneral, getServicio } from "@/lib/mock-config"
import { puedeVerDesgloseCotizacion } from "@/lib/pipeline-acceso"
import { getOportunidad } from "@/lib/mock-oportunidad"
import type { ConfiguracionGeneral } from "@/types/configuracion-general"
import type { Cotizacion, CotizacionConLineas } from "@/types/cotizacion"
import type { LineaCotizacion, LineaCotizacionCalculada } from "@/types/linea-cotizacion"
import type { Perfil } from "@/types/perfil"
import type { Proveedor } from "@/types/proveedor"
import type { Servicio } from "@/types/servicio"

const STORAGE_KEY = "prometio-mock-cotizacion-v1"

type MockDb = {
  proveedores: Proveedor[]
  cotizaciones: Cotizacion[]
  lineas: LineaCotizacion[]
  siguiente_numero: number
}

function seed(): MockDb {
  return {
    proveedores: [
      {
        id: "pv-imprenta",
        organizacion_id: MOCK_ORGANIZACION_ID,
        nombre: "Imprenta del Pacífico",
      },
      {
        id: "pv-media",
        organizacion_id: MOCK_ORGANIZACION_ID,
        nombre: "Red Media Latam",
      },
    ],
    cotizaciones: [],
    lineas: [],
    siguiente_numero: 1,
  }
}

function load(): MockDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return normalizeDb(JSON.parse(raw) as MockDb)
    }
  } catch {
    /* seed */
  }
  const initial = seed()
  persist(initial)
  return initial
}

function persist(next: MockDb) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

function normalizeDb(raw: MockDb): MockDb {
  return {
    ...raw,
    lineas: raw.lineas.map((linea) => ({
      ...linea,
      descripcion: linea.descripcion ?? null,
      precio_base_cliente_aplicado: linea.precio_base_cliente_aplicado ?? null,
    })),
  }
}

let db = load()

function refresh() {
  db = load()
}

function assertBorrador(cotizacion: Cotizacion) {
  if (cotizacion.estado !== "borrador") {
    throw new Error("Solo se pueden cambiar líneas mientras la cotización está en borrador")
  }
}

async function requireConfig(): Promise<ConfiguracionGeneral> {
  const config = await getConfiguracionGeneral()
  if (!config) {
    throw new Error("configuracion_general no ha sido creada — no se puede calcular la cotización")
  }
  return config
}

function tasaPara(cotizacion: Cotizacion, config: ConfiguracionGeneral): number {
  if (cotizacion.tasa_impuesto_pct_aplicada !== null) {
    return cotizacion.tasa_impuesto_pct_aplicada
  }
  return config.tasa_impuesto_pct
}

function resolverMargenComision(
  servicio: Servicio,
  config: ConfiguracionGeneral,
): { margen_pct: number; comision_agencia_pct: number } {
  return {
    margen_pct: servicio.margen_default_pct ?? config.margen_agencia_default_pct,
    comision_agencia_pct:
      servicio.comision_sugerida_min_pct ?? config.comision_agencia_default_min_pct,
  }
}

async function calcularLinea(
  linea: LineaCotizacion,
  cotizacion: Cotizacion,
): Promise<LineaCotizacionCalculada> {
  const servicio = await getServicio(linea.servicio_id)
  if (!servicio) {
    throw new Error("servicio no encontrado")
  }
  const config = await requireConfig()
  const tasa = tasaPara(cotizacion, config)
  if (linea.costo_proveedor != null) {
    if (linea.margen_pct == null || linea.comision_agencia_pct == null) {
      throw new Error("margen_pct y comision_agencia_pct son obligatorios con costo_proveedor")
    }
    const calculo = calcularLineaConProveedor(
      linea.costo_proveedor,
      linea.margen_pct,
      linea.comision_agencia_pct,
      tasa,
    )
    return {
      ...linea,
      ...calculo,
      total_linea_extendido: calculo.total_linea * linea.cantidad,
    }
  }
  const precioBase =
    linea.precio_base_cliente_aplicado !== null
      ? linea.precio_base_cliente_aplicado
      : servicio.precio_base_cliente
  if (precioBase == null) {
    throw new Error("no se puede calcular esta línea: falta precio_base_cliente en el servicio")
  }
  const calculo = calcularLineaSinProveedor(precioBase, tasa)
  return {
    ...linea,
    ...calculo,
    total_linea_extendido: calculo.total_linea * linea.cantidad,
  }
}

async function conCalculo(cotizacion: Cotizacion): Promise<CotizacionConLineas> {
  const lineasRaw = db.lineas.filter((row) => row.cotizacion_id === cotizacion.id)
  const lineas = await Promise.all(lineasRaw.map((linea) => calcularLinea(linea, cotizacion)))
  const total_cotizacion = lineas.reduce((sum, linea) => sum + linea.total_linea_extendido, 0)
  return { ...cotizacion, lineas, total_cotizacion }
}

export async function listProveedores(): Promise<Proveedor[]> {
  refresh()
  return [...db.proveedores].sort((a, b) => a.nombre.localeCompare(b.nombre))
}

export async function listCotizaciones(
  oportunidad_id: string,
  perfil: Perfil,
): Promise<CotizacionConLineas[]> {
  refresh()
  await getOportunidad(oportunidad_id, perfil)
  const rows = db.cotizaciones
    .filter((row) => row.oportunidad_id === oportunidad_id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
  return Promise.all(rows.map((row) => conCalculo(row)))
}

export async function getCotizacion(id: string, perfil: Perfil): Promise<CotizacionConLineas> {
  refresh()
  const existing = db.cotizaciones.find((row) => row.id === id)
  if (!existing) {
    throw new Error("cotizacion no encontrada")
  }
  await getOportunidad(existing.oportunidad_id, perfil)
  return conCalculo(existing)
}

export async function createCotizacion(
  oportunidad_id: string,
  perfil: Perfil,
): Promise<CotizacionConLineas> {
  refresh()
  await getOportunidad(oportunidad_id, perfil)
  const created: Cotizacion = {
    id: crypto.randomUUID(),
    numero: `COT-${String(db.siguiente_numero).padStart(4, "0")}`,
    oportunidad_id,
    estado: "borrador",
    requiere_aprobacion: false,
    aprobado_por: null,
    tasa_impuesto_pct_aplicada: null,
    created_at: new Date().toISOString(),
  }
  db.siguiente_numero += 1
  db.cotizaciones = [created, ...db.cotizaciones]
  persist(db)
  return conCalculo(created)
}

export type CrearLineaInput = {
  perfil: Perfil
  cotizacion_id: string
  servicio_id: string
  proveedor_id?: string | null
  costo_proveedor?: number | null
  margen_pct?: number | null
  comision_agencia_pct?: number | null
  cantidad?: number
  descripcion?: string | null
}

export async function createLinea(input: CrearLineaInput): Promise<LineaCotizacionCalculada> {
  refresh()
  const cotizacion = db.cotizaciones.find((row) => row.id === input.cotizacion_id)
  if (!cotizacion) {
    throw new Error("cotizacion no encontrada")
  }
  await getOportunidad(cotizacion.oportunidad_id, input.perfil)
  assertBorrador(cotizacion)
  const servicio = await getServicio(input.servicio_id)
  if (!servicio) {
    throw new Error("servicio no encontrado")
  }
  const config = await requireConfig()
  const cantidad = input.cantidad ?? 1
  const costo = input.costo_proveedor ?? null
  let margen_pct: number | null = null
  let comision_agencia_pct: number | null = null
  let proveedor_id: string | null = input.proveedor_id ?? null

  if (costo != null) {
    const resuelto = resolverMargenComision(servicio, config)
    margen_pct = input.margen_pct ?? resuelto.margen_pct
    comision_agencia_pct = input.comision_agencia_pct ?? resuelto.comision_agencia_pct
  } else {
    if (input.margen_pct != null || input.comision_agencia_pct != null) {
      throw new Error("margen_pct/comision_agencia_pct no aplican sin costo_proveedor")
    }
    if (servicio.precio_base_cliente == null) {
      throw new Error("no se puede calcular esta línea: falta precio_base_cliente en el servicio")
    }
    proveedor_id = null
  }

  const created: LineaCotizacion = {
    id: crypto.randomUUID(),
    cotizacion_id: cotizacion.id,
    servicio_id: input.servicio_id,
    proveedor_id,
    costo_proveedor: costo,
    margen_pct,
    comision_agencia_pct,
    cantidad,
    descripcion: input.descripcion ?? null,
    precio_base_cliente_aplicado: null,
  }
  db.lineas = [...db.lineas, created]
  persist(db)
  return calcularLinea(created, cotizacion)
}

export type ActualizarLineaInput = {
  perfil: Perfil
  cotizacion_id: string
  id: string
  proveedor_id?: string | null
  costo_proveedor?: number
  margen_pct?: number
  comision_agencia_pct?: number
  cantidad?: number
  descripcion?: string | null
}

export async function updateLinea(input: ActualizarLineaInput): Promise<LineaCotizacionCalculada> {
  refresh()
  const cotizacion = db.cotizaciones.find((row) => row.id === input.cotizacion_id)
  if (!cotizacion) {
    throw new Error("cotizacion no encontrada")
  }
  await getOportunidad(cotizacion.oportunidad_id, input.perfil)
  assertBorrador(cotizacion)
  const existing = db.lineas.find(
    (row) => row.id === input.id && row.cotizacion_id === input.cotizacion_id,
  )
  if (!existing) {
    throw new Error("linea_cotizacion no encontrada")
  }

  const conProveedor = existing.costo_proveedor != null
  if (conProveedor) {
    if ("costo_proveedor" in input && input.costo_proveedor == null) {
      throw new Error("no se puede cambiar de camino: borra la línea y créala de nuevo")
    }
  } else {
    if (input.costo_proveedor != null) {
      throw new Error("no se puede cambiar de camino: borra la línea y créala de nuevo")
    }
    if (input.margen_pct != null || input.comision_agencia_pct != null) {
      throw new Error("margen_pct/comision_agencia_pct no aplican sin costo_proveedor")
    }
  }

  const next: LineaCotizacion = {
    ...existing,
    cantidad: input.cantidad ?? existing.cantidad,
    descripcion: "descripcion" in input ? input.descripcion ?? null : existing.descripcion,
    proveedor_id: conProveedor
      ? (input.proveedor_id !== undefined ? input.proveedor_id : existing.proveedor_id)
      : null,
    costo_proveedor: conProveedor
      ? (input.costo_proveedor ?? existing.costo_proveedor)
      : null,
    margen_pct: conProveedor ? (input.margen_pct ?? existing.margen_pct) : null,
    comision_agencia_pct: conProveedor
      ? (input.comision_agencia_pct ?? existing.comision_agencia_pct)
      : null,
  }
  db.lineas = db.lineas.map((row) => (row.id === existing.id ? next : row))
  persist(db)
  return calcularLinea(next, cotizacion)
}

export async function deleteLinea(input: {
  perfil: Perfil
  cotizacion_id: string
  id: string
}): Promise<void> {
  refresh()
  const cotizacion = db.cotizaciones.find((row) => row.id === input.cotizacion_id)
  if (!cotizacion) {
    throw new Error("cotizacion no encontrada")
  }
  await getOportunidad(cotizacion.oportunidad_id, input.perfil)
  assertBorrador(cotizacion)
  const existing = db.lineas.find(
    (row) => row.id === input.id && row.cotizacion_id === input.cotizacion_id,
  )
  if (!existing) {
    throw new Error("linea_cotizacion no encontrada")
  }
  db.lineas = db.lineas.filter((row) => row.id !== input.id)
  persist(db)
}

async function requireCotizacion(
  id: string,
  perfil: Perfil,
): Promise<{ cotizacion: Cotizacion; ejecutivoId: string }> {
  refresh()
  const cotizacion = db.cotizaciones.find((row) => row.id === id)
  if (!cotizacion) {
    throw new Error("cotizacion no encontrada")
  }
  const oportunidad = await getOportunidad(cotizacion.oportunidad_id, perfil)
  return { cotizacion, ejecutivoId: oportunidad.ejecutivo.id }
}

function assertPuede(accion: AccionCotizacion, perfil: Perfil, estado: Cotizacion["estado"], ejecutivoId: string) {
  if (!puedeEjecutarTransicion(accion, perfil, estado, ejecutivoId)) {
    throw new Error("No tienes permiso para esta transición")
  }
}

function patchCotizacion(id: string, patch: Partial<Cotizacion>): Cotizacion {
  const existing = db.cotizaciones.find((row) => row.id === id)
  if (!existing) {
    throw new Error("cotizacion no encontrada")
  }
  const next = { ...existing, ...patch }
  db.cotizaciones = db.cotizaciones.map((row) => (row.id === id ? next : row))
  return next
}

async function requiereAprobacion(
  lineas: LineaCotizacion[],
  tasa: number,
  umbral: number,
  config: ConfiguracionGeneral,
): Promise<boolean> {
  for (const linea of lineas) {
    if (linea.costo_proveedor == null) {
      continue
    }
    if (linea.margen_pct == null || linea.comision_agencia_pct == null) {
      throw new Error("margen_pct y comision_agencia_pct son obligatorios con costo_proveedor")
    }
    const servicio = await getServicio(linea.servicio_id)
    if (!servicio) {
      throw new Error("servicio no encontrado")
    }
    const politica = resolverMargenComision(servicio, config)

    const calculoReal = calcularLineaConProveedor(
      linea.costo_proveedor,
      linea.margen_pct,
      linea.comision_agencia_pct,
      tasa,
    )
    const calculoPolitica = calcularLineaConProveedor(
      linea.costo_proveedor,
      politica.margen_pct,
      politica.comision_agencia_pct,
      tasa,
    )
    const totalReal = calculoReal.total_linea * linea.cantidad
    const totalPolitica = calculoPolitica.total_linea * linea.cantidad
    if (totalPolitica > 0) {
      const descuentoPct = ((totalPolitica - totalReal) / totalPolitica) * 100
      if (descuentoPct > umbral) {
        return true
      }
    }

    if (
      (servicio.modelo_cobro === "fee_fijo" || servicio.modelo_cobro === "fee_recurrente") &&
      linea.comision_agencia_pct < politica.comision_agencia_pct
    ) {
      return true
    }
  }
  return false
}

async function congelarValoresAlEnviar(cotizacionId: string, config: ConfiguracionGeneral): Promise<void> {
  const lineas = db.lineas.filter((row) => row.cotizacion_id === cotizacionId)
  const aCongelar: { id: string; precio: number }[] = []
  for (const linea of lineas) {
    if (linea.costo_proveedor == null && linea.precio_base_cliente_aplicado === null) {
      const servicio = await getServicio(linea.servicio_id)
      const precio = servicio?.precio_base_cliente
      if (precio == null) {
        throw new Error(
          `no se puede enviar: falta precio_base_cliente en el servicio de la línea ${linea.id}`,
        )
      }
      aCongelar.push({ id: linea.id, precio })
    }
  }
  patchCotizacion(cotizacionId, { tasa_impuesto_pct_aplicada: config.tasa_impuesto_pct })
  if (aCongelar.length === 0) {
    return
  }
  const precios = new Map(aCongelar.map((item) => [item.id, item.precio]))
  db.lineas = db.lineas.map((linea) => {
    const precio = precios.get(linea.id)
    return precio === undefined ? linea : { ...linea, precio_base_cliente_aplicado: precio }
  })
}

export async function enviarCotizacion(id: string, perfil: Perfil): Promise<CotizacionConLineas> {
  const { cotizacion, ejecutivoId } = await requireCotizacion(id, perfil)
  if (cotizacion.estado !== "borrador") {
    throw new Error("Solo se puede enviar una cotización en borrador")
  }
  assertPuede("enviar", perfil, cotizacion.estado, ejecutivoId)

  const lineas = db.lineas.filter((row) => row.cotizacion_id === id)
  if (lineas.length === 0) {
    throw new Error("No se puede enviar una cotización sin líneas")
  }

  const config = await requireConfig()
  const tasa = config.tasa_impuesto_pct
  if (await requiereAprobacion(lineas, tasa, config.umbral_descuento_aprobacion_pct, config)) {
    const next = patchCotizacion(id, { estado: "preparacion", requiere_aprobacion: true })
    persist(db)
    return conCalculo(next)
  }

  await congelarValoresAlEnviar(id, config)
  const next = patchCotizacion(id, { estado: "enviada", requiere_aprobacion: false })
  persist(db)
  return conCalculo(next)
}

export async function aprobarPreparacion(id: string, perfil: Perfil): Promise<CotizacionConLineas> {
  const { cotizacion, ejecutivoId } = await requireCotizacion(id, perfil)
  if (cotizacion.estado !== "preparacion") {
    throw new Error("Solo se puede aprobar una cotización en preparación")
  }
  assertPuede("aprobar_preparacion", perfil, cotizacion.estado, ejecutivoId)

  const config = await requireConfig()
  await congelarValoresAlEnviar(id, config)
  const next = patchCotizacion(id, { estado: "enviada", aprobado_por: perfil.id })
  persist(db)
  return conCalculo(next)
}

export async function rechazarPreparacion(id: string, perfil: Perfil): Promise<CotizacionConLineas> {
  const { cotizacion, ejecutivoId } = await requireCotizacion(id, perfil)
  if (cotizacion.estado !== "preparacion") {
    throw new Error("Solo se puede rechazar una cotización en preparación")
  }
  assertPuede("rechazar_preparacion", perfil, cotizacion.estado, ejecutivoId)
  const next = patchCotizacion(id, { estado: "rechazada" })
  persist(db)
  return conCalculo(next)
}

async function marcarDesdeEnviada(
  id: string,
  perfil: Perfil,
  accion: Extract<AccionCotizacion, "marcar_aprobada" | "marcar_rechazada" | "marcar_vencida">,
  estado: Extract<Cotizacion["estado"], "aprobada" | "rechazada" | "vencida">,
): Promise<CotizacionConLineas> {
  const { cotizacion, ejecutivoId } = await requireCotizacion(id, perfil)
  if (cotizacion.estado !== "enviada") {
    throw new Error(`Solo se puede marcar como ${estado} una cotización enviada`)
  }
  assertPuede(accion, perfil, cotizacion.estado, ejecutivoId)
  const next = patchCotizacion(id, { estado })
  persist(db)
  return conCalculo(next)
}

export async function marcarAprobada(id: string, perfil: Perfil): Promise<CotizacionConLineas> {
  return marcarDesdeEnviada(id, perfil, "marcar_aprobada", "aprobada")
}

export async function marcarRechazada(id: string, perfil: Perfil): Promise<CotizacionConLineas> {
  return marcarDesdeEnviada(id, perfil, "marcar_rechazada", "rechazada")
}

export async function marcarVencida(id: string, perfil: Perfil): Promise<CotizacionConLineas> {
  return marcarDesdeEnviada(id, perfil, "marcar_vencida", "vencida")
}

export async function ejecutarTransicion(
  id: string,
  perfil: Perfil,
  accion: AccionCotizacion,
): Promise<CotizacionConLineas> {
  switch (accion) {
    case "enviar":
      return enviarCotizacion(id, perfil)
    case "aprobar_preparacion":
      return aprobarPreparacion(id, perfil)
    case "rechazar_preparacion":
      return rechazarPreparacion(id, perfil)
    case "marcar_aprobada":
      return marcarAprobada(id, perfil)
    case "marcar_rechazada":
      return marcarRechazada(id, perfil)
    case "marcar_vencida":
      return marcarVencida(id, perfil)
  }
}

export type PdfCotizacionVariante = "cliente" | "interno"

function pdfStub(texto: string): Blob {
  const escaped = texto.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
  const stream = `BT /F1 16 Tf 50 720 Td (${escaped}) Tj ET`
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >> endobj\n",
    `4 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj\n`,
  ]
  let body = "%PDF-1.4\n"
  const offsets = [0]
  for (const object of objects) {
    offsets.push(body.length)
    body += object
  }
  const xrefStart = body.length
  let xref = "xref\n0 5\n0000000000 65535 f \n"
  for (let i = 1; i <= 4; i += 1) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`
  }
  const pdf = `${body}${xref}trailer << /Size 5 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`
  return new Blob([pdf], { type: "application/pdf" })
}

function abrirBlob(blob: Blob, filename: string, modo: "descargar" | "ver") {
  const url = URL.createObjectURL(blob)
  if (modo === "descargar") {
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
    return
  }
  window.open(url, "_blank", "noopener")
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/**
 * Stub de GET /cotizaciones/{id}/pdf-cliente y /pdf-interno.
 * El PDF real lo genera el backend; aquí solo se simula la descarga/apertura.
 */
export async function abrirPdfCotizacion(input: {
  id: string
  perfil: Perfil
  variante: PdfCotizacionVariante
}): Promise<void> {
  const { cotizacion, ejecutivoId } = await requireCotizacion(input.id, input.perfil)
  if (input.variante === "interno" && !puedeVerDesgloseCotizacion(input.perfil, ejecutivoId)) {
    throw new Error("No tienes permiso para ver el PDF interno")
  }
  const filename =
    input.variante === "interno" ? `${cotizacion.numero}-interno.pdf` : `${cotizacion.numero}.pdf`
  const blob = pdfStub(`STUB ${filename} - GET /cotizaciones/${input.id}/pdf-${input.variante}`)
  abrirBlob(blob, filename, input.variante === "interno" ? "ver" : "descargar")
}
