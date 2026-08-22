/**
 * Mock del pipeline de Oportunidad. Intercambiable vía src/lib/api/oportunidad.ts.
 * list() aplica la misma matriz que RLS: el vendedor solo ve lo suyo aunque pida «equipo».
 */
import {
  MOCK_ORGANIZACION_ID,
  MOCK_SERVICIO_BRANDING_ID,
  MOCK_SERVICIO_PERFORMANCE_ID,
} from "@/lib/mock-config"
import { fetchPerfil } from "@/lib/perfil-api"
import {
  esPerfilElegibleEjecutivo,
  puedeVerEquipo,
  puedeVerModuloVentas,
  scopeEfectivo,
} from "@/lib/pipeline-acceso"
import type { Contacto } from "@/types/contacto"
import type { Empresa } from "@/types/empresa"
import type {
  Oportunidad,
  OportunidadKanban,
  PipelineScope,
} from "@/types/oportunidad"
import type { Perfil } from "@/types/perfil"
import { ETAPA_PIPELINE_CODIGOS, type EtapaPipelineCodigo } from "@/types/etapa-pipeline"

function contactoSeed(
  id: string,
  organizacion_id: string,
  nombre_completo: string,
  empresa_id: string,
): Contacto {
  return {
    id,
    organizacion_id,
    nombre_completo,
    email_trabajo: null,
    telefono_movil: null,
    empresa_id,
    producto_interes: null,
    ciudad: null,
    provincia: null,
    linkedin_url: null,
    fecha_nacimiento: null,
    cargo: null,
    foto_url: null,
    etapa_ciclo_vida: "contacto",
    elegible_marketing: true,
    fuente: null,
    fclid: null,
    gclid: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    propiedades_custom: {},
    activo: true,
    created_at: "2026-03-01T15:00:00.000Z",
  }
}

function empresaSeed(id: string, organizacion_id: string, nombre: string): Empresa {
  return {
    id,
    organizacion_id,
    nombre,
    web: null,
    direccion: null,
    ruc: null,
    sector: null,
    tamano_estimado: null,
    linkedin_url: null,
    logo_url: null,
    datos_enriquecidos: {},
    propiedades_custom: {},
    created_at: "2026-03-01T15:00:00.000Z",
  }
}

const STORAGE_KEY = "prometio-mock-oportunidad-v2"

export const MOCK_EJECUTIVO_ANA_ID = "00000000-0000-4000-a000-000000000101"
export const MOCK_EJECUTIVO_BRUNO_ID = "00000000-0000-4000-a000-000000000102"

type MockEjecutivo = { id: string; nombre_completo: string }

type MockDb = {
  contactos: Contacto[]
  empresas: Empresa[]
  ejecutivos: MockEjecutivo[]
  oportunidades: Oportunidad[]
}

