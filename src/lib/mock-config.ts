import type { CategoriaServicio } from "@/types/categoria-servicio"
import type { CausaPerdida } from "@/types/causa-perdida"
import type { ConfiguracionGeneral } from "@/types/configuracion-general"
import type { EtapaPipeline } from "@/types/etapa-pipeline"
import type { Servicio } from "@/types/servicio"
import type { TarifaInterna } from "@/types/tarifa-interna"
import type { TipoDocumento } from "@/types/tipo-documento"

const STORAGE_KEY = "prometio-mock-config-v2"

export const MOCK_ORGANIZACION_ID = "00000000-0000-4000-a000-000000000001"

type MockDb = {
  tarifas_internas: TarifaInterna[]
  causas_perdida: CausaPerdida[]
  categorias_servicio: CategoriaServicio[]
  tipos_documento: TipoDocumento[]
  etapa_pipeline: EtapaPipeline[]
  configuracion_general: ConfiguracionGeneral | null
  servicios: Servicio[]
}

function seed(): MockDb {
  return {
    tarifas_internas: [
      {
        id: "ti-disenador-jr",
        organizacion_id: MOCK_ORGANIZACION_ID,
        nombre_rol: "Diseñador Jr",
        modelo: "por_hora",
        costo_hora: 12,
        costo_mensual: null,
        costo_evento: null,
      },
      {
        id: "ti-disenador-sr",
        organizacion_id: MOCK_ORGANIZACION_ID,
        nombre_rol: "Diseñador Sr",
        modelo: "por_hora",
        costo_hora: 22,
        costo_mensual: null,
        costo_evento: null,
      },
      {
        id: "ti-copy",
        organizacion_id: MOCK_ORGANIZACION_ID,
        nombre_rol: "Copywriter",
        modelo: "por_hora",
        costo_hora: 18,
        costo_mensual: null,
        costo_evento: null,
      },
      {
        id: "ti-community",
        organizacion_id: MOCK_ORGANIZACION_ID,
        nombre_rol: "Community Manager",
        modelo: "por_hora",
        costo_hora: 14,
        costo_mensual: null,
        costo_evento: null,
      },
      {
        id: "ti-cuenta",
        organizacion_id: MOCK_ORGANIZACION_ID,
        nombre_rol: "Director de cuenta",
        modelo: "por_hora",
        costo_hora: 28,
        costo_mensual: null,
        costo_evento: null,
      },
    ],
    causas_perdida: [
      { id: "cp-precio", organizacion_id: MOCK_ORGANIZACION_ID, nombre: "Precio" },
      {
        id: "cp-competencia",
        organizacion_id: MOCK_ORGANIZACION_ID,
        nombre: "Competencia",
      },
      {
        id: "cp-presupuesto",
        organizacion_id: MOCK_ORGANIZACION_ID,
        nombre: "Falta de presupuesto",
      },
      {
        id: "cp-contacto",
        organizacion_id: MOCK_ORGANIZACION_ID,
        nombre: "Pérdida de contacto",
      },
    ],
    categorias_servicio: [
      {
        id: "cat-creatividad",
        organizacion_id: MOCK_ORGANIZACION_ID,
        nombre: "Creatividad",
      },
      {
        id: "cat-media",
        organizacion_id: MOCK_ORGANIZACION_ID,
        nombre: "Media",
      },
    ],
    tipos_documento: [
      {
        id: "td-cotizacion",
        organizacion_id: MOCK_ORGANIZACION_ID,
        nombre: "Cotización",
        plantilla_base: null,
      },
      {
        id: "td-alcance",
        organizacion_id: MOCK_ORGANIZACION_ID,
        nombre: "Documento de Alcance",
        plantilla_base: null,
      },
      {
        id: "td-fee-creativo",
        organizacion_id: MOCK_ORGANIZACION_ID,
        nombre: "Propuesta de Fee Creativo",
        plantilla_base: null,
      },
      {
        id: "td-contrato",
        organizacion_id: MOCK_ORGANIZACION_ID,
        nombre: "Contrato",
        plantilla_base: null,
      },
    ],
    etapa_pipeline: [
      {
        id: "ep-1",
        organizacion_id: MOCK_ORGANIZACION_ID,
        codigo: "clasificacion",
        nombre: "Clasificación",
        orden: 1,
        probabilidad_cierre_default_pct: 10,
        umbral_alerta_horas: 120,
      },
      {
        id: "ep-2",
        organizacion_id: MOCK_ORGANIZACION_ID,
        codigo: "descubrimiento",
        nombre: "Descubrimiento",
        orden: 2,
        probabilidad_cierre_default_pct: 20,
        umbral_alerta_horas: 72,
      },
      {
        id: "ep-3",
        organizacion_id: MOCK_ORGANIZACION_ID,
        codigo: "presentacion_inicial",
        nombre: "Presentación Inicial",
        orden: 3,
        probabilidad_cierre_default_pct: 35,
        umbral_alerta_horas: 72,
      },
      {
        id: "ep-4",
        organizacion_id: MOCK_ORGANIZACION_ID,
        codigo: "propuesta",
        nombre: "Propuesta",
        orden: 4,
        probabilidad_cierre_default_pct: 50,
        umbral_alerta_horas: 72,
      },
      {
        id: "ep-5",
        organizacion_id: MOCK_ORGANIZACION_ID,
        codigo: "evaluacion",
        nombre: "Evaluación",
        orden: 5,
        probabilidad_cierre_default_pct: 60,
        umbral_alerta_horas: 120,
      },
      {
        id: "ep-6",
        organizacion_id: MOCK_ORGANIZACION_ID,
        codigo: "negociacion",
        nombre: "Negociación",
        orden: 6,
        probabilidad_cierre_default_pct: 75,
        umbral_alerta_horas: 60,
      },
      {
        id: "ep-7",
        organizacion_id: MOCK_ORGANIZACION_ID,
        codigo: "contratacion",
        nombre: "Contratación",
        orden: 7,
        probabilidad_cierre_default_pct: 90,
        umbral_alerta_horas: 72,
      },
      {
        id: "ep-8",
        organizacion_id: MOCK_ORGANIZACION_ID,
        codigo: "cierre_ganado",
        nombre: "Cierre Ganado",
        orden: 8,
        probabilidad_cierre_default_pct: 100,
        umbral_alerta_horas: null,
      },
      {
        id: "ep-9",
        organizacion_id: MOCK_ORGANIZACION_ID,
        codigo: "cierre_perdido",
        nombre: "Cierre Perdido",
        orden: 9,
        probabilidad_cierre_default_pct: 0,
        umbral_alerta_horas: null,
      },
    ],
    configuracion_general: null,
    servicios: seedServiciosDemo(),
  }
}