function seed(): MockDb {
  const org = MOCK_ORGANIZACION_ID
  const contactos: Contacto[] = [
    contactoSeed("ct-1", org, "María Cevallos", "em-1"),
    contactoSeed("ct-2", org, "Andrés Paredes", "em-2"),
    contactoSeed("ct-3", org, "Sofía Andrade", "em-3"),
    contactoSeed("ct-4", org, "Diego Molina", "em-4"),
    contactoSeed("ct-5", org, "Paula Ríos", "em-5"),
    contactoSeed("ct-6", org, "Luis Benítez", "em-6"),
    contactoSeed("ct-7", org, "Carolina Vega", "em-7"),
    contactoSeed("ct-8", org, "José Cárdenas", "em-8"),
    contactoSeed("ct-9", org, "Elena Suárez", "em-9"),
    contactoSeed("ct-10", org, "Marco Hidalgo", "em-10"),
  ]
  const empresas: Empresa[] = [
    empresaSeed("em-1", org, "Café de Altura"),
    empresaSeed("em-2", org, "Banco Andino"),
    empresaSeed("em-3", org, "Clínica del Valle"),
    empresaSeed("em-4", org, "TecnoSur"),
    empresaSeed("em-5", org, "Hotel Pacífico"),
    empresaSeed("em-6", org, "Agro Sierra"),
    empresaSeed("em-7", org, "Retail Costa"),
    empresaSeed("em-8", org, "Inmobiliaria Norte"),
    empresaSeed("em-9", org, "Laboratorios Andes"),
    empresaSeed("em-10", org, "Logística del Pacífico"),
  ]
  const ejecutivos: MockEjecutivo[] = [
    { id: MOCK_EJECUTIVO_ANA_ID, nombre_completo: "Ana Pérez" },
    { id: MOCK_EJECUTIVO_BRUNO_ID, nombre_completo: "Bruno Díaz" },
  ]
  const created_at = "2026-03-01T15:00:00.000Z"
  const oportunidades: Oportunidad[] = [
    row("op-1", "ct-1", "em-1", MOCK_EJECUTIVO_ANA_ID, "clasificacion", 4500, null, [MOCK_SERVICIO_BRANDING_ID]),
    row("op-2", "ct-2", "em-2", MOCK_EJECUTIVO_BRUNO_ID, "clasificacion", 12000, null, [MOCK_SERVICIO_PERFORMANCE_ID]),
    row("op-3", "ct-3", "em-3", MOCK_EJECUTIVO_ANA_ID, "descubrimiento", 8000, null, [MOCK_SERVICIO_BRANDING_ID]),
    row("op-4", "ct-4", "em-4", MOCK_EJECUTIVO_BRUNO_ID, "presentacion_inicial", 0, null, [MOCK_SERVICIO_PERFORMANCE_ID]),
    row("op-5", "ct-5", "em-5", MOCK_EJECUTIVO_ANA_ID, "propuesta", 15000, 16200, [MOCK_SERVICIO_BRANDING_ID, MOCK_SERVICIO_PERFORMANCE_ID]),
    row("op-6", "ct-6", "em-6", MOCK_EJECUTIVO_BRUNO_ID, "evaluacion", 9200, null, [MOCK_SERVICIO_BRANDING_ID]),
    row("op-7", "ct-7", "em-7", MOCK_EJECUTIVO_ANA_ID, "negociacion", 11000, 11800, [MOCK_SERVICIO_PERFORMANCE_ID]),
    row("op-9", "ct-9", "em-9", MOCK_EJECUTIVO_ANA_ID, "contratacion", 14000, 15100, [MOCK_SERVICIO_BRANDING_ID]),
    row("op-10", "ct-10", "em-10", MOCK_EJECUTIVO_BRUNO_ID, "cierre_ganado", 7800, 8200, [MOCK_SERVICIO_PERFORMANCE_ID]),
    row("op-8", "ct-8", "em-8", MOCK_EJECUTIVO_BRUNO_ID, "cierre_perdido", 6000, null, [MOCK_SERVICIO_BRANDING_ID], {
      causa_perdida_principal_id: "cp-precio",
      causa_perdida_secundaria_id: "cp-competencia",
    }),
  ].map((item) => ({ ...item, organizacion_id: org, created_at }))
  return { contactos, empresas, ejecutivos, oportunidades }
}

function row(
  id: string,
  contacto_id: string,
  empresa_id: string,
  ejecutivo_id: string,
  etapa: EtapaPipelineCodigo,
  valor_referencial: number | null,
  valor_cotizado: number | null,
  servicios_ids: string[],
  extra?: Partial<Oportunidad>,
): Omit<Oportunidad, "organizacion_id" | "created_at"> {
  return {
    id,
    contacto_id,
    empresa_id,
    ejecutivo_id,
    etapa,
    valor_referencial,
    valor_cotizado,
    probabilidad_cierre: null,
    servicios_ids,
    causa_perdida_principal_id: extra?.causa_perdida_principal_id ?? null,
    causa_perdida_secundaria_id: extra?.causa_perdida_secundaria_id ?? null,
    competidor_mencionado: extra?.competidor_mencionado ?? null,
    fecha_ultima_actividad: extra?.fecha_ultima_actividad ?? null,
    activo: extra?.activo ?? true,
  }
}

function load(): MockDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw) as MockDb
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

let db = load()

function refresh() {
  db = load()
}

function assertAccesoVentas(perfil: Perfil) {
  if (!puedeVerModuloVentas(perfil)) {
    throw new Error("sin acceso al módulo de ventas")
  }
}

function assertPuedeVerOportunidad(perfil: Perfil, row: Oportunidad) {
  assertAccesoVentas(perfil)
  if (!puedeVerEquipo(perfil) && row.ejecutivo_id !== perfil.id) {
    throw new OportunidadFueraDeAlcanceError()
  }
}

function toKanban(item: Oportunidad, perfil: Perfil): OportunidadKanban {
  const contacto = db.contactos.find((row) => row.id === item.contacto_id)
  const empresa = db.empresas.find((row) => row.id === item.empresa_id)
  const ejecutivoSeed = db.ejecutivos.find((row) => row.id === item.ejecutivo_id)
  const ejecutivoNombre =
    item.ejecutivo_id === perfil.id
      ? perfil.nombre_completo
      : (ejecutivoSeed?.nombre_completo ?? "Ejecutivo")
  return {
    ...item,
    contacto: {
      id: item.contacto_id,
      nombre_completo: contacto?.nombre_completo ?? "Contacto",
    },
    empresa: { id: item.empresa_id, nombre: empresa?.nombre ?? "Empresa" },
    ejecutivo: { id: item.ejecutivo_id, nombre_completo: ejecutivoNombre },
  }
}