export const MOCK_SERVICIO_BRANDING_ID = "svc-branding"
export const MOCK_SERVICIO_PERFORMANCE_ID = "svc-performance"

function seedServiciosDemo(): Servicio[] {
  const now = "2026-01-15T12:00:00.000Z"
  return [
    {
      id: MOCK_SERVICIO_BRANDING_ID,
      organizacion_id: MOCK_ORGANIZACION_ID,
      nombre: "Branding",
      descripcion: "Identidad y sistema visual.",
      categoria_id: "cat-creatividad",
      categoria_nombre: "Creatividad",
      pilar: "marca",
      modelo_cobro: "fee_fijo",
      tiene_fases: false,
      precio_base_cliente: 8000,
      estimacion_interna_por_rol: null,
      fases: null,
      config_fee: { monto: 8000, duracion_minima: 1, ciclo_renovacion: "unico" },
      margen_default_pct: 30,
      comision_sugerida_min_pct: 13,
      comision_sugerida_max_pct: 20,
      tipos_documento_requeridos: ["td-cotizacion"],
      estado: "activo",
      created_by: "seed",
      created_at: now,
      contifico_producto_id: null,
    },
    {
      id: MOCK_SERVICIO_PERFORMANCE_ID,
      organizacion_id: MOCK_ORGANIZACION_ID,
      nombre: "Performance Ads",
      descripcion: "Pauta paga y optimización.",
      categoria_id: "cat-media",
      categoria_nombre: "Media",
      pilar: "crecimiento",
      modelo_cobro: "fee_recurrente",
      tiene_fases: false,
      precio_base_cliente: 2500,
      estimacion_interna_por_rol: null,
      fases: null,
      config_fee: { monto: 2500, duracion_minima: 3, ciclo_renovacion: "mensual" },
      margen_default_pct: 30,
      comision_sugerida_min_pct: 13,
      comision_sugerida_max_pct: 20,
      tipos_documento_requeridos: ["td-cotizacion"],
      estado: "activo",
      created_by: "seed",
      created_at: now,
      contifico_producto_id: null,
    },
  ]
}

function ensureServiciosDemo(db: MockDb): MockDb {
  const missing = seedServiciosDemo().filter(
    (servicio) => !db.servicios.some((row) => row.id === servicio.id),
  )
  if (missing.length === 0) {
    return db
  }
  const next = { ...db, servicios: [...db.servicios, ...missing] }
  persist(next)
  return next
}

function load(): MockDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as MockDb
      if (
        parsed.etapa_pipeline?.length === 9 &&
        "umbral_alerta_horas" in parsed.etapa_pipeline[0]
      ) {
        return ensureServiciosDemo(parsed)
      }
    }
  } catch {
    /* seed */
  }
  const initial = seed()
  persist(initial)
  return initial
}

function persist(db: MockDb) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

let db = load()

function refresh() {
  db = load()
}

export async function listTarifasInternas(): Promise<TarifaInterna[]> {
  refresh()
  return [...db.tarifas_internas]
}

export async function upsertTarifaInterna(
  input: Omit<TarifaInterna, "id"> & { id?: string },
): Promise<TarifaInterna> {
  refresh()
  if (input.id) {
    db.tarifas_internas = db.tarifas_internas.map((row) =>
      row.id === input.id ? { ...row, ...input, id: input.id } : row,
    )
    persist(db)
    return db.tarifas_internas.find((row) => row.id === input.id)!
  }
  const created: TarifaInterna = { ...input, id: crypto.randomUUID() }
  db.tarifas_internas.push(created)
  persist(db)
  return created
}

export async function deleteTarifaInterna(id: string): Promise<void> {
  refresh()
  db.tarifas_internas = db.tarifas_internas.filter((row) => row.id !== id)
  persist(db)
}

export async function listCausasPerdida(): Promise<CausaPerdida[]> {
  refresh()
  return [...db.causas_perdida]
}

export async function upsertCausaPerdida(
  input: Omit<CausaPerdida, "id"> & { id?: string },
): Promise<CausaPerdida> {
  refresh()
  if (input.id) {
    db.causas_perdida = db.causas_perdida.map((row) =>
      row.id === input.id ? { ...row, ...input, id: input.id } : row,
    )
    persist(db)
    return db.causas_perdida.find((row) => row.id === input.id)!
  }
  const created: CausaPerdida = { ...input, id: crypto.randomUUID() }
  db.causas_perdida.push(created)
  persist(db)
  return created
}

export async function deleteCausaPerdida(id: string): Promise<void> {
  refresh()
  db.causas_perdida = db.causas_perdida.filter((row) => row.id !== id)
  persist(db)
}

export async function listTiposDocumento(): Promise<TipoDocumento[]> {
  refresh()
  return [...db.tipos_documento]
}

export async function upsertTipoDocumento(
  input: Omit<TipoDocumento, "id"> & { id?: string },
): Promise<TipoDocumento> {
  refresh()
  if (input.id) {
    db.tipos_documento = db.tipos_documento.map((row) =>
      row.id === input.id ? { ...row, ...input, id: input.id } : row,
    )
    persist(db)
    return db.tipos_documento.find((row) => row.id === input.id)!
  }
  const created: TipoDocumento = { ...input, id: crypto.randomUUID() }
  db.tipos_documento.push(created)
  persist(db)
  return created
}