/** Nombres para pantallas que solo reciben IDs. Si no hay match, el id. */
export function etiquetaContacto(id: string): string {
  refresh()
  return db.contactos.find((row) => row.id === id)?.nombre_completo ?? id
}

export function etiquetaEmpresa(id: string): string {
  refresh()
  return db.empresas.find((row) => row.id === id)?.nombre ?? id
}

export function etiquetaEjecutivo(id: string, perfil: Perfil): string {
  refresh()
  if (id === perfil.id) {
    return perfil.nombre_completo
  }
  return db.ejecutivos.find((row) => row.id === id)?.nombre_completo ?? id
}

export type ListOportunidadesQuery = {
  perfil: Perfil
  scope?: PipelineScope
  servicio_id?: string | null
}

export async function listOportunidades(
  query: ListOportunidadesQuery,
): Promise<OportunidadKanban[]> {
  refresh()
  assertAccesoVentas(query.perfil)
  const scope = scopeEfectivo(query.perfil, query.scope)
  let rows = [...db.oportunidades]
  if (scope === "mio") {
    rows = rows.filter((item) => item.ejecutivo_id === query.perfil.id)
  }
  if (query.servicio_id) {
    rows = rows.filter((item) => item.servicios_ids.includes(query.servicio_id!))
  }
  return rows.map((item) => toKanban(item, query.perfil))
}

export async function getOportunidad(
  id: string,
  perfil: Perfil,
): Promise<OportunidadKanban> {
  refresh()
  const existing = db.oportunidades.find((row) => row.id === id)
  if (!existing) {
    throw new OportunidadNotFoundError()
  }
  assertPuedeVerOportunidad(perfil, existing)
  return toKanban(existing, perfil)
}

export type MoverOportunidadInput = {
  perfil: Perfil
  id: string
  etapa: EtapaPipelineCodigo
  causa_perdida_principal_id?: string
  causa_perdida_secundaria_id?: string
}

export async function moverOportunidad(
  input: MoverOportunidadInput,
): Promise<OportunidadKanban> {
  refresh()
  const existing = db.oportunidades.find((row) => row.id === input.id)
  if (!existing) {
    throw new Error("oportunidad no encontrada")
  }
  assertPuedeVerOportunidad(input.perfil, existing)
  if (!ETAPA_PIPELINE_CODIGOS.includes(input.etapa)) {
    throw new Error("etapa inválida")
  }
  if (input.etapa === "cierre_perdido") {
    const principal = input.causa_perdida_principal_id?.trim() ?? ""
    if (principal === "") {
      throw new Error("causa_perdida_principal_id es obligatorio en Cierre Perdido")
    }
  }
  const next: Oportunidad = {
    ...existing,
    etapa: input.etapa,
  }
  if (input.etapa === "cierre_perdido") {
    next.causa_perdida_principal_id = input.causa_perdida_principal_id ?? null
    const secundaria = input.causa_perdida_secundaria_id?.trim() ?? ""
    next.causa_perdida_secundaria_id = secundaria === "" ? null : secundaria
  }
  db.oportunidades = db.oportunidades.map((row) => (row.id === input.id ? next : row))
  persist(db)
  return toKanban(next, input.perfil)
}

export type ReasignarOportunidadInput = {
  perfil: Perfil
  id: string
  nuevo_ejecutivo_id: string
}

export async function reasignarOportunidad(
  input: ReasignarOportunidadInput,
): Promise<OportunidadKanban> {
  refresh()
  if (!puedeVerEquipo(input.perfil)) {
    throw new Error("solo administrativo o ventas-supervisor puede reasignar")
  }
  const existing = db.oportunidades.find((row) => row.id === input.id)
  if (!existing) {
    throw new Error("oportunidad no encontrada")
  }
  const destId = input.nuevo_ejecutivo_id.trim()
  if (destId === "") {
    throw new Error("nuevo_ejecutivo_id es obligatorio")
  }
  const destino = await fetchPerfil(destId)
  if (!destino || !esPerfilElegibleEjecutivo(destino)) {
    throw new Error("nuevo_ejecutivo_id debe ser un perfil activo de administrativo o ventas")
  }
  const next: Oportunidad = { ...existing, ejecutivo_id: destino.id }
  if (!db.ejecutivos.some((row) => row.id === destino.id)) {
    db.ejecutivos = [
      ...db.ejecutivos,
      { id: destino.id, nombre_completo: destino.nombre_completo },
    ]
  } else {
    db.ejecutivos = db.ejecutivos.map((row) =>
      row.id === destino.id ? { ...row, nombre_completo: destino.nombre_completo } : row,
    )
  }
  db.oportunidades = db.oportunidades.map((row) => (row.id === input.id ? next : row))
  persist(db)
  return toKanban(next, input.perfil)
}