export async function deleteTipoDocumento(id: string): Promise<void> {
  refresh()
  db.tipos_documento = db.tipos_documento.filter((row) => row.id !== id)
  persist(db)
}

export async function listEtapasPipeline(): Promise<EtapaPipeline[]> {
  refresh()
  return [...db.etapa_pipeline].sort((a, b) => a.orden - b.orden)
}

export async function updateEtapaPipeline(
  id: string,
  patch: Pick<EtapaPipeline, "probabilidad_cierre_default_pct" | "umbral_alerta_horas">,
): Promise<EtapaPipeline> {
  refresh()
  db.etapa_pipeline = db.etapa_pipeline.map((row) =>
    row.id === id ? { ...row, ...patch } : row,
  )
  persist(db)
  const updated = db.etapa_pipeline.find((row) => row.id === id)
  if (!updated) {
    throw new Error("etapa_pipeline no encontrada")
  }
  return updated
}

const CONFIGURACION_GENERAL_DEFAULTS = {
  margen_agencia_default_pct: 30,
  comision_agencia_default_min_pct: 13,
  comision_agencia_default_max_pct: 20,
  umbral_descuento_aprobacion_pct: 10,
  multiplicador_escalamiento_supervisor: 2,
} as const

type ConfiguracionGeneralWrite = {
  organizacion_id: string
  tasa_impuesto_pct?: unknown
  margen_agencia_default_pct?: unknown
  comision_agencia_default_min_pct?: unknown
  comision_agencia_default_max_pct?: unknown
  umbral_descuento_aprobacion_pct?: unknown
  multiplicador_escalamiento_supervisor?: unknown
  horas_laborales_mes?: unknown
}

function requireNumber(value: unknown, field: string): number {
  if (value === null || value === undefined) {
    throw new Error(`${field} es obligatorio`)
  }
  if (typeof value === "string") {
    const raw = value.trim()
    if (raw === "") {
      throw new Error(`${field} debe ser numérico`)
    }
    const parsed = Number(raw)
    if (Number.isNaN(parsed)) {
      throw new Error(`${field} debe ser numérico`)
    }
    return parsed
  }
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${field} debe ser numérico`)
  }
  return value
}

function requireTasaImpuestoPct(value: unknown): number {
  if (value === null || value === undefined) {
    throw new Error("tasa_impuesto_pct es obligatorio")
  }
  if (typeof value === "string" && value.trim() === "") {
    throw new Error("tasa_impuesto_pct es obligatorio")
  }
  return requireNumber(value, "tasa_impuesto_pct")
}

function numberOrDefault(value: unknown, field: keyof typeof CONFIGURACION_GENERAL_DEFAULTS): number {
  if (value === undefined) {
    return CONFIGURACION_GENERAL_DEFAULTS[field]
  }
  return requireNumber(value, field)
}

export async function getConfiguracionGeneral(): Promise<ConfiguracionGeneral | null> {
  refresh()
  return db.configuracion_general ? { ...db.configuracion_general } : null
}

export async function createConfiguracionGeneral(
  input: ConfiguracionGeneralWrite,
): Promise<ConfiguracionGeneral> {
  refresh()
  if (db.configuracion_general) {
    throw new Error("configuracion_general ya existe")
  }
  const created: ConfiguracionGeneral = {
    id: crypto.randomUUID(),
    organizacion_id: input.organizacion_id,
    tasa_impuesto_pct: requireTasaImpuestoPct(input.tasa_impuesto_pct),
    margen_agencia_default_pct: numberOrDefault(
      input.margen_agencia_default_pct,
      "margen_agencia_default_pct",
    ),
    comision_agencia_default_min_pct: numberOrDefault(
      input.comision_agencia_default_min_pct,
      "comision_agencia_default_min_pct",
    ),
    comision_agencia_default_max_pct: numberOrDefault(
      input.comision_agencia_default_max_pct,
      "comision_agencia_default_max_pct",
    ),
    umbral_descuento_aprobacion_pct: numberOrDefault(
      input.umbral_descuento_aprobacion_pct,
      "umbral_descuento_aprobacion_pct",
    ),
    multiplicador_escalamiento_supervisor: numberOrDefault(
      input.multiplicador_escalamiento_supervisor,
      "multiplicador_escalamiento_supervisor",
    ),
    horas_laborales_mes:
      input.horas_laborales_mes === undefined
        ? 240
        : requireNumber(input.horas_laborales_mes, "horas_laborales_mes"),
    resend_dashboard_url: "https://resend.com/overview",
  }
  db.configuracion_general = created
  persist(db)
  return { ...created }
}

export async function updateConfiguracionGeneral(
  patch: Omit<ConfiguracionGeneralWrite, "organizacion_id">,
): Promise<ConfiguracionGeneral> {
  refresh()
  if (!db.configuracion_general) {
    throw new Error("configuracion_general no existe")
  }
  const changes: Partial<Omit<ConfiguracionGeneral, "id" | "organizacion_id">> = {}
  if ("tasa_impuesto_pct" in patch) {
    changes.tasa_impuesto_pct = requireNumber(patch.tasa_impuesto_pct, "tasa_impuesto_pct")
  }
  if ("margen_agencia_default_pct" in patch) {
    changes.margen_agencia_default_pct = requireNumber(
      patch.margen_agencia_default_pct,
      "margen_agencia_default_pct",
    )
  }
  if ("comision_agencia_default_min_pct" in patch) {
    changes.comision_agencia_default_min_pct = requireNumber(
      patch.comision_agencia_default_min_pct,
      "comision_agencia_default_min_pct",
    )
  }
  if ("comision_agencia_default_max_pct" in patch) {
    changes.comision_agencia_default_max_pct = requireNumber(
      patch.comision_agencia_default_max_pct,
      "comision_agencia_default_max_pct",
    )
  }
  if ("umbral_descuento_aprobacion_pct" in patch) {
    changes.umbral_descuento_aprobacion_pct = requireNumber(
      patch.umbral_descuento_aprobacion_pct,
      "umbral_descuento_aprobacion_pct",
    )
  }
  if ("multiplicador_escalamiento_supervisor" in patch) {
    changes.multiplicador_escalamiento_supervisor = requireNumber(
      patch.multiplicador_escalamiento_supervisor,
      "multiplicador_escalamiento_supervisor",
    )
  }
  if ("horas_laborales_mes" in patch) {
    changes.horas_laborales_mes = requireNumber(patch.horas_laborales_mes, "horas_laborales_mes")
  }
  db.configuracion_general = { ...db.configuracion_general, ...changes }
  persist(db)
  return { ...db.configuracion_general }
}

export async function listServicios(): Promise<Servicio[]> {
  refresh()
  return [...db.servicios].sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function getServicio(id: string): Promise<Servicio | null> {
  refresh()
  return db.servicios.find((row) => row.id === id) ?? null
}

export async function upsertServicio(
  input: Omit<Servicio, "id" | "created_at"> & { id?: string; created_at?: string },
): Promise<Servicio> {
  refresh()
  if (input.id) {
    const existing = db.servicios.find((row) => row.id === input.id)
    if (!existing) {
      throw new Error("servicio no encontrado")
    }
    const updated: Servicio = {
      ...existing,
      ...input,
      id: existing.id,
      created_at: existing.created_at,
    }
    db.servicios = db.servicios.map((row) => (row.id === existing.id ? updated : row))
    persist(db)
    return updated
  }
  const created: Servicio = {
    ...input,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  }
  db.servicios.push(created)
  persist(db)
  return created
}

export async function activarServicio(id: string): Promise<Servicio> {
  refresh()
  const existing = db.servicios.find((row) => row.id === id)
  if (!existing) {
    throw new Error("servicio no encontrado")
  }
  const updated: Servicio = { ...existing, estado: "activo" }
  db.servicios = db.servicios.map((row) => (row.id === id ? updated : row))
  persist(db)
  return updated
}
